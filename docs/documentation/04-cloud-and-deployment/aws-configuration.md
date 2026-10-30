---
description: >-
  Technical documentation of AWS Lambda, API Gateway, DynamoDB permissions,
  environment variables, AWS SAM configuration, and cloud infrastructure.
---

# AWS Configuration

## AWS Configuration

### 1. Introduction

CloudNotes uses Amazon Web Services (AWS) to run its serverless backend infrastructure.

The application integrates AWS Lambda, Amazon API Gateway, and Amazon DynamoDB to provide cloud-based notes management functionality.

AWS Serverless Application Model (SAM) is used to define and manage the serverless application configuration.

### 2. AWS Services Used

| AWS Service        | Purpose                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| AWS Lambda         | Executes Python backend code                                                |
| Amazon API Gateway | Exposes HTTP API endpoints                                                  |
| Amazon DynamoDB    | Stores application notes                                                    |
| AWS SAM            | Defines and deploys serverless infrastructure                               |
| Amazon S3          | Used by SAM CLI to manage deployment artifacts through a resolved S3 bucket |

### 3. AWS Architecture

The CloudNotes backend follows a serverless architecture.

The frontend sends HTTP requests to Amazon API Gateway. API Gateway invokes the configured AWS Lambda function. The Lambda function processes the request and interacts with DynamoDB when data operations are required.

### 4. AWS Lambda Configuration

The backend is deployed as an AWS Lambda function.

#### Function Configuration

| Property              | Configuration        |
| --------------------- | -------------------- |
| Logical Resource Name | HelloWorldFunction   |
| Runtime               | Python 3.14          |
| Architecture          | x86\_64              |
| Handler               | `app.lambda_handler` |
| Code Directory        | `hello_world/`       |
| Timeout               | 30 seconds           |

#### Lambda Handler

The Lambda function uses:

```
app.lambda_handler
```

This points to the `lambda_handler` function inside `app.py`.

#### Environment Variables

The Lambda function receives the following environment variable:

| Variable    | Value      |
| ----------- | ---------- |
| TABLE\_NAME | CloudNotes |

The backend also reads `AWS_REGION` from the Lambda environment and uses `eu-north-1` as its fallback region.

### 5. Amazon API Gateway Configuration

Amazon API Gateway provides the HTTP endpoints used by the frontend.

The AWS SAM template defines the following routes:

| Route         | Method |
| ------------- | ------ |
| `/`           | ANY    |
| `/notes`      | ANY    |
| `/notes/{id}` | ANY    |

The `ANY` method allows the configured Lambda integration to receive different HTTP methods. The Lambda handler determines how to process each request.

### 6. Amazon DynamoDB Integration

CloudNotes uses a DynamoDB table named:

```
CloudNotes
```

The Lambda function accesses the table using the Boto3 SDK.

The SAM template configures DynamoDB CRUD permissions for the Lambda function.

```
Policies:
  - DynamoDBCrudPolicy:
      TableName: CloudNotes
```

The DynamoDB table must exist separately because the provided SAM template references it but does not create the table resource.

### 7. AWS IAM Permissions

The Lambda function receives permissions through the AWS SAM policy template.

The configured policy is:

```
DynamoDBCrudPolicy:
  TableName: CloudNotes
```

This grants the Lambda function the required DynamoDB CRUD permissions for the configured table.

The deployment configuration also includes:

```
capabilities = "CAPABILITY_IAM"
```

This allows the deployment to create the IAM resources required by the application.

### 8. CORS Configuration

The AWS SAM template configures CORS for the API.

Configured values:

```
Cors:
  AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,Authorization,X-User-Id'"
  AllowOrigin: "'*'"
```

These settings allow the configured HTTP methods and request headers from any origin.

For production, the allowed origin should be restricted to the actual frontend domain.

### 9. AWS SAM Template

The infrastructure configuration is defined in:

```
template.yaml
```

The template includes:

* AWS SAM transformation.
* Global Lambda timeout.
* API Gateway CORS configuration.
* Python Lambda function.
* Lambda environment variables.
* DynamoDB CRUD policy.
* API Gateway event definitions.
* API Gateway output URL.

### 10. SAM Configuration File

The project uses:

```
samconfig.toml
```

This file stores default AWS SAM CLI settings for building, validating, deploying, packaging, and local development.

#### 10.1 General Configuration

```
version = 0.1
```

Defines the SAM configuration file version.

#### 10.2 Stack Configuration

```
[default.global.parameters]
stack_name = "cloudnotes-sam"
```

Defines the default CloudFormation stack name.

#### 10.3 Build Configuration

```
[default.build.parameters]
cached = true
parallel = true
```

* `cached = true`: Enables cached builds.
* `parallel = true`: Allows parallel build processing.

#### 10.4 Validation Configuration

```
[default.validate.parameters]
lint = true
```

Enables linting during SAM template validation.

#### 10.5 Deployment Configuration

```
[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
```

* `CAPABILITY_IAM`: Allows IAM resource creation.
* `confirm_changeset = true`: Requires confirmation of the deployment changeset.
* `resolve_s3 = true`: Allows SAM CLI to manage the deployment artifact bucket.

#### 10.6 Packaging Configuration

```
[default.package.parameters]
resolve_s3 = true
```

Enables automatic resolution of the S3 bucket used for packaging artifacts.

#### 10.7 Synchronization Configuration

```
[default.sync.parameters]
watch = true
```

Enables watch mode for SAM synchronization.

#### 10.8 Local API Configuration

```
[default.local_start_api.parameters]
warm_containers = "EAGER"
```

Configures local API testing to initialize Lambda containers eagerly.

#### 10.9 Local Lambda Configuration

```
[default.local_start_lambda.parameters]
warm_containers = "EAGER"
```

Configures local Lambda execution with eager container initialization.

### 11. AWS Deployment Commands

The following commands can be used with AWS SAM CLI.

#### Build the Application

```
sam build
```

Builds the serverless application.

#### Validate the Template

```
sam validate --lint
```

Validates the SAM template and performs lint checks.

#### Deploy the Application

```
sam deploy --guided
```

Starts the guided deployment process.

The deployment uses the stack name and settings defined in `samconfig.toml`, unless overridden.

#### Run the API Locally

```
sam local start-api
```

Starts a local API endpoint for testing the Lambda integration.

#### Invoke the Lambda Locally

```
sam local invoke HelloWorldFunction
```

Invokes the Lambda function locally using AWS SAM CLI.

### 12. CloudFormation Outputs

The SAM template defines an output named:

```
CloudNotesApi
```

It provides the deployed API Gateway URL.

The URL follows this format:

```
https://{api-id}.execute-api.{region}.amazonaws.com/Prod/
```

The actual API ID and region are assigned during deployment.

### 13. Infrastructure Source Files

| File                           | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `template.yaml`                | Defines AWS serverless resources      |
| `samconfig.toml`               | Stores SAM CLI configuration          |
| `hello_world/app.py`           | Contains Python Lambda implementation |
| `hello_world/requirements.txt` | Contains Python dependencies          |

### 14. Summary

CloudNotes uses AWS serverless services to host and operate its backend.

AWS Lambda processes application requests, API Gateway exposes HTTP endpoints, and DynamoDB stores notes.

AWS SAM manages the infrastructure configuration and provides commands for building, validating, testing, and deploying the application.
