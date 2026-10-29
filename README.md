# CloudNotes

A serverless notes application built on AWS. A Python REST API runs on **AWS Lambda** behind **Amazon API Gateway**, stores data in **Amazon DynamoDB**, and is defined entirely as infrastructure-as-code with the **AWS Serverless Application Model (SAM)**. A lightweight frontend is deployed on **Vercel**.

**Live demo:** https://cloudnotes-ivory.vercel.app/

![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20API%20Gateway%20%7C%20DynamoDB-FF9900?logo=amazonaws&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![SAM](https://img.shields.io/badge/IaC-AWS%20SAM-232F3E)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)

---

## Overview

CloudNotes lets users create, read, update, and delete notes through a fully managed, pay-per-use backend. There are no servers to provision or patch, and the whole stack can be deployed or torn down with a couple of commands.

## Architecture

```
┌──────────────┐     HTTPS      ┌─────────────────┐     invoke     ┌──────────────┐
│   Frontend   │ ─────────────▶ │   API Gateway   │ ─────────────▶ │    Lambda    │
│   (Vercel)   │ ◀───────────── │   (REST API)    │ ◀───────────── │   (Python)   │
└──────────────┘      JSON      └─────────────────┘                └──────┬───────┘
                                                                          │ read / write
                                                                          ▼
                                                                   ┌──────────────┐
                                                                   │   DynamoDB   │
                                                                   └──────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML / JavaScript on Vercel | User interface for managing notes |
| API | Amazon API Gateway | Public HTTPS endpoint and request routing |
| Compute | AWS Lambda (Python) | Business logic and request handling |
| Database | Amazon DynamoDB | Serverless NoSQL storage for notes |
| IaC | AWS SAM / CloudFormation | Repeatable, versioned infrastructure |

## Features

- Serverless, fully managed backend with automatic scaling
- REST API for creating, listing, updating, and deleting notes
- Infrastructure defined as code in a single `template.yaml`
- Least-privilege IAM permissions for deployment and runtime
- Local testing with the SAM CLI and Docker
- Unit tests with `pytest`

## Project Structure

```
CloudNotes-sam/
├── frontend/          # Web client deployed to Vercel
├── hello_world/       # Lambda function source code
├── events/            # Sample invocation events for local testing
├── tests/             # Unit and integration tests
├── template.yaml      # SAM template (Lambda, API Gateway, DynamoDB)
├── samconfig.toml     # SAM deployment configuration
└── test_local.py      # Local test script
```

## API Reference

Base URL: `https://<api-id>.execute-api.<region>.amazonaws.com/<stage>`

> Update this table so it matches the routes defined in `template.yaml`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notes` | List all notes |
| `POST` | `/notes` | Create a new note |
| `PUT` | `/notes/{id}` | Update an existing note |
| `DELETE` | `/notes/{id}` | Delete a note |

**Example: create a note**

```bash
curl -X POST "https://<api-id>.execute-api.<region>.amazonaws.com/<stage>/notes" \
  -H "Content-Type: application/json" \
  -d '{"title": "First note", "content": "Hello from CloudNotes"}'
```

## Getting Started

### Prerequisites

- [AWS account](https://aws.amazon.com/) and [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Python 3](https://www.python.org/downloads/)
- [Docker](https://www.docker.com/products/docker-desktop/) (required for `sam build --use-container` and local invocation)

### Clone the repository

```bash
git clone https://github.com/jebickson/CloudNotes-sam.git
cd CloudNotes-sam
```

### Build and deploy

```bash
sam build --use-container
sam deploy --guided
```

The guided deploy prompts for a stack name, AWS region, and IAM capability confirmation, then saves your answers to `samconfig.toml`. After the first run, a plain `sam deploy` is enough. The API endpoint URL appears in the stack **Outputs** once deployment finishes.

### Run locally

```bash
sam build --use-container
sam local start-api
```

The API is then available at `http://localhost:3000`. To invoke the function with a sample event:

```bash
sam local invoke --event events/event.json
```

### Run the tests

```bash
pip install -r tests/requirements.txt
python -m pytest tests/unit -v
```

## Monitoring and Logs

Tail the Lambda logs from your terminal:

```bash
sam logs --stack-name cloudnotes-sam --tail
```

## Security

- Deployment uses a dedicated IAM user with scoped, least-privilege policies rather than administrator access.
- The Lambda execution role is limited to the DynamoDB table it needs.
- Never commit AWS credentials or `.env` files. Both are excluded through `.gitignore`.

## Cleanup

To remove every AWS resource created by this project:

```bash
sam delete --stack-name cloudnotes-sam
```

## Roadmap

- [ ] User authentication with Amazon Cognito
- [ ] Per-user note isolation
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Search and tagging

## Author

**Jebickson Samuel**
GitHub: [@jebickson](https://github.com/jebickson)

---

Built with AWS SAM, Lambda, API Gateway, and DynamoDB.
