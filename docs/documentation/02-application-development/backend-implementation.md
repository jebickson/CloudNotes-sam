---
description: >-
  Detailed explanation of the Python AWS Lambda backend, request handling,
  DynamoDB operations, validation, and error handling.
---

# Backend Implementation

## 1. Backend Overview

The CloudNotes backend is developed using Python and deployed as an AWS Lambda function.

It provides REST API functionality for creating, retrieving, updating, and deleting notes. Amazon DynamoDB is used as the persistent data store.

## 2. Backend Technology

| Component            | Technology         |
| -------------------- | ------------------ |
| Programming Language | Python             |
| Cloud Compute        | AWS Lambda         |
| Database SDK         | Boto3              |
| Database             | Amazon DynamoDB    |
| API Integration      | Amazon API Gateway |
| Infrastructure       | AWS SAM            |

## 3. Backend Project Structure

The backend source code is located in the `hello_world/` directory.

Important files:

* `app.py` – Contains the Lambda handler and application logic.
* `requirements.txt` – Contains Python dependencies.

## 4. Lambda Handler

The main entry point is the `lambda_handler(event, context)` function.

It receives API Gateway event data and determines which operation should be performed based on the HTTP method and request path.

The handler supports:

* GET – Retrieve notes.
* POST – Create a note.
* PUT – Update an existing note.
* DELETE – Delete a note.
* OPTIONS – Handle browser CORS preflight requests.

## 5. DynamoDB Connection

The backend uses the Boto3 library to communicate with Amazon DynamoDB.

The table name is configured through the `TABLE_NAME` environment variable, with `CloudNotes` as its default value.

The AWS region is configured through `AWS_REGION`, with `eu-north-1` as its fallback.

## 6. Main Backend Functions

### 6.1 response()

Creates a standardized API response containing the HTTP status code, response headers, and JSON response body.

### 6.2 parse\_body()

Reads and parses the incoming JSON request body. Invalid JSON or an unsupported body format returns a 400 error.

### 6.3 get\_user\_id()

Reads the visitor identifier from the `X-User-Id` request header and validates its format.

### 6.4 public\_note()

Formats note data for API responses. It returns the note ID, title, and content without exposing the internal user ID.

### 6.5 lambda\_handler()

Routes incoming requests to the appropriate CRUD operation and handles database interactions.

## 7. CRUD Operations

### Create Note

* HTTP method: POST
* Endpoint: `/notes`
* Requires a note title.
* Generates a unique note ID using UUID.
* Stores the note in DynamoDB.

### Retrieve Notes

* HTTP method: GET
* Endpoint: `/notes`
* Retrieves notes belonging to the current visitor.
* Uses DynamoDB scan pagination to collect results.

### Retrieve a Single Note

* HTTP method: GET
* Endpoint: `/notes/{id}`
* Retrieves a note using its ID.
* Checks whether the note belongs to the requesting visitor.

### Update Note

* HTTP method: PUT
* Endpoint: `/notes/{id}`
* Updates the note title and/or content.
* Validates the updated values before saving.

### Delete Note

* HTTP method: DELETE
* Endpoint: `/notes/{id}`
* Deletes the selected note after checking ownership.

## 8. Request Validation and Error Handling

The backend validates request data and returns appropriate HTTP status codes.

| Status Code | Description                    |
| ----------- | ------------------------------ |
| 200         | Request completed successfully |
| 201         | Note created successfully      |
| 400         | Invalid request data           |
| 401         | Missing or invalid user ID     |
| 404         | Note or route not found        |
| 405         | HTTP method not allowed        |
| 500         | Database operation failed      |

## 9. Data Isolation

CloudNotes uses an `X-User-Id` header to associate notes with individual browser visitors.

The backend checks ownership before returning, updating, or deleting an individual note.

This provides basic visitor-level data separation. It is not a replacement for proper user authentication.

## 10. Source Code

The complete backend implementation is available in the GitHub repository:

[https://github.com/jebickson/CloudNotes-sam](https://github.com/jebickson/CloudNotes-sam)

Source file: `hello_world/app.py`
