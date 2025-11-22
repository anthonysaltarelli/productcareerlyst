#!/bin/bash

# Test script for Perplexity API
# Tests the API response with a sample company research query

# Check if PERPLEXITY_API_KEY is set
if [ -z "$PERPLEXITY_API_KEY" ]; then
  echo "Error: PERPLEXITY_API_KEY environment variable is not set"
  echo "Please set it in your .env.local file or export it:"
  echo "  export PERPLEXITY_API_KEY=your_api_key_here"
  exit 1
fi

# Test query for Airbnb mission statement
QUERY="Provide a detailed summary of the mission statement for Airbnb. Focus on what the company aims to achieve, its purpose, and how it seeks to impact its customers or the broader community. If available, include direct quotes from the company's official resources or leadership."

echo "=========================================="
echo "Testing Perplexity API with sonar model"
echo "=========================================="
echo ""
echo "Query: $QUERY"
echo ""
echo "Making API request..."
echo ""

# Make the API request and save to temp file
TEMP_FILE=$(mktemp)
HTTP_CODE=$(curl -s -w "%{http_code}" -X POST "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"sonar\",
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"$QUERY\"
      }
    ],
    \"temperature\": 0.2,
    \"max_tokens\": 1000
  }" -o "$TEMP_FILE")

echo "HTTP Status Code: $HTTP_CODE"
echo ""

# Check if jq is available
if command -v jq &> /dev/null; then
  echo "=== Full Response (formatted) ==="
  cat "$TEMP_FILE" | jq '.'
  echo ""
  echo "=== Key Fields ==="
  echo "Content:"
  cat "$TEMP_FILE" | jq -r '.choices[0].message.content' | head -20
  echo ""
  echo "Search Results:"
  cat "$TEMP_FILE" | jq '.search_results // []' | head -30
  echo ""
  echo "Usage:"
  cat "$TEMP_FILE" | jq '.usage'
else
  echo "=== Full Response (raw JSON) ==="
  cat "$TEMP_FILE"
  echo ""
  echo ""
  echo "Note: Install 'jq' for better formatted output:"
  echo "  brew install jq  (macOS)"
  echo "  apt-get install jq  (Linux)"
fi

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo "=========================================="
echo "Test complete!"
echo "=========================================="

