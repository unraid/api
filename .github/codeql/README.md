# CodeQL Security Analysis for Unraid API

This directory contains custom CodeQL queries and configurations for security analysis of the Unraid API codebase.

## Overview

The analysis is configured to run:
- On all pushes to the main branch
- On all pull requests
- Weekly via scheduled runs

## Custom Queries

The following custom queries are implemented:

1. **API Authorization Bypass Detection**  
   Identifies API handlers that may not properly check authorization before performing operations.

2. **GraphQL Injection Detection**  
   Detects potential injection vulnerabilities in GraphQL queries and operations.

3. **Hardcoded Secrets Detection**  
   Finds potential hardcoded secrets or credentials in the codebase.

4. **Insecure Cryptographic Implementations**  
   Identifies usage of weak cryptographic algorithms or insecure random number generation.

5. **Path Traversal Vulnerability Detection**  
   Detects potential path traversal vulnerabilities in file system operations.

## Configuration

The CodeQL analysis is configured in:
- `.github/workflows/codeql-analysis.yml` - Workflow configuration
- `.github/codeql/codeql-config.yml` - CodeQL engine configuration

## Running Locally

To run these queries locally:

1. Install the CodeQL CLI: https://github.com/github/codeql-cli-binaries/releases
2. Create a CodeQL database:
   ```
   codeql database create <db-name> --language=javascript --source-root=.
   ```
3. Run a query:
   ```
   codeql query run .github/codeql/custom-queries/javascript/api-auth-bypass.ql --database=<db-name>
   ``` 