#!/bin/bash

# Script to test Stripe billing endpoints for a trial subscription without payment method
# Usage: ./scripts/test-stripe-billing-endpoints.sh

set -e

# Load environment variables from .env.local
if [ -f .env.local ]; then
  # Source the file to load variables (handles special characters better)
  set -a
  source .env.local
  set +a
fi

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Error: STRIPE_SECRET_KEY is not set in environment variables"
  echo "Please set it in .env.local or export it before running this script"
  exit 1
fi

# Subscription ID from the URL
SUBSCRIPTION_ID="sub_1Sa7eCIpak0rJe7RN6cTPt2O"
OUTPUT_DIR="stripe-api-responses"
mkdir -p "$OUTPUT_DIR"

echo "🔍 Testing Stripe billing endpoints for subscription: $SUBSCRIPTION_ID"
echo "📁 Saving responses to: $OUTPUT_DIR/"
echo ""

# 1. Retrieve Subscription
echo "1️⃣  Retrieving subscription..."
curl -s -X GET "https://api.stripe.com/v1/subscriptions/$SUBSCRIPTION_ID" \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | jq '.' > "$OUTPUT_DIR/01_subscription.json"

# Extract customer_id from subscription
CUSTOMER_ID=$(jq -r '.customer' "$OUTPUT_DIR/01_subscription.json")
echo "   ✅ Customer ID: $CUSTOMER_ID"
echo ""

# 2. Retrieve Customer
echo "2️⃣  Retrieving customer..."
curl -s -X GET "https://api.stripe.com/v1/customers/$CUSTOMER_ID" \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | jq '.' > "$OUTPUT_DIR/02_customer.json"
echo "   ✅ Customer retrieved"
echo ""

# 3. Create Preview Invoice
echo "3️⃣  Creating preview invoice..."
curl -s -X POST "https://api.stripe.com/v1/invoices/create_preview" \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "customer=$CUSTOMER_ID" \
  -d "subscription=$SUBSCRIPTION_ID" \
  | jq '.' > "$OUTPUT_DIR/03_invoice_preview.json" 2>&1 || echo "   ⚠️  Preview invoice may have failed (check response)"
echo ""

# 4. List Payment Methods
echo "4️⃣  Listing payment methods..."
curl -s -X GET "https://api.stripe.com/v1/payment_methods?customer=$CUSTOMER_ID" \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | jq '.' > "$OUTPUT_DIR/04_payment_methods.json"
echo "   ✅ Payment methods retrieved"
echo ""

# 5. List Invoices
echo "5️⃣  Listing invoices..."
curl -s -X GET "https://api.stripe.com/v1/invoices?customer=$CUSTOMER_ID&limit=100" \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | jq '.' > "$OUTPUT_DIR/05_invoices.json"
echo "   ✅ Invoices retrieved"
echo ""

# 6. Retrieve Upcoming Invoice (alternative endpoint)
echo "6️⃣  Retrieving upcoming invoice..."
curl -s -X GET "https://api.stripe.com/v1/invoices/upcoming?customer=$CUSTOMER_ID&subscription=$SUBSCRIPTION_ID" \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | jq '.' > "$OUTPUT_DIR/06_upcoming_invoice.json" 2>&1 || echo "   ⚠️  Upcoming invoice may have failed (check response)"
echo ""

echo "✅ All requests completed!"
echo ""
echo "📊 Summary:"
echo "   - Subscription: $OUTPUT_DIR/01_subscription.json"
echo "   - Customer: $OUTPUT_DIR/02_customer.json"
echo "   - Invoice Preview: $OUTPUT_DIR/03_invoice_preview.json"
echo "   - Payment Methods: $OUTPUT_DIR/04_payment_methods.json"
echo "   - Invoices: $OUTPUT_DIR/05_invoices.json"
echo "   - Upcoming Invoice: $OUTPUT_DIR/06_upcoming_invoice.json"
echo ""
echo "🔍 Key fields to check:"
echo "   - subscription.status"
echo "   - subscription.trial_end"
echo "   - subscription.default_payment_method"
echo "   - subscription.trial_settings"
echo "   - customer.invoice_settings.default_payment_method"
echo "   - payment_methods.data (should be empty array if no payment method)"

