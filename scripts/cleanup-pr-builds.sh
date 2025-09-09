#!/bin/bash

# Script to delete all PR builds from Cloudflare R2
# This will remove all artifacts under unraid-api/tag/PR* paths

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Cloudflare PR Build Cleanup Script${NC}"
echo "This will delete all PR builds from the preview bucket"
echo ""

# Check for required environment variables
if [ -z "$CF_ACCESS_KEY_ID" ] || [ -z "$CF_SECRET_ACCESS_KEY" ] || [ -z "$CF_ENDPOINT" ] || [ -z "$CF_BUCKET_PREVIEW" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Please set the following environment variables:"
    echo "  - CF_ACCESS_KEY_ID"
    echo "  - CF_SECRET_ACCESS_KEY"
    echo "  - CF_ENDPOINT"
    echo "  - CF_BUCKET_PREVIEW"
    echo ""
    echo "You can source them from your .env file or export them manually:"
    echo "  export CF_ACCESS_KEY_ID='your-key-id'"
    echo "  export CF_SECRET_ACCESS_KEY='your-secret-key'"
    echo "  export CF_ENDPOINT='your-endpoint'"
    echo "  export CF_BUCKET_PREVIEW='your-bucket'"
    exit 1
fi

# Configure AWS CLI for Cloudflare R2
export AWS_ACCESS_KEY_ID="$CF_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$CF_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

echo "Endpoint: $CF_ENDPOINT"
echo "Bucket: $CF_BUCKET_PREVIEW"
echo ""

# List all PR directories
echo -e "${YELLOW}📋 Listing all PR builds...${NC}"
PR_DIRS=$(aws s3 ls "s3://${CF_BUCKET_PREVIEW}/unraid-api/tag/" --endpoint-url "$CF_ENDPOINT" 2>/dev/null | grep "PRE PR" | awk '{print $2}' || true)

if [ -z "$PR_DIRS" ]; then
    echo -e "${GREEN}✅ No PR builds found to clean up${NC}"
    exit 0
fi

# Count PR builds
PR_COUNT=$(echo "$PR_DIRS" | wc -l | tr -d ' ')
echo -e "Found ${YELLOW}${PR_COUNT}${NC} PR build(s):"
echo "$PR_DIRS"
echo ""

# Confirmation prompt
read -p "Are you sure you want to delete ALL these PR builds? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}⚠️  Cleanup cancelled${NC}"
    exit 0
fi

# Delete each PR directory
DELETED=0
FAILED=0

for PR_DIR in $PR_DIRS; do
    PR_NUM=${PR_DIR%/}  # Remove trailing slash
    echo -n "Deleting $PR_NUM... "
    
    if aws s3 rm "s3://${CF_BUCKET_PREVIEW}/unraid-api/tag/${PR_NUM}" \
        --recursive \
        --endpoint-url "$CF_ENDPOINT" \
        >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((DELETED++))
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
    fi
done

echo ""
echo -e "${GREEN}🎉 Cleanup complete!${NC}"
echo "  - Deleted: $DELETED PR build(s)"
if [ $FAILED -gt 0 ]; then
    echo -e "  - Failed: ${RED}$FAILED${NC} PR build(s)"
fi

# Optional: List remaining items to verify
echo ""
echo -e "${YELLOW}📋 Verifying cleanup...${NC}"
REMAINING=$(aws s3 ls "s3://${CF_BUCKET_PREVIEW}/unraid-api/tag/" --endpoint-url "$CF_ENDPOINT" 2>/dev/null | grep -c "PRE PR" || true)
# Ensure REMAINING is a valid number
REMAINING=${REMAINING:-0}
echo "Remaining PR builds: $REMAINING"

if [ "$REMAINING" -eq 0 ]; then
    echo -e "${GREEN}✅ All PR builds successfully removed${NC}"
else
    echo -e "${YELLOW}⚠️  Some PR builds may still exist${NC}"
fi