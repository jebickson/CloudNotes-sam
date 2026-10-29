# CloudNotes

A serverless notes application built on AWS. A Python REST API runs on **AWS Lambda** behind **Amazon API Gateway**, stores data in **Amazon DynamoDB**, and is defined as infrastructure-as-code with the **AWS Serverless Application Model (SAM)**. The frontend is deployed on **Vercel**.

**Live demo:** https://cloudnotes-ivory.vercel.app/

![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20API%20Gateway%20%7C%20DynamoDB-FF9900?logo=amazonaws&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)
![SAM](https://img.shields.io/badge/IaC-AWS%20SAM-232F3E)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)

---

## Overview

CloudNotes lets users create, read, update, and delete notes through a fully managed, pay-per-use backend. There are no servers to provision or patch, and the API stack can be deployed or removed with a couple of commands.

## Architecture

```
┌──────────────┐     HTTPS      ┌─────────────────┐     invoke     ┌──────────────┐
│   Frontend   │ ─────────────▶ │   API Gateway   │ ─────────────▶ │    Lambda    │
│   (Vercel)   │ ◀───────────── │   (REST, Prod)  │ ◀───────────── │  (Python)    │
└──────────────┘      JSON      └─────────────────┘                └──────┬───────┘
                                                                          │ CRUD
                                                                          ▼
                                                                   ┌──────────────┐
                                                                   │   DynamoDB   │
                                                                   │  (CloudNotes)│
                                                                   └──────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vercel | User interface for managing notes |
| API | Amazon API Gateway (REST) | Public HTTPS endpoint, CORS, and routing |
| Compute | AWS Lambda (Python 3.14, x86_64) | Single handler that routes by HTTP method and path |
| Database | Amazon DynamoDB (`CloudNotes` table) | Serverless NoSQL storage for notes |
| IaC | AWS SAM / CloudFormation | Repeatable, versioned infrastructure |

A single Lambda function handles every route. API Gateway forwards `/`, `/notes`, and `/notes/{id}` to it using `ANY` methods, and the handler (`app.lambda_handler`) dispatches on the request method and path.

## Features

- Serverless, fully managed backend that scales automatically
- REST API for creating, listing, updating, and deleting notes
- Infrastructure defined as code in a single `template.yaml`
- Least-privilege runtime access: the Lambda role can only reach the `CloudNotes` table (`DynamoDBCrudPolicy`)
- CORS configured for browser clients
- Local testing with the SAM CLI and Docker, plus unit tests with `pytest`

## Project Structure

```
CloudNotes-sam/
├── frontend/          # Web client deployed to Vercel
├── hello_world/       # Lambda function source (app.py, requirements.txt)
├── events/            # Sample invocation events for local testing
├── tests/             # Unit and integration tests
├── template.yaml      # SAM template (Lambda function, API Gateway routes, IAM policy)
├── samconfig.toml     # SAM deployment configuration
└── test_local.py      # Local test script
```

## API Reference

Base URL: `https://<api-id>.execute-api.<region>.amazonaws.com/Prod`

The exact URL is printed as the `CloudNotesApi` output after deployment.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notes` | List notes |
| `POST` | `/notes` | Create a note |
| `PUT` | `/notes/{id}` | Update a note |
| `DELETE` | `/notes/{id}` | Delete a note |

**Allowed request headers:** `Content-Type`, `Authorization`, `X-User-Id`

**Example: create a note**

```bash
curl -X POST "https://<api-id>.execute-api.<region>.amazonaws.com/Prod/notes" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user" \
  -d '{"title": "First note", "content": "Hello from CloudNotes"}'
```

## Getting Started

### Prerequisites

- An [AWS account](https://aws.amazon.com/) with the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Python 3.14](https://www.python.org/downloads/)
- [Docker](https://www.docker.com/products/docker-desktop/) (needed for `sam build --use-container` and local invocation)

### 1. Clone the repository

```bash
git clone https://github.com/jebickson/CloudNotes-sam.git
cd CloudNotes-sam
```

### 2. Create the DynamoDB table

The stack grants the function access to a table named `CloudNotes` but does not create it, so create the table once in your target region before deploying. Use the key schema your handler expects.

### 3. Build and deploy

```bash
sam build --use-container
sam deploy --guided
```

The guided deploy asks for a stack name, AWS region, and IAM capability confirmation, then saves your answers to `samconfig.toml`. After the first run, `sam deploy` is enough. The API URL appears in the stack **Outputs**.

### Run locally

```bash
sam build --use-container
sam local start-api
```

The API is then served at `http://localhost:3000`. To invoke the function with a sample event:

```bash
sam local invoke HelloWorldFunction --event events/event.json
```

### Run the tests

```bash
pip install -r tests/requirements.txt
python -m pytest tests/unit -v
```

## Configuration

| Setting | Value | Defined in |
|---------|-------|-----------|
| `TABLE_NAME` | `CloudNotes` | Lambda environment variable in `template.yaml` |
| Runtime | `python3.14` (x86_64) | `template.yaml` |
| Timeout | 30 seconds | `Globals` in `template.yaml` |
| API stage | `Prod` | SAM default |

## Monitoring and Logs

```bash
sam logs --stack-name cloudnotes-sam --tail
```

## Security

- Deployment uses a dedicated IAM user with scoped, least-privilege policies instead of administrator access.
- The Lambda execution role is limited to CRUD operations on the `CloudNotes` table.
- CORS currently allows any origin (`*`) for development convenience. Restrict `AllowOrigin` to your Vercel domain for production.
- Never commit AWS credentials or `.env` files.

## Cleanup

```bash
sam delete --stack-name cloudnotes-sam
```

This removes the API Gateway and Lambda resources. The `CloudNotes` DynamoDB table is not part of the stack, so delete it separately if you no longer need it.

## Roadmap

- [ ] Define the DynamoDB table in `template.yaml` so the whole stack deploys in one step
- [ ] Authentication with Amazon Cognito
- [ ] Restrict CORS to the production frontend origin
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Search and tagging

## Author

**Jebickson Samuel**
GitHub: [@jebickson](https://github.com/jebickson)

---

Built with AWS SAM, Lambda, API Gateway, and DynamoDB.
