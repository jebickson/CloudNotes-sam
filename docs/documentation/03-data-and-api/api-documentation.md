---
description: >-
  API endpoints, HTTP methods, request headers, request parameters, response
  formats, and error handling for CloudNotes.
---

# API Documentation

## CloudNotes API Documentation

### 1. API Overview

CloudNotes uses Amazon API Gateway to expose HTTP endpoints that communicate with a Python-based AWS Lambda backend.

The backend processes requests and interacts with Amazon DynamoDB to create, retrieve, update, and delete notes.

#### API Architecture

```
Client Application
       |
       | HTTP Request
       v
Amazon API Gateway
       |
       v
AWS Lambda (Python)
       |
       v
Amazon DynamoDB
       |
       v
HTTP Response
```

### 2. Base URL

The API base URL is the deployed Amazon API Gateway endpoint.

```
https://your-api-id.execute-api.eu-north-1.amazonaws.com/Prod
```

Replace the example with your actual deployed API Gateway URL.

### 3. Request Headers

The API requires the following visitor identifier header for note operations:

| Header        | Required                         | Description                    |
| ------------- | -------------------------------- | ------------------------------ |
| Content-Type  | For JSON requests                | Specifies application/json     |
| X-User-Id     | Yes, except OPTIONS              | Identifies the visitor         |
| Authorization | Not validated by current handler | Listed in CORS allowed headers |

#### X-User-Id Format

The visitor identifier must:

* Contain between 16 and 64 characters.
* Use letters and numbers.
* Optionally contain hyphens and underscores.

Example:

```
X-User-Id: visitor_1234567890
Content-Type: application/json
```

The example identifier meets the required length and character rules.

### 4. API Endpoints

The backend implements the following endpoints.

| Method  | Endpoint      | Description                    |
| ------- | ------------- | ------------------------------ |
| GET     | `/notes`      | Retrieve all visitor notes     |
| POST    | `/notes`      | Create a note                  |
| GET     | `/notes/{id}` | Retrieve a specific note       |
| PUT     | `/notes/{id}` | Update a note                  |
| DELETE  | `/notes/{id}` | Delete a note                  |
| OPTIONS | API routes    | Handle CORS preflight requests |

### 5. Create a Note

Creates a new note for the requesting visitor.

#### Request

```
POST /notes
Content-Type: application/json
X-User-Id: visitor_1234567890
```

#### Request Body

```
{
  "title": "My First Note",
  "content": "This is my first CloudNotes note."
}
```

The `title` field is required. The `content` field is optional and defaults to an empty string.

#### Successful Response

**HTTP Status:** `201 Created`

```
{
  "id": "generated-uuid",
  "title": "My First Note",
  "content": "This is my first CloudNotes note."
}
```

The backend generates a unique UUID for each new note.

#### Possible Errors

| Status | Message                    |
| ------ | -------------------------- |
| 400    | Invalid JSON               |
| 400    | Invalid request body       |
| 400    | Title is required          |
| 401    | Missing or invalid user id |
| 500    | Database operation failed  |

### 6. Retrieve All Notes

Retrieves all notes belonging to the requesting visitor.

#### Request

```
GET /notes
X-User-Id: visitor_1234567890
```

#### Successful Response

**HTTP Status:** `200 OK`

```
[
  {
    "id": "note-uuid-1",
    "title": "My First Note",
    "content": "This is my first CloudNotes note."
  },
  {
    "id": "note-uuid-2",
    "title": "Learning AWS",
    "content": "Studying Lambda and DynamoDB."
  }
]
```

The backend uses DynamoDB scan pagination to retrieve matching notes.

If the visitor has no notes, the API returns an empty array:

```
[]
```

### 7. Retrieve a Single Note

Retrieves a specific note using its unique ID.

#### Request

```
GET /notes/{id}
X-User-Id: visitor_1234567890
```

Example:

```
GET /notes/note-uuid-1
```

#### Successful Response

**HTTP Status:** `200 OK`

```
{
  "id": "note-uuid-1",
  "title": "My First Note",
  "content": "This is my first CloudNotes note."
}
```

#### Possible Errors

| Status | Message                    |
| ------ | -------------------------- |
| 401    | Missing or invalid user id |
| 404    | Note not found             |
| 500    | Database operation failed  |

A note belonging to another visitor is also returned as not found.

### 8. Update a Note

Updates the title and/or content of an existing note.

#### Request

```
PUT /notes/{id}
Content-Type: application/json
X-User-Id: visitor_1234567890
```

#### Request Body

```
{
  "title": "Updated Note Title",
  "content": "Updated note content."
}
```

Both fields are optional in an update request. If a field is omitted, its existing value is retained.

#### Successful Response

**HTTP Status:** `200 OK`

```
{
  "id": "note-uuid-1",
  "title": "Updated Note Title",
  "content": "Updated note content."
}
```

#### Possible Errors

| Status | Message                    |
| ------ | -------------------------- |
| 400    | Invalid JSON               |
| 400    | Invalid request body       |
| 400    | Title cannot be empty      |
| 400    | Content must be text       |
| 401    | Missing or invalid user id |
| 404    | Note not found             |
| 500    | Database operation failed  |

### 9. Delete a Note

Deletes an existing note belonging to the requesting visitor.

#### Request

```
DELETE /notes/{id}
X-User-Id: visitor_1234567890
```

#### Successful Response

**HTTP Status:** `200 OK`

```
{
  "message": "Note deleted"
}
```

#### Possible Errors

| Status | Message                    |
| ------ | -------------------------- |
| 401    | Missing or invalid user id |
| 404    | Note not found             |
| 500    | Database operation failed  |

### 10. CORS Configuration

The backend returns CORS headers on every response.

| Header                       | Configured Value                       |
| ---------------------------- | -------------------------------------- |
| Access-Control-Allow-Origin  | `*`                                    |
| Access-Control-Allow-Headers | `Content-Type,Authorization,X-User-Id` |
| Access-Control-Allow-Methods | `GET,POST,PUT,DELETE,OPTIONS`          |
| Content-Type                 | `application/json`                     |

The OPTIONS method handles browser preflight requests and returns HTTP 200 with an empty JSON object.

### 11. HTTP Status Codes

| Status Code | Description                           |
| ----------- | ------------------------------------- |
| 200         | Request completed successfully        |
| 201         | Note created successfully             |
| 400         | Invalid request data                  |
| 401         | Missing or invalid visitor identifier |
| 404         | Requested route or note not found     |
| 405         | HTTP method not allowed               |
| 500         | DynamoDB operation failed             |

### 12. Error Response Format

Error responses use a JSON object containing a message field.

Example:

```
{
  "message": "Note not found"
}
```

### 13. Data Privacy and Ownership

CloudNotes uses the `X-User-Id` request header to associate notes with individual visitors.

Each stored note contains an internal `userId` attribute. The backend checks ownership before retrieving, updating, or deleting a specific note.

The `public_note()` function removes the internal user identifier before returning note information to the browser.

**Security note:** The current implementation does not validate a signed authentication token. The visitor ID header is an identifier, not secure authentication. Production applications should use a trusted identity provider and enforce authorization using verified identities.

### 14. Backend Source Code

The API implementation is available in:

`hello_world/app.py`

GitHub Repository:

[https://github.com/jebickson/CloudNotes-sam](https://github.com/jebickson/CloudNotes-sam)

### 15. API Summary

The CloudNotes API provides the core operations required for notes management through HTTP endpoints.

It uses Amazon API Gateway for request routing, Python AWS Lambda for request processing, and Amazon DynamoDB for data storage.
