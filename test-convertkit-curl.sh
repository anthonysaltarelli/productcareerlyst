#!/bin/bash

# ConvertKit API V4 Test Script
# Tests the correct endpoints for adding subscribers to forms and sequences
# Based on ConvertKit V4 API documentation

# Load API key from environment variable
if [ -z "$CONVERTKIT_API_KEY" ]; then
  echo "❌ Error: CONVERTKIT_API_KEY environment variable is not set"
  echo "   Set it with: export CONVERTKIT_API_KEY='your_api_key_here'"
  exit 1
fi

API_KEY="$CONVERTKIT_API_KEY"
BASE_URL="https://api.kit.com/v4"

# Test email (use a unique one for testing)
TEST_EMAIL="test-$(date +%s)@example.com"
FORM_ID=7348426
SEQUENCE_ID=2100454

echo "=== ConvertKit API V4 Test ==="
echo "API Key: ${API_KEY:0:4}...${API_KEY: -4}"
echo "Test Email: $TEST_EMAIL"
echo "Form ID: $FORM_ID"
echo "Sequence ID: $SEQUENCE_ID"
echo ""

# Test 1: Add subscriber to form using POST /v4/subscribers with form_id
echo "=== Test 1: Add subscriber to form ==="
echo "Endpoint: POST /v4/subscribers"
echo "Body: { email_address: \"$TEST_EMAIL\", form_id: $FORM_ID }"
echo ""

RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/subscribers" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "X-Kit-Api-Key: $API_KEY" \
  -d "{
    \"email_address\": \"$TEST_EMAIL\",
    \"form_id\": $FORM_ID
  }")

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS:/d')

echo "Response Status: $HTTP_STATUS1"
echo "Response Body:"
if command -v jq &> /dev/null; then
  echo "$BODY1" | jq '.' 2>/dev/null || echo "$BODY1"
else
  echo "$BODY1"
fi
echo ""

if [ "$HTTP_STATUS1" != "200" ] && [ "$HTTP_STATUS1" != "201" ]; then
  echo "❌ Form subscription failed with status $HTTP_STATUS1"
  echo "   This might mean:"
  echo "   - Form ID $FORM_ID doesn't exist in your ConvertKit account"
  echo "   - API key doesn't have permission to access this form"
  echo "   - Form is inactive or deleted"
  exit 1
fi

echo "✅ Form subscription successful!"

# Extract subscriber ID from response (if available)
SUBSCRIBER_ID=$(echo "$BODY1" | jq -r '.subscriber.id // .subscription.subscriber.id // empty' 2>/dev/null)
if [ -n "$SUBSCRIBER_ID" ] && [ "$SUBSCRIBER_ID" != "null" ]; then
  echo "   Subscriber ID: $SUBSCRIBER_ID"
fi

echo ""
echo "=== Test 2: Add subscriber to sequence by email ==="
echo "Endpoint: POST /v4/sequences/$SEQUENCE_ID/subscribers"
echo "Body: { email_address: \"$TEST_EMAIL\" }"
echo ""

RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/sequences/$SEQUENCE_ID/subscribers" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "X-Kit-Api-Key: $API_KEY" \
  -d "{
    \"email_address\": \"$TEST_EMAIL\"
  }")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS:/d')

echo "Response Status: $HTTP_STATUS2"
echo "Response Body:"
if command -v jq &> /dev/null; then
  echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
else
  echo "$BODY2"
fi
echo ""

if [ "$HTTP_STATUS2" != "200" ] && [ "$HTTP_STATUS2" != "201" ]; then
  echo "❌ Sequence subscription failed with status $HTTP_STATUS2"
  echo "   This might mean:"
  echo "   - Sequence ID $SEQUENCE_ID doesn't exist in your ConvertKit account"
  echo "   - API key doesn't have permission to access this sequence"
  echo "   - Sequence is inactive (422 error)"
  echo "   - Subscriber doesn't exist yet (shouldn't happen if Test 1 passed)"
  exit 1
fi

echo "✅ Sequence subscription successful!"

echo ""
echo "=== Summary ==="
echo "✅ Both tests passed!"
echo "  - Form subscription: HTTP $HTTP_STATUS1"
echo "  - Sequence subscription: HTTP $HTTP_STATUS2"
echo "  - Test email: $TEST_EMAIL"
if [ -n "$SUBSCRIBER_ID" ] && [ "$SUBSCRIBER_ID" != "null" ]; then
  echo "  - Subscriber ID: $SUBSCRIBER_ID"
fi

