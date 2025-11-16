#!/bin/bash

# Test script for resume import using OpenAI API
# This script helps iterate on the prompt before implementing the UI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if OPEN_AI_SECRET_KEY is set
if [ -z "$OPEN_AI_SECRET_KEY" ]; then
  echo -e "${RED}Error: OPEN_AI_SECRET_KEY environment variable is not set${NC}"
  exit 1
fi

# Check if file path is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage: ./scripts/test-resume-import.sh <path-to-resume.pdf>${NC}"
  echo -e "${YELLOW}Example: ./scripts/test-resume-import.sh public/Files/Anthony+Saltarelli+Resume.pdf${NC}"
  exit 1
fi

RESUME_FILE="$1"

# Check if file exists
if [ ! -f "$RESUME_FILE" ]; then
  echo -e "${RED}Error: File not found: $RESUME_FILE${NC}"
  exit 1
fi

# Check file size (5MB limit)
FILE_SIZE=$(stat -f%z "$RESUME_FILE" 2>/dev/null || stat -c%s "$RESUME_FILE" 2>/dev/null)
MAX_SIZE=$((5 * 1024 * 1024)) # 5MB in bytes

if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
  echo -e "${RED}Error: File size ($FILE_SIZE bytes) exceeds 5MB limit${NC}"
  exit 1
fi

echo -e "${GREEN}Step 1: Uploading file to OpenAI...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPEN_AI_SECRET_KEY" \
  -F "file=@$RESUME_FILE" \
  -F "purpose=assistants")

FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id' 2>/dev/null || echo "$UPLOAD_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$FILE_ID" ] || [ "$FILE_ID" = "null" ]; then
  echo -e "${RED}Error: Failed to upload file${NC}"
  echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"
  exit 1
fi

echo -e "${GREEN}File uploaded successfully. File ID: $FILE_ID${NC}"

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Cleaning up: Deleting uploaded file...${NC}"
  curl -s -X DELETE "https://api.openai.com/v1/files/$FILE_ID" \
    -H "Authorization: Bearer $OPEN_AI_SECRET_KEY" > /dev/null
  echo -e "${GREEN}Cleanup complete${NC}"
}

trap cleanup EXIT

echo -e "\n${GREEN}Step 2: Calling OpenAI Responses API with structured output...${NC}"

# JSON Schema for structured output
# Note: additionalProperties must be false for all objects per OpenAI requirements
JSON_SCHEMA='{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "contactInfo": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "full_name": { "type": "string" },
        "email": { "type": "string" },
        "phone": { "type": ["string", "null"] },
        "location": { "type": ["string", "null"] },
        "linkedin": { "type": ["string", "null"] },
        "portfolio": { "type": ["string", "null"] }
      },
      "required": ["full_name", "email", "phone", "location", "linkedin", "portfolio"]
    },
    "summary": {
      "type": ["string", "null"]
    },
    "experiences": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "title": { "type": "string" },
          "company": { "type": "string" },
          "location": { "type": ["string", "null"] },
          "start_date": { "type": ["string", "null"] },
          "end_date": { "type": ["string", "null"] },
          "bullets": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["title", "company", "location", "start_date", "end_date", "bullets"]
      }
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "school": { "type": "string" },
          "degree": { "type": "string" },
          "field": { "type": ["string", "null"] },
          "location": { "type": ["string", "null"] },
          "start_date": { "type": ["string", "null"] },
          "end_date": { "type": ["string", "null"] },
          "gpa": { "type": ["string", "null"] },
          "achievements": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["school", "degree", "field", "location", "start_date", "end_date", "gpa", "achievements"]
      }
    },
    "skills": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "technical": { "type": "array", "items": { "type": "string" } },
        "product": { "type": "array", "items": { "type": "string" } },
        "soft": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["technical", "product", "soft"]
    }
  },
  "required": ["contactInfo", "summary", "experiences", "education", "skills"]
}'

