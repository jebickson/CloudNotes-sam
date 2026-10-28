import json
import os
import uuid

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

# DynamoDB connection
REGION = os.environ.get("AWS_REGION", "eu-north-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "CloudNotes")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

# CORS headers returned on every response
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-User-Id",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json",
}


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def parse_body(event):
    """Return (body_dict, error_response). One of them is always None."""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return None, response(400, {"message": "Invalid JSON"})

    if not isinstance(body, dict):
        return None, response(400, {"message": "Invalid request body"})

    return body, None


def get_user_id(event):
    """Read the visitor's private ID from the X-User-Id header."""
    headers = event.get("headers") or {}
    for key, value in headers.items():
        if key.lower() == "x-user-id":
            value = (value or "").strip()
            if 16 <= len(value) <= 64 and all(c.isalnum() or c in "-_" for c in value):
                return value
    return None


def public_note(note):
    """Never send the userId back to the browser."""
    return {
        "id": note["id"],
        "title": note.get("title", ""),
        "content": note.get("content", ""),
    }


def lambda_handler(event, context):
    method = event.get("httpMethod", "")
    path = event.get("path", "/").rstrip("/") or "/"

    # Browser preflight request: answer before anything else
    if method == "OPTIONS":
        return response(200, {})

    user_id = get_user_id(event)
    if not user_id:
        return response(401, {"message": "Missing or invalid user id"})

    try:
        # GET all of this user's notes
        if path == "/notes" and method == "GET":
            kwargs = {"FilterExpression": Attr("userId").eq(user_id)}
            items = []
            while True:
                result = table.scan(**kwargs)
                items.extend(result.get("Items", []))
                if "LastEvaluatedKey" not in result:
                    break
                kwargs["ExclusiveStartKey"] = result["LastEvaluatedKey"]
            return response(200, [public_note(n) for n in items])

        # CREATE a note
        if path == "/notes" and method == "POST":
            body, error = parse_body(event)
            if error:
                return error

            if not body.get("title"):
                return response(400, {"message": "Title is required"})

            note = {
                "id": str(uuid.uuid4()),
                "userId": user_id,
                "title": body["title"],
                "content": body.get("content", ""),
            }

            table.put_item(Item=note)
            return response(201, public_note(note))

        # Operations on one note: /notes/{id}
        if path.startswith("/notes/"):
            note_id = path.split("/")[-1]

            if method not in ("GET", "PUT", "DELETE"):
                return response(405, {"message": "Method not allowed"})

            result = table.get_item(Key={"id": note_id})
            note = result.get("Item")

            # Notes that belong to someone else look like they don't exist
            if not note or note.get("userId") != user_id:
                return response(404, {"message": "Note not found"})

            if method == "GET":
                return response(200, public_note(note))

            if method == "PUT":
                body, error = parse_body(event)
                if error:
                    return error

                title = body.get("title", note["title"])
                content = body.get("content", note.get("content", ""))

                if not isinstance(title, str) or not title.strip():
                    return response(400, {"message": "Title cannot be empty"})

                if not isinstance(content, str):
                    return response(400, {"message": "Content must be text"})

                table.update_item(
                    Key={"id": note_id},
                    UpdateExpression="SET #t = :t, #c = :c",
                    ExpressionAttributeNames={"#t": "title", "#c": "content"},
                    ExpressionAttributeValues={":t": title, ":c": content},
                )

                return response(200, {"id": note_id, "title": title, "content": content})

            if method == "DELETE":
                table.delete_item(Key={"id": note_id})
                return response(200, {"message": "Note deleted"})

        return response(404, {"message": "Route not found"})

    except ClientError as e:
        print("DynamoDB error:", e.response["Error"])
        return response(500, {"message": "Database operation failed"})