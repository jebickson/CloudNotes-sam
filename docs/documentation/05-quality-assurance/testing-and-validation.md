---
description: >-
  Documentation of unit testing, integration testing, backend validation, API
  testing, and local testing procedures for CloudNotes.
---

# Testing and Validation

## Testing and Validation

### 1. Introduction

Testing and validation are important parts of the CloudNotes development process.

The project uses Python testing tools to verify backend functionality and API integration.

The testing setup includes unit testing, API integration testing, and test event simulation.

### 2. Testing Technology Stack

| Tool               | Purpose                          |
| ------------------ | -------------------------------- |
| pytest             | Python testing framework         |
| boto3              | AWS SDK for Python               |
| requests           | HTTP API requests                |
| AWS CloudFormation | Retrieves deployed stack outputs |

### 3. Testing Directory Structure

The project contains a `tests/` directory for automated testing.

The test files cover Lambda handler testing and API Gateway integration testing.

```
tests/
├── integration/
│   └── test_api_gateway.py
└── unit/
    └── test_handler.py
```

_Note: Confirm the exact filenames against the repository before publishing this tree._

### 4. Unit Testing

Unit testing checks the Lambda handler's behavior using a simulated API Gateway event.

The unit test imports the backend application:

```
from hello_world import app
```

It creates a sample API Gateway event using a pytest fixture.

The test invokes the Lambda handler and checks:

* The returned HTTP status code.
* The presence of a response body.
* Whether the response body contains valid JSON.
* Whether the decoded response has the expected data type.

### 5. API Gateway Integration Testing

Integration testing checks the deployed API Gateway endpoint.

The test uses Boto3 to retrieve the API endpoint from an AWS CloudFormation stack.

It uses the `AWS_SAM_STACK_NAME` environment variable to identify the deployed stack.

The test then sends an HTTP GET request using the Requests library.

The original test checks whether the API returns HTTP 200 and the expected JSON response.

### 6. Pytest Fixtures

The test suite uses pytest fixtures to create reusable test data.

The `apigw_event` fixture generates a simulated API Gateway event containing:

* HTTP request method.
* Request path.
* Request headers.
* Request body.
* API Gateway request context.
* Query string parameters.
* Path parameters.

This allows the Lambda handler to be tested without sending an actual API Gateway request.

### 7. Test Dependencies

The following dependencies are used by the provided test files:

```
pytest
boto3
requests
```

Install the dependencies using:

```
pip install pytest boto3 requests
```

### 8. Running Tests

Run all tests using:

```
pytest
```

Run unit tests:

```
pytest tests/unit/
```

Run integration tests:

```
pytest tests/integration/
```

Run tests with detailed output:

```
pytest -v
```

### 9. AWS Integration Test Configuration

The API Gateway integration test requires the deployed AWS SAM stack name.

Configure the environment variable before running the integration test.

Windows PowerShell:

```
$env:AWS_SAM_STACK_NAME="cloudnotes-sam"
```

Linux or macOS:

```
export AWS_SAM_STACK_NAME=cloudnotes-sam
```

The test also requires AWS credentials with permission to describe the CloudFormation stack and access to the deployed API.

### 10. Test Coverage

The provided test code includes the following testing areas:

| Test Area                  | Purpose                              |
| -------------------------- | ------------------------------------ |
| Lambda Handler             | Checks handler execution             |
| API Event Fixture          | Simulates API Gateway requests       |
| Response Validation        | Checks response status and body      |
| JSON Validation            | Checks response JSON structure       |
| API Integration            | Sends requests to deployed API       |
| CloudFormation Integration | Retrieves API URL from stack outputs |

### 11. Testing Limitations and Required Updates

The current test files contain expectations from an earlier AWS SAM starter application.

Before treating the tests as CloudNotes validation, update them to match the current implementation.

#### Integration Test Updates

The existing integration test searches for an output named `HelloWorldApi` and expects a response containing:

```
{
  "message": "hello world"
}
```

However, the current CloudNotes SAM template defines the output as `CloudNotesApi`, and the API requires the `X-User-Id` header for note operations.

The integration test should be updated to retrieve the correct output and test an actual CloudNotes endpoint.

#### Unit Test Updates

The existing simulated API Gateway event uses a path of `/examplepath` and does not include a valid `X-User-Id` header.

The current CloudNotes handler would return HTTP 401 for this event.

The existing assertion accepts only HTTP 200 or 404, so the test needs to be updated.

#### Recommended Additional Tests

The CloudNotes backend should have dedicated tests for:

* Creating a note.
* Retrieving all notes.
* Retrieving a single note.
* Updating a note.
* Deleting a note.
* Missing or invalid visitor identifiers.
* Invalid JSON request bodies.
* Missing note titles.
* Access to notes belonging to another visitor.
* DynamoDB errors.

### 12. Summary

CloudNotes includes a Python testing setup based on pytest, Boto3, and Requests.

The test suite provides a starting point for Lambda handler testing and deployed API integration testing.

The existing starter-template expectations should be updated to match the CloudNotes API before the test suite can be considered a reliable validation of the application.
