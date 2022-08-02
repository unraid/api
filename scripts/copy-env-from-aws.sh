
# Pull Staging Env File
if [ -n "$STAGING_SECRET_ID" ]; then
aws secretsmanager get-secret-value --secret-id $STAGING_SECRET_ID --region=us-east-1 | \
jq -r '.SecretString' | \
jq -r "to_entries|map(\"\(.key)=\\\"\(.value|tostring)\\\"\")|.[]" > .env.staging
else 
echo "To copy staging secrets, please set the STAGING_SECRET_ID variable";
fi

# Pull Production Env File
if [ -n "$PRODUCTION_SECRET_ID" ]; then
aws secretsmanager get-secret-value --secret-id $PRODUCTION_SECRET_ID --region=us-east-1 | \
jq -r '.SecretString' | \
jq -r "to_entries|map(\"\(.key)=\\\"\(.value|tostring)\\\"\")|.[]" > .env.production
else
echo "To copy production secrets, please set the PRODUCTION_SECRET_ID variable";
fi