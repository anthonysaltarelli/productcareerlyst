#!/bin/bash

# Test script for resume bullet analysis using OpenAI API
# This script tests the prompt and schema before implementation

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for API key
if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${RED}Error: OPENAI_API_KEY environment variable is not set${NC}"
  exit 1
fi

echo -e "${GREEN}Testing Resume Bullet Analysis with OpenAI API${NC}\n"

# Sample resume bullet for testing
SAMPLE_BULLET="Led cross-functional team to launch new product feature that increased user engagement by 25% and generated $2M in additional revenue"

# JSON Schema for structured output
# Note: additionalProperties must be false for all objects per OpenAI requirements
BULLET_ANALYSIS_SCHEMA=$(cat <<'EOF'
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "overallScore": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "grade": {
      "type": "string",
      "enum": ["F", "D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]
    },
    "vectors": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "clarity": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "score": {
              "type": "number",
              "minimum": 0,
              "maximum": 100
            },
            "feedback": {
              "type": "string"
            }
          },
          "required": ["score", "feedback"]
        },
        "impact": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "score": {
              "type": "number",
              "minimum": 0,
              "maximum": 100
            },
            "feedback": {
              "type": "string"
            }
          },
          "required": ["score", "feedback"]
        },
        "action": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "score": {
              "type": "number",
              "minimum": 0,
              "maximum": 100
            },
            "feedback": {
              "type": "string"
            }
          },
          "required": ["score", "feedback"]
        },
        "quantification": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "score": {
              "type": "number",
              "minimum": 0,
              "maximum": 100
            },
            "feedback": {
              "type": "string"
            }
          },
          "required": ["score", "feedback"]
        }
      },
      "required": ["clarity", "impact", "action", "quantification"]
    },
    "improvedVersions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 2,
      "maxItems": 3
    }
  },
  "required": ["overallScore", "grade", "vectors", "improvedVersions"]
}
EOF
)

# Prompt for analyzing resume bullet
ANALYSIS_PROMPT=$(cat <<'EOF'
You are an expert resume reviewer specializing in product management resumes. Your task is to analyze a resume bullet point and provide detailed scoring and feedback.

Context: This is for a product management role where impact is critical. The hiring manager wants to know: "Can this person impact my organization if I hire them?"

Analyze the following resume bullet point across four key dimensions:

1. **Clarity** (0-100): Is this bullet easy to understand quickly? Is it scannable? Is it using unnecessary jargon? Can a recruiter or hiring manager quickly grasp what was accomplished?

2. **Accomplishment/Impact** (0-100): Is this bullet actually conveying some type of accomplishment or impact? Is it easy to parse out what that is? Does it demonstrate value delivered to the organization?

3. **Action** (0-100): Is it clear what the user actually did themselves to achieve that impact/accomplishment? Can you identify the specific actions they took?

4. **Quantification** (0-100): If applicable, is the user quantifying their achievement/impact? Not all bullets are around direct impact, but they should be. Is it clear the scale of the impact? Are there numbers, percentages, or metrics that demonstrate the magnitude?

Provide:
- An overall score (0-100) that represents the bullet's effectiveness
- A letter grade (F, D, C-, C, C+, B-, B, B+, A-, A, A+)
- Individual scores and concise feedback (1-2 sentences) for each vector
- 2-3 improved versions of the bullet that maintain the original content but enhance clarity, impact, action clarity, and quantification where applicable

Resume bullet to analyze:
EOF
)

echo -e "${YELLOW}Sample Bullet:${NC}"
echo "$SAMPLE_BULLET"
echo ""

echo -e "${GREEN}Step 1: Calling OpenAI Responses API with structured output...${NC}"

# Create the request payload
REQUEST_PAYLOAD=$(cat <<EOF
{
  "model": "gpt-5.1",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "${ANALYSIS_PROMPT}\n\n${SAMPLE_BULLET}"
        }
      ]
    }
  ],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "bullet_analysis",
      "schema": ${BULLET_ANALYSIS_SCHEMA},
      "strict": true
    }
  }
}
EOF
)

# Make the API call
RESPONSE=$(curl -s -X POST https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$REQUEST_PAYLOAD")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
  echo -e "${RED}Error from OpenAI API:${NC}"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

# Extract response ID
RESPONSE_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ -z "$RESPONSE_ID" ] || [ "$RESPONSE_ID" = "null" ]; then
  echo -e "${RED}Failed to get response ID from OpenAI${NC}"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}Response ID: $RESPONSE_ID${NC}"
echo -e "${YELLOW}Polling for completion...${NC}"

# Poll for completion
STATUS="in_progress"
ATTEMPTS=0
MAX_ATTEMPTS=60

while [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; do
  sleep 2
  ATTEMPTS=$((ATTEMPTS + 1))

  if [ $ATTEMPTS -gt $MAX_ATTEMPTS ]; then
    echo -e "${RED}Timeout waiting for OpenAI response${NC}"
    exit 1
  fi

  STATUS_RESPONSE=$(curl -s "https://api.openai.com/v1/responses/$RESPONSE_ID" \
    -H "Authorization: Bearer $OPENAI_API_KEY")

  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')

  if [ "$STATUS" = "failed" ]; then
    echo -e "${RED}OpenAI processing failed:${NC}"
    echo "$STATUS_RESPONSE" | jq '.error'
    exit 1
  fi

  echo -e "${YELLOW}Status: $STATUS (attempt $ATTEMPTS/$MAX_ATTEMPTS)${NC}"
done

# Get final response
echo -e "${GREEN}Fetching final response...${NC}"
FINAL_RESPONSE=$(curl -s "https://api.openai.com/v1/responses/$RESPONSE_ID" \
  -H "Authorization: Bearer $OPENAI_API_KEY")

# Extract structured output
OUTPUT_TEXT=$(echo "$FINAL_RESPONSE" | jq -r '.output[0].content[] | select(.type == "output_text") | .text')

if [ -z "$OUTPUT_TEXT" ] || [ "$OUTPUT_TEXT" = "null" ]; then
  echo -e "${RED}Failed to extract structured data from OpenAI response${NC}"
  echo "$FINAL_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}Analysis Results:${NC}"
echo "$OUTPUT_TEXT" | jq '.'

echo -e "\n${GREEN}Test completed successfully!${NC}"