# Prompt for extracting resume data
PROMPT="Extract all information from this resume and return it in the specified JSON format. Include:
- Contact information (name, email, phone, location, LinkedIn, portfolio)
- Professional summary
- All work experiences with their bullet points
- All education entries with achievements
- Skills categorized as technical, product, or soft skills

Be thorough and extract all details accurately. For dates, use YYYY-MM format when possible, or preserve the original format if unclear."

# Request payload - use jq to properly construct JSON
# The input should be a message with content array containing text and file
REQUEST_PAYLOAD=$(jq -n \
  --arg prompt "$PROMPT" \
  --arg file_id "$FILE_ID" \
  --argjson schema "$JSON_SCHEMA" \
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
          },
          {
            "type": "input_file",
            "file_id": $file_id
          }
        ]
      }
    ],
    "text": {
      "format": {
        "type": "json_schema",
        "name": "resume_data",
        "schema": $schema,
        "strict": true
      }
    }
  }')

echo -e "${YELLOW}Request payload:${NC}"
echo "$REQUEST_PAYLOAD" | jq '.' 2>/dev/null || echo "$REQUEST_PAYLOAD"

RESPONSE=$(curl -s -X POST https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPEN_AI_SECRET_KEY" \
  -d "$REQUEST_PAYLOAD")

echo -e "\n${GREEN}Step 3: Response received${NC}"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract response ID
RESPONSE_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null || echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$RESPONSE_ID" ] || [ "$RESPONSE_ID" = "null" ]; then
  echo -e "${RED}Error: Failed to get response ID${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo -e "\n${GREEN}Response ID: $RESPONSE_ID${NC}"
echo -e "${YELLOW}Polling for completion...${NC}"

# Poll for completion
STATUS="in_progress"
ATTEMPTS=0
MAX_ATTEMPTS=60

while [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; do
  sleep 2
  ATTEMPTS=$((ATTEMPTS + 1))
  
  if [ $ATTEMPTS -gt $MAX_ATTEMPTS ]; then
    echo -e "${RED}Error: Timeout waiting for response${NC}"
    exit 1
  fi
  
  STATUS_RESPONSE=$(curl -s "https://api.openai.com/v1/responses/$RESPONSE_ID" \
    -H "Authorization: Bearer $OPEN_AI_SECRET_KEY")
  
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null || echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  
  if [ "$STATUS" = "failed" ]; then
    echo -e "${RED}Error: Response failed${NC}"
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    exit 1
  fi
  
  echo -e "${YELLOW}Status: $STATUS (attempt $ATTEMPTS/$MAX_ATTEMPTS)${NC}"
done

# Get final response
echo -e "\n${GREEN}Step 4: Retrieving final response...${NC}"
FINAL_RESPONSE=$(curl -s "https://api.openai.com/v1/responses/$RESPONSE_ID" \
  -H "Authorization: Bearer $OPEN_AI_SECRET_KEY")

# Extract the structured output
OUTPUT_TEXT=$(echo "$FINAL_RESPONSE" | jq -r '.output[0].content[]? | select(.type == "output_text") | .text' 2>/dev/null)

if [ -z "$OUTPUT_TEXT" ]; then
  echo -e "${RED}Error: Could not extract output text${NC}"
  echo "$FINAL_RESPONSE" | jq '.' 2>/dev/null || echo "$FINAL_RESPONSE"
  exit 1
fi

echo -e "\n${GREEN}Extracted Resume Data:${NC}"
echo "$OUTPUT_TEXT" | jq '.' 2>/dev/null || echo "$OUTPUT_TEXT"

# Save to file
OUTPUT_FILE="resume-extraction-$(date +%Y%m%d-%H%M%S).json"
echo "$OUTPUT_TEXT" | jq '.' > "$OUTPUT_FILE" 2>/dev/null || echo "$OUTPUT_TEXT" > "$OUTPUT_FILE"
echo -e "\n${GREEN}Saved to: $OUTPUT_FILE${NC}"

