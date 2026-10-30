---
description: >-
  - Technical documentation of Amazon DynamoDB, table configuration, data
  structure, and database operations used by CloudNotes.
---

# Database Implementation

## Database Implementation

### 1. Database Overview

CloudNotes uses Amazon DynamoDB as its cloud-based NoSQL database.

DynamoDB stores the notes created by visitors and supports the backend operations required to create, retrieve, update, and delete notes.

The database is accessed by the Python AWS Lambda function through the Boto3 SDK.

### 2. Database Technology

| Component           | Technology      |
| ------------------- | --------------- |
| Database Service    | Amazon DynamoDB |
| Database Type       | NoSQL           |
| AWS SDK             | Boto3           |
| Backend Integration | AWS Lambda      |
| Table Name          | CloudNotes      |
| Partition Key       | id              |
| Key Data Type       | String          |

### 3. DynamoDB Table Configuration

The application uses a DynamoDB table named `CloudNotes`.

The table stores individual notes as DynamoDB items.

#### Table Details

| Property           | Configuration                                                                      |
| ------------------ | ---------------------------------------------------------------------------------- |
| Table Name         | CloudNotes                                                                         |
| Partition Key      | `id`                                                                               |
| Partition Key Type | String                                                                             |
| Billing Mode       | Not explicitly configured in the provided SAM template                             |
| Region             | Configured through AWS\_REGION in the Lambda code, with eu-north-1 as its fallback |

### 4. Database Data Model

Each note is stored as an individual item in DynamoDB.

The backend creates the following attributes:

| Attribute | Data Type | Description                            |
| --------- | --------- | -------------------------------------- |
| id        | String    | Unique identifier for each note        |
| userId    | String    | Identifier associated with the visitor |
| title     | String    | Title of the note                      |
| content   | String    | Main content of the note               |

#### Example DynamoDB Item

```
{
  "id": "generated-uuid",
  "userId": "visitor_1234567890",
  "title": "My First Note",
  "content": "This is my first CloudNotes note."
}
```

The `id` attribute is the partition key used to identify individual notes.

The `userId` attribute associates each note with its visitor.

### 5. Database Connection

The Python backend uses Boto3 to connect to Amazon DynamoDB.

The table configuration is defined in the backend application.

```
REGION = os.environ.get("AWS_REGION", "eu-north-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "CloudNotes")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)
```

The `TABLE_NAME` environment variable identifies the DynamoDB table.

The AWS region is obtained from the Lambda environment, with `eu-north-1` as the fallback.

### 6. Database Operations

CloudNotes implements the following DynamoDB operations.

#### 6.1 Create Note

The backend uses the `put_item()` operation to insert a new note.

```
table.put_item(Item=note)
```

A UUID is generated for the note ID before storing the item.

#### 6.2 Retrieve Notes

The backend uses the `scan()` operation with a filter expression to retrieve notes belonging to a visitor.

```
result = table.scan(
    FilterExpression=Attr("userId").eq(user_id)
)
```

The implementation handles pagination using `LastEvaluatedKey` and `ExclusiveStartKey`.

#### 6.3 Retrieve a Single Note

The backend uses `get_item()` to retrieve an item using its partition key.

```
result = table.get_item(
    Key={"id": note_id}
)
```

The backend checks whether the retrieved note belongs to the requesting visitor.

#### 6.4 Update Note

The backend uses `update_item()` to modify the title and content attributes.

```
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
```

#### 6.5 Delete Note

The backend uses `delete_item()` to remove a note from DynamoDB.

```
table.delete_item(
    Key={"id": note_id}
)
```

The backend verifies note ownership before performing the deletion.

### 7. AWS Permissions

The AWS SAM template configures the Lambda function with a DynamoDB CRUD policy.

```
Policies:
  - DynamoDBCrudPolicy:
      TableName: CloudNotes
```

This policy grants the Lambda function the DynamoDB permissions required for the configured CRUD operations on the `CloudNotes` table.

### 8. Infrastructure Configuration

The DynamoDB table name is passed to the Lambda function through its environment variables.

```
Environment:
  Variables:
    TABLE_NAME: CloudNotes
```

The AWS SAM template references the table by name for its Lambda permissions.

**Note:** The provided template references an existing table named `CloudNotes`; it does not define an `AWS::DynamoDB::Table` resource. The table must therefore exist separately in AWS.

### 9. Data Ownership and Privacy

Each note contains a `userId` attribute.

The backend uses the visitor identifier received through the `X-User-Id` request header to filter notes and check ownership.

The `public_note()` function excludes the internal `userId` attribute from API responses.

This provides basic visitor-level data separation, but the visitor ID is not authenticated. Production applications should use a trusted authentication mechanism.

### 10. Error Handling

The backend catches DynamoDB `ClientError` exceptions.

When a database operation fails, the API returns:

```
{
  "message": "Database operation failed"
}
```

The response uses HTTP status code `500`.

### 11. Database Architecture

The database interaction follows this process:

1. The visitor sends a request through the frontend.
2. API Gateway forwards the request to AWS Lambda.
3. The Python backend validates the visitor identifier.
4. Lambda performs the required DynamoDB operation.
5. DynamoDB returns the result.
6. Lambda sends the response back through API Gateway.

### 12. Source Code and Configuration

**Backend source code:**

`hello_world/app.py`

**AWS infrastructure template:**

`template.yaml`

**GitHub Repository:**

[https://github.com/jebickson/CloudNotes-sam](https://github.com/jebickson/CloudNotes-sam)

### 13. Summary

Amazon DynamoDB provides the persistent data storage layer for CloudNotes.

The Python AWS Lambda backend uses Boto3 to perform database operations, while AWS SAM configures the required Lambda environment variables and database permissions.

The database design uses a unique note ID as its partition key and a visitor identifier to associate notes with their owners.
