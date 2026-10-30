---
description: >-
  Explanation of the CloudNotes repository structure, including frontend,
  backend, AWS configuration, events, and automated tests.
---

# Project Folder Structure

## 1. Repository Overview

CloudNotes is organized into separate directories for frontend development, backend implementation, testing, and AWS infrastructure configuration.

GitHub Repository: [https://github.com/jebickson/CloudNotes-sam](https://github.com/jebickson/CloudNotes-sam)

## 2. Root Directory Structure

The main repository contains the following directories and files:

* `frontend/`
* `hello_world/`
* `events/`
* `tests/`
* `template.yaml`
* `samconfig.toml`

## 3. Directory Explanation

### 3.1 frontend/

Contains the Next.js frontend application.

This directory is responsible for the user interface and communication with backend API endpoints.

### 3.2 hello\_world/

Contains the Python AWS Lambda application code.

It includes the Lambda handler and its Python dependencies.

### 3.3 events/

Contains event JSON files that can be used when testing Lambda functions locally with AWS SAM.

### 3.4 tests/

Contains automated tests for the backend application.

The repository separates integration tests and unit tests.

## 4. Configuration Files

### template.yaml

The AWS SAM template defines the serverless infrastructure, including the Lambda function, API Gateway configuration, and database-related resources.

### samconfig.toml

Contains AWS SAM CLI configuration used during application deployment.

## 5. Project Organization

The repository separates application code from infrastructure configuration and testing resources.

This structure helps developers maintain, test, and deploy the application.
