#!/usr/bin/env bash

# Pull Staging Env File
aws secretsmanager get-secret-value --secret-id api.env.staging --region=us-west-2 | \
jq -r '.SecretString' | \
jq -r "to_entries|map(\"\(.key)=\\\"\(.value|tostring)\\\"\")|.[]" > .env.staging

# Pull Production Env File
aws secretsmanager get-secret-value --secret-id api.env.production --region=us-west-2 | \
jq -r '.SecretString' | \
jq -r "to_entries|map(\"\(.key)=\\\"\(.value|tostring)\\\"\")|.[]" > .env.production