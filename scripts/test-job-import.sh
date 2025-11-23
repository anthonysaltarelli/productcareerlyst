#!/bin/bash

# Test script for job import from URL
# Usage: ./scripts/test-job-import.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Job Import from URL${NC}"
echo "================================"
echo ""

# Check if .env or .env.local file exists and load it
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
elif [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo -e "${RED}Error: .env or .env.local file not found${NC}"
  exit 1
fi

# Check for required environment variables
if [ -z "$FIRECRAWL_API_KEY" ]; then
  echo -e "${RED}Error: FIRECRAWL_API_KEY not set in .env${NC}"
  exit 1
fi

if [ -z "$OPEN_AI_SECRET_KEY" ]; then
  echo -e "${RED}Error: OPEN_AI_SECRET_KEY not set in .env${NC}"
  exit 1
fi

# Test URL (Meta careers example)
TEST_URL="${1:-https://www.metacareers.com/profile/job_details/300760325782735}"

echo -e "${YELLOW}Step 1: Testing Firecrawl API${NC}"
echo "URL: $TEST_URL"
echo ""

FIRECRAWL_RESPONSE=$(curl -s -X POST "https://api.firecrawl.dev/v2/scrape" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$TEST_URL\",
    \"onlyMainContent\": false,
    \"maxAge\": 172800000,
    \"parsers\": [\"pdf\"],
    \"formats\": [\"markdown\"]
  }")

echo "Firecrawl Response:"
echo "$FIRECRAWL_RESPONSE" | jq '.' 2>/dev/null || echo "$FIRECRAWL_RESPONSE"
echo ""

# Extract markdown content
MARKDOWN=$(echo "$FIRECRAWL_RESPONSE" | jq -r '.data.markdown // .markdown // ""' 2>/dev/null || echo "")

if [ -z "$MARKDOWN" ] || [ "$MARKDOWN" == "null" ]; then
  echo -e "${RED}Error: No markdown content extracted from Firecrawl${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Firecrawl extraction successful${NC}"
echo "Markdown length: ${#MARKDOWN} characters"
echo ""

# Truncate markdown for display
MARKDOWN_PREVIEW=$(echo "$MARKDOWN" | head -c 500)
echo "Markdown preview (first 500 chars):"
echo "$MARKDOWN_PREVIEW..."
echo ""

echo -e "${YELLOW}Step 2: Testing OpenAI Responses API${NC}"
echo ""

# Create the prompt
PROMPT="Extract job and company information from the following job description. Extract as much detail as possible.

Job Description:
$MARKDOWN

Extract:
1. Company information: name, website, LinkedIn URL, industry, size, headquarters location, description
2. Job information: title, location, work mode (remote/hybrid/onsite), salary range, full description, application deadline

Be thorough and extract all available information. If information is not available, omit that field."

# Create the schema (simplified for testing)
SCHEMA='{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "company": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "name": {"type": "string"},
        "website": {"type": ["string", "null"]},
        "linkedin_url": {"type": ["string", "null"]},
        "industry": {"type": ["string", "null"], "enum": ["technology", "finance", "healthcare", "retail", "consulting", "education", "manufacturing", "media", "other", null]},
        "size": {"type": ["string", "null"], "enum": ["1-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+", null]},
        "headquarters_city": {"type": ["string", "null"]},
        "headquarters_state": {"type": ["string", "null"]},
        "headquarters_country": {"type": ["string", "null"]},
        "description": {"type": ["string", "null"]}
      },
      "required": ["name", "website", "linkedin_url", "industry", "size", "headquarters_city", "headquarters_state", "headquarters_country", "description"]
    },
    "job": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "title": {"type": "string"},
        "location": {"type": ["string", "null"]},
        "work_mode": {"type": ["string", "null"], "enum": ["remote", "hybrid", "onsite", null]},
        "salary_min": {"type": ["number", "null"]},
        "salary_max": {"type": ["number", "null"]},
        "salary_currency": {"type": ["string", "null"], "enum": ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", null]},
        "description": {"type": ["string", "null"]},
        "deadline": {"type": ["string", "null"]}
      },
      "required": ["title", "location", "work_mode", "salary_min", "salary_max", "salary_currency", "description", "deadline"]
    }
  },
  "required": ["company", "job"]
}'

# Create the request payload
REQUEST_PAYLOAD=$(jq -n \
  --arg prompt "$PROMPT" \
  --argjson schema "$SCHEMA" \
  '{
    "model": "gpt-5.1",
    "input": [
      {
        "type": "message",
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": $prompt
          }
        ]
      }
    ],
    "text": {
      "format": {
        "type": "json_schema",
        "name": "job_import",
        "schema": $schema,
        "strict": true
      }
    }
  }')

echo "Sending request to OpenAI..."
OPENAI_RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/responses" \
  -H "Authorization: Bearer $OPEN_AI_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD")

echo "OpenAI Response:"
echo "$OPENAI_RESPONSE" | jq '.' 2>/dev/null || echo "$OPENAI_RESPONSE"
echo ""

# Extract response ID
RESPONSE_ID=$(echo "$OPENAI_RESPONSE" | jq -r '.id // empty' 2>/dev/null || echo "")

if [ -z "$RESPONSE_ID" ]; then
  echo -e "${RED}Error: No response ID from OpenAI${NC}"
  exit 1
fi

echo -e "${GREEN}✓ OpenAI request created${NC}"
echo "Response ID: $RESPONSE_ID"
echo ""

echo -e "${YELLOW}Step 3: Polling for completion${NC}"
echo ""

# Poll for completion
MAX_ATTEMPTS=60
ATTEMPT=0
STATUS="in_progress"

while [ "$STATUS" == "in_progress" ] || [ "$STATUS" == "queued" ]; do
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo -e "${RED}Error: Timeout waiting for OpenAI response${NC}"
    exit 1
  fi

  sleep 2
  ATTEMPT=$((ATTEMPT + 1))

  STATUS_RESPONSE=$(curl -s -X GET "https://api.openai.com/v1/responses/$RESPONSE_ID" \
    -H "Authorization: Bearer $OPEN_AI_SECRET_KEY")

  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

  echo "Attempt $ATTEMPT: Status = $STATUS"

  if [ "$STATUS" == "failed" ]; then
    ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.error // {}' 2>/dev/null || echo "{}")
    echo -e "${RED}Error: OpenAI request failed${NC}"
    echo "$ERROR" | jq '.' 2>/dev/null || echo "$ERROR"
    exit 1
  fi
done

if [ "$STATUS" != "completed" ]; then
  echo -e "${RED}Error: Unexpected status: $STATUS${NC}"
  exit 1
fi

echo -e "${GREEN}✓ OpenAI processing completed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Fetching final response${NC}"
echo ""

# Get final response
FINAL_RESPONSE=$(curl -s -X GET "https://api.openai.com/v1/responses/$RESPONSE_ID" \
  -H "Authorization: Bearer $OPEN_AI_SECRET_KEY")

echo "Final Response:"
echo "$FINAL_RESPONSE" | jq '.' 2>/dev/null || echo "$FINAL_RESPONSE"
echo ""

# Extract structured data
OUTPUT_ITEM=$(echo "$FINAL_RESPONSE" | jq '.output[0]' 2>/dev/null || echo "{}")

if [ "$OUTPUT_ITEM" == "null" ] || [ -z "$OUTPUT_ITEM" ]; then
  echo -e "${RED}Error: No output in final response${NC}"
  exit 1
fi

# Try to extract output_text
EXTRACTED_DATA=$(echo "$OUTPUT_ITEM" | jq -r '.content[]? | select(.type == "output_text") | .text' 2>/dev/null || echo "")

if [ -z "$EXTRACTED_DATA" ]; then
  echo -e "${RED}Error: No output_text found in response${NC}"
  echo "Available content types:"
  echo "$OUTPUT_ITEM" | jq '.content[]?.type' 2>/dev/null || echo "none"
  exit 1
fi

echo -e "${GREEN}✓ Data extracted successfully${NC}"
echo ""
echo "Extracted JSON:"
echo "$EXTRACTED_DATA" | jq '.' 2>/dev/null || echo "$EXTRACTED_DATA"
echo ""

# Validate the structure
COMPANY_NAME=$(echo "$EXTRACTED_DATA" | jq -r '.company.name // empty' 2>/dev/null || echo "")
JOB_TITLE=$(echo "$EXTRACTED_DATA" | jq -r '.job.title // empty' 2>/dev/null || echo "")

if [ -z "$COMPANY_NAME" ] || [ -z "$JOB_TITLE" ]; then
  echo -e "${RED}Error: Missing required fields (company.name or job.title)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Validation passed${NC}"
echo "Company: $COMPANY_NAME"
echo "Job Title: $JOB_TITLE"
echo ""
echo -e "${GREEN}All tests passed!${NC}"

