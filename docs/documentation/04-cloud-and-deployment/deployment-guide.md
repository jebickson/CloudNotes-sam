---
description: >-
  Step-by-step instructions for setting up, building, configuring, and deploying
  the CloudNotes frontend and AWS serverless backend
---

# Deployment Guide

### 1. Introduction

CloudNotes is a full-stack serverless application designed to create, manage, and store personal notes.

The application uses Next.js for the frontend, Python AWS Lambda for backend processing, Amazon API Gateway for API communication, and Amazon DynamoDB for persistent data storage.

The frontend is hosted on Vercel, while the backend infrastructure runs on Amazon Web Services (AWS).

This document explains the deployment architecture, configuration, deployment process, and production testing of CloudNotes.

### 2. Deployment Architecture

CloudNotes follows a serverless deployment architecture.

#### Architecture Flow

```
                  User
                    |
                    v
             Vercel Frontend
                (Next.js)
                    |
                    | HTTPS Requests
                    v
            Amazon API Gateway
                    |
                    v
              AWS Lambda
                 (Python)
                    |
                    v
             Amazon DynamoDB
```

#### Component Responsibilities

| Component   | Responsibility                                |
| ----------- | --------------------------------------------- |
| Vercel      | Hosts the frontend application                |
| Next.js     | Provides the user interface                   |
| API Gateway | Receives and routes API requests              |
| AWS Lambda  | Executes backend logic                        |
| DynamoDB    | Stores and retrieves notes                    |
| AWS SAM     | Defines and deploys serverless infrastructure |
| GitHub      | Stores and manages source code                |

### 3. Deployment Technology Stack

| Technology         | Purpose                       |
| ------------------ | ----------------------------- |
| Next.js            | Frontend framework            |
| TypeScript         | Frontend programming language |
| Python 3.14        | Backend runtime               |
| AWS Lambda         | Serverless backend execution  |
| Amazon API Gateway | REST API management           |
| Amazon DynamoDB    | NoSQL database                |
| AWS SAM            | Infrastructure deployment     |
| Vercel             | Frontend hosting              |
| GitHub             | Source code management        |

### 4. Prerequisites

Before deploying CloudNotes, the following tools and accounts are required:

#### Software Requirements

* Node.js and npm
* Python
* AWS CLI
* AWS SAM CLI
* Git
* Visual Studio Code or another code editor

#### Cloud Accounts

* AWS account
* GitHub account
* Vercel account

### 5. Clone the GitHub Repository

The CloudNotes source code is maintained in GitHub.

Repository:

[https://github.com/jebickson/CloudNotes-sam](https://github.com/jebickson/CloudNotes-sam)

Clone the repository:

```
git clone https://github.com/jebickson/CloudNotes-sam.git
```

Navigate to the project directory:

```
cd CloudNotes-sam
```

The repository contains the frontend, backend, tests, and AWS deployment configuration.

### 6. Backend Deployment Using AWS SAM

The CloudNotes backend is deployed using AWS Serverless Application Model (SAM).

AWS SAM simplifies the process of building, configuring, and deploying serverless applications.

#### 6.1 Configure AWS CLI

Configure AWS credentials:

```
aws configure
```

Provide the required configuration:

* AWS Access Key ID
* AWS Secret Access Key
* Default AWS Region
* Default Output Format

Use an IAM identity with the necessary deployment permissions.

Never upload AWS credentials or secret keys to GitHub.

#### 6.2 Configure the DynamoDB Table

The backend uses an Amazon DynamoDB table named:

```
CloudNotes
```

The required table configuration is:

| Configuration | Value      |
| ------------- | ---------- |
| Table Name    | CloudNotes |
| Partition Key | id         |
| Key Type      | String     |

**Important:** The supplied SAM template references the existing DynamoDB table. It does not create the table automatically.

Create the table in the correct AWS region before deploying the backend.

#### 6.3 Validate the SAM Template

From the project root directory, execute:

```
sam validate --lint
```

This checks the AWS SAM template for configuration and syntax issues.

#### 6.4 Build the Backend

Execute:

```
sam build
```

This prepares the Lambda application and its dependencies for deployment.

#### 6.5 Deploy the Backend

Execute:

```
sam deploy --guided
```

Follow the deployment prompts.

The configured stack name is:

```
cloudnotes-sam
```

The deployment settings are maintained in:

```
samconfig.toml
```

AWS SAM uses the configuration file to manage deployment parameters.

#### 6.6 Retrieve the API Gateway URL

After successful deployment, retrieve the CloudFormation stack outputs.

The SAM template defines an output named:

```
CloudNotesApi
```

This output provides the API Gateway URL.

The frontend uses the deployed API endpoint to communicate with the backend.

### 7. Backend Configuration and Verification

After deploying the backend, verify the following:

* CloudFormation stack deployment is successful.
* AWS Lambda function is available.
* API Gateway endpoints are configured.
* DynamoDB table exists in the correct region.
* Lambda has the required DynamoDB permissions.
* API requests are processed correctly.
* The frontend can communicate with the backend.

#### Backend API Requirements

The backend expects a visitor identifier through the following HTTP header:

```
X-User-Id: your-user-id
```

This identifier is used to separate notes by visitor.

**Security Note:** The current `X-User-Id` mechanism is a visitor identifier, not secure authentication. It can be spoofed by a client. Do not treat it as an identity verification system.

### 8. Frontend Deployment Using Vercel

The CloudNotes frontend is developed using Next.js and hosted on Vercel.

#### 8.1 Connect GitHub Repository

1. Sign in to Vercel.
2. Select **Add New Project**.
3. Import the CloudNotes GitHub repository.
4. Select the repository containing the frontend application.

#### 8.2 Configure the Root Directory

Set the project root directory to:

```
frontend
```

This ensures Vercel builds the Next.js application from the correct directory.

#### 8.3 Configure Build Settings

Use the following configuration, adjusting it if the project's package scripts require different commands.

| Setting          | Value         |
| ---------------- | ------------- |
| Framework Preset | Next.js       |
| Root Directory   | frontend      |
| Install Command  | npm install   |
| Build Command    | npm run build |

#### 8.4 Configure Environment Variables

The frontend requires the deployed backend API URL.

Configure the environment variable expected by the frontend source code.

Example:

```
NEXT_PUBLIC_API_URL=your_api_gateway_url
```

Replace the example value with the actual API Gateway URL.

**Note:** Verify the environment variable name in the frontend source code. The example above should only be used if the application reads that exact variable.

After changing environment variables, redeploy the frontend so the updated configuration takes effect.

#### 8.5 Deploy the Frontend

1. Review the project configuration.
2. Click **Deploy** in Vercel.
3. Wait for the build process to finish.
4. Open the generated deployment URL.
5. Verify that the CloudNotes interface loads correctly.

Vercel also supports automatic deployments when changes are pushed to the connected GitHub branch.

### 9. Live Application

The CloudNotes frontend is publicly accessible through the following URL:

**Live Application:**

[https://cloudnotes-ivory.vercel.app/](https://cloudnotes-ivory.vercel.app/)

**GitHub Repository:**

[https://github.com/jebickson/CloudNotes-sam](https://github.com/jebickson/CloudNotes-sam)

#### Hosting Information

| Component   | Deployment Platform |
| ----------- | ------------------- |
| Frontend    | Vercel              |
| Backend     | AWS Lambda          |
| API         | Amazon API Gateway  |
| Database    | Amazon DynamoDB     |
| Source Code | GitHub              |

### 10. Production Testing and Validation

After deploying the frontend and backend, the live application was tested through the Vercel deployment.

The purpose of production testing was to verify that the frontend could communicate with the backend and save notes successfully.

#### 10.1 Deployment Test Results

The following tests were performed:

| Test Case              | Expected Result                    | Status     |
| ---------------------- | ---------------------------------- | ---------- |
| Open live application  | Frontend loads successfully        | Successful |
| Backend API connection | Frontend communicates with backend | Successful |
| Create a test note     | Note creation succeeds             | Successful |
| Save a test note       | Note is saved successfully         | Successful |

#### 10.2 Production Verification

The live application was opened using the deployed Vercel URL.

A test note was created through the application interface and saved successfully.

This confirms that the deployed frontend and backend are communicating successfully for the tested note-saving workflow.

#### 10.3 Additional Recommended Tests

The following tests should also be performed to validate the complete application:

* Retrieve previously saved notes.
* Update an existing note.
* Delete a note.
* Verify note separation between different visitor identifiers.
* Check API error handling.
* Review browser console and AWS Lambda logs.

### 11. Common Deployment Issues

#### 11.1 Frontend Cannot Connect to Backend

**Possible Causes:**

* Incorrect API Gateway URL.
* Incorrect frontend environment variable.
* CORS configuration problems.
* Backend deployment failure.

**Troubleshooting:**

* Verify the API Gateway endpoint.
* Check the frontend environment variable.
* Review API Gateway and Lambda logs.
* Verify the CORS configuration.

#### 11.2 DynamoDB Table Not Found

**Possible Causes:**

* DynamoDB table does not exist.
* Incorrect AWS region.
* Incorrect table name.
* Insufficient IAM permissions.

**Troubleshooting:**

* Verify that the `CloudNotes` table exists.
* Check the Lambda execution region.
* Verify the `TABLE_NAME` environment variable.
* Review Lambda IAM permissions.

#### 11.3 Lambda Deployment Failure

**Possible Causes:**

* Invalid SAM template.
* Missing AWS deployment permissions.
* Incorrect dependencies.
* AWS configuration problems.

**Troubleshooting:**

Run:

```
sam validate --lint
```

Then rebuild:

```
sam build
```

Review the deployment error messages before trying again.

#### 11.4 Vercel Build Failure

**Possible Causes:**

* Incorrect root directory.
* Missing dependencies.
* TypeScript compilation errors.
* Incorrect environment variables.

**Troubleshooting:**

Run the frontend build locally:

```
cd frontend
npm install
npm run build
```

Review and resolve any build errors before redeploying.

### 12. Important Configuration Files

The following files are used in the deployment process:

| File                      | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `template.yaml`           | Defines AWS serverless resources          |
| `samconfig.toml`          | Stores AWS SAM deployment configuration   |
| `frontend/package.json`   | Defines frontend dependencies and scripts |
| `frontend/next.config.ts` | Contains Next.js configuration            |
| `hello_world/app.py`      | Contains the Python Lambda handler        |

### 13. Deployment Workflow Summary

The CloudNotes deployment process follows these steps:

1. Push project source code to GitHub.
2. Configure AWS CLI credentials.
3. Prepare the DynamoDB table.
4. Validate the AWS SAM template.
5. Build the Lambda application.
6. Deploy the backend using AWS SAM.
7. Retrieve the API Gateway URL.
8. Configure the frontend API endpoint.
9. Import the repository into Vercel.
10. Deploy the Next.js frontend.
11. Open the live application.
12. Perform production testing.

### 14. Conclusion

CloudNotes demonstrates the development and deployment of a full-stack serverless application using modern web technologies and AWS cloud services.

The Next.js frontend is hosted on Vercel, while the Python backend runs on AWS Lambda and communicates through Amazon API Gateway.

Amazon DynamoDB provides persistent storage for application notes.

AWS SAM simplifies backend infrastructure deployment, while GitHub provides source code management and Vercel handles frontend hosting.

The successful live note-saving test verifies the frontend-to-backend workflow in the deployed application.

CloudNotes demonstrates practical experience with frontend development, backend development, serverless architecture, cloud deployment, database integration, and production testing.
