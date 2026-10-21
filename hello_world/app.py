
import json
import os
import uuid
import boto3
from botocore.exceptions import ClientError

# DynamoDB connection
REGION = os.environ.get("AWS_REGION", "eu-north-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "CloudNotes")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


# Standard API response
def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }


# Main Lambda handler
def lambda_handler(event, context):
    method = event.get("httpMethod", "")
    path = event.get("path", "/")

    try:
        # GET all notes
        if path.rstrip("/") == "/notes" and method == "GET":
            result = table.scan()
            return response(200, result.get("Items", []))

        # CREATE a note
        if path.rstrip("/") == "/notes" and method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return response(400, {"message": "Invalid JSON"})

            if not isinstance(body, dict) or not body.get("title"):
                return response(400, {"message": "Title is required"})

            note = {
                "id": str(uuid.uuid4()),
                "title": body["title"],
                "content": body.get("content", "")
            }

            table.put_item(Item=note)
            return response(201, note)

        # Operations on one note: /notes/{id}
        if path.startswith("/notes/"):
            note_id = path.rstrip("/").split("/")[-1]

            result = table.get_item(Key={"id": note_id})
            note = result.get("Item")

            if not note:
                return response(404, {"message": "Note not found"})

            # GET one note
            if method == "GET":
                return response(200, note)

            # UPDATE a note
            if method == "PUT":
                try:
                    body = json.loads(event.get("body") or "{}")
                except json.JSONDecodeError:
                    return response(400, {"message": "Invalid JSON"})

                if not isinstance(body, dict):
                    return response(400, {"message": "Invalid request body"})

                title = body.get("title", note["title"])
                content = body.get("content", note.get("content", ""))

                if not isinstance(title, str) or not title.strip():
                    return response(400, {"message": "Title cannot be empty"})

                if not isinstance(content, str):
                    return response(400, {"message": "Content must be text"})

                table.update_item(
                    Key={"id": note_id},
                    UpdateExpression="SET #t = :t, #c = :c",
                    ExpressionAttributeNames={
                        "#t": "title",
                        "#c": "content"
                    },
                    ExpressionAttributeValues={
                        ":t": title,
                        ":c": content
                    }
                )

                return response(200, {
                    "id": note_id,
                    "title": title,
                    "content": content
                })

            # DELETE a note
            if method == "DELETE":
                table.delete_item(Key={"id": note_id})
                return response(200, {"message": "Note deleted"})

        return response(404, {"message": "Route not found"})
    
    except ClientError as e:
        print("DynamoDB error:", e.response["Error"])
        return response(500, {"message": "Database operation failed"})