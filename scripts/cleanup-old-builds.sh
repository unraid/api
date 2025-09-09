#!/bin/bash

# Script to clean up old timestamped builds from Cloudflare R2
# This will remove old .txz files with the pattern dynamix.unraid.net-YYYY.MM.DD.HHMM.txz

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Cloudflare Old Build Cleanup Script${NC}"
echo "This will delete old timestamped .txz builds from the preview bucket"
echo ""

# Check for required environment variables
if [ -z "$CF_ACCESS_KEY_ID" ] || [ -z "$CF_SECRET_ACCESS_KEY" ] || [ -z "$CF_ENDPOINT" ] || [ -z "$CF_BUCKET_PREVIEW" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Please set the following environment variables:"
    echo "  - CF_ACCESS_KEY_ID"
    echo "  - CF_SECRET_ACCESS_KEY"
    echo "  - CF_ENDPOINT"
    echo "  - CF_BUCKET_PREVIEW"
    exit 1
fi

# Configure AWS CLI for Cloudflare R2
export AWS_ACCESS_KEY_ID="$CF_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$CF_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

echo "Endpoint: $CF_ENDPOINT"
echo "Bucket: $CF_BUCKET_PREVIEW"
echo ""

# Optional: specify number of days to keep (default: 7)
KEEP_DAYS=${1:-7}
echo -e "${BLUE}Keeping builds from the last ${KEEP_DAYS} days${NC}"
echo ""

# Calculate cutoff date
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CUTOFF_DATE=$(date -v -${KEEP_DAYS}d +"%Y.%m.%d")
else
    # Linux
    CUTOFF_DATE=$(date -d "${KEEP_DAYS} days ago" +"%Y.%m.%d")
fi

echo "Cutoff date: ${CUTOFF_DATE} (will delete builds older than this)"
echo ""

# List all timestamped TXZ files in the unraid-api directory
echo -e "${YELLOW}📋 Scanning for old builds...${NC}"

# Get all .txz files matching the pattern
ALL_FILES=$(aws s3 ls "s3://${CF_BUCKET_PREVIEW}/unraid-api/" --endpoint-url "$CF_ENDPOINT" --recursive | \
    grep -E "dynamix\.unraid\.net-[0-9]{4}\.[0-9]{2}\.[0-9]{2}\.[0-9]{4}\.txz" | \
    awk '{print $4}' || true)

if [ -z "$ALL_FILES" ]; then
    echo -e "${GREEN}✅ No timestamped builds found${NC}"
    exit 0
fi

# Filter files older than cutoff
OLD_FILES=""
KEEP_FILES=""
TOTAL_COUNT=0
OLD_COUNT=0

while IFS= read -r file; do
    ((TOTAL_COUNT++))
    # Extract date from filename (format: YYYY.MM.DD.HHMM)
    if [[ $file =~ ([0-9]{4}\.[0-9]{2}\.[0-9]{2})\.[0-9]{4}\.txz ]]; then
        FILE_DATE="${BASH_REMATCH[1]}"
        
        # Compare dates (string comparison works for YYYY.MM.DD format)
        if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
            OLD_FILES="${OLD_FILES}${file}\n"
            ((OLD_COUNT++))
        else
            KEEP_FILES="${KEEP_FILES}${file}\n"
        fi
    fi
done <<< "$ALL_FILES"

echo "Found ${TOTAL_COUNT} total timestamped builds"
echo "Will delete ${OLD_COUNT} old builds"
echo "Will keep $((TOTAL_COUNT - OLD_COUNT)) recent builds"
echo ""

if [ "$OLD_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No old builds to delete${NC}"
    exit 0
fi

# Show sample of files to be deleted
echo -e "${YELLOW}Sample of files to be deleted:${NC}"
echo -e "$OLD_FILES" | head -5
if [ "$OLD_COUNT" -gt 5 ]; then
    echo "... and $((OLD_COUNT - 5)) more"
fi
echo ""

# Confirmation prompt
read -p "Are you sure you want to delete these ${OLD_COUNT} old builds? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}⚠️  Cleanup cancelled${NC}"
    exit 0
fi

# Delete old files
DELETED=0
FAILED=0

echo -e "${YELLOW}🗑️  Deleting old builds...${NC}"
while IFS= read -r file; do
    if [ -n "$file" ]; then
        echo -n "Deleting $(basename "$file")... "
        
        if aws s3 rm "s3://${CF_BUCKET_PREVIEW}/${file}" \
            --endpoint-url "$CF_ENDPOINT" \
            >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            ((DELETED++))
        else
            echo -e "${RED}✗${NC}"
            ((FAILED++))
        fi
    fi
done <<< "$(echo -e "$OLD_FILES")"

echo ""
echo -e "${GREEN}🎉 Cleanup complete!${NC}"
echo "  - Deleted: $DELETED old build(s)"
if [ $FAILED -gt 0 ]; then
    echo -e "  - Failed: ${RED}$FAILED${NC} build(s)"
fi

# Show remaining recent builds
echo ""
echo -e "${BLUE}📦 Recent builds kept:${NC}"
echo -e "$KEEP_FILES" | head -5
KEEP_COUNT=$(echo -e "$KEEP_FILES" | grep -c . || echo 0)
if [ "$KEEP_COUNT" -gt 5 ]; then
    echo "... and $((KEEP_COUNT - 5)) more"
fi