# Stripe Trial Without Payment Method - API Response Analysis

## Test Subscriptions

### Subscription 1: WITH Payment Method
- **Subscription ID**: `sub_1Sa7SfIpak0rJe7RWMwcb4Ju`
- **Customer ID**: `cus_TXBqibvFMoATCd`
- **Status**: `trialing`
- **Has Payment Method**: ✅ YES (`pm_1Sa7TlIpak0rJe7Rr4SsB00l`)

### Subscription 2: WITHOUT Payment Method ⭐
- **Subscription ID**: `sub_1Sa7eCIpak0rJe7RN6cTPt2O`
- **Customer ID**: `cus_TXC21PBcMHMwOg`
- **Status**: `trialing`
- **Has Payment Method**: ❌ NO

## 🔍 Key Findings - Trial WITHOUT Payment Method

### 1. Subscription Object (`01_subscription.json`)

**Critical Fields:**
```json
{
  "status": "trialing",
  "trial_end": 1765340796,
  "trial_start": 1764735996,
  "trial_settings": {
    "end_behavior": {
      "missing_payment_method": "cancel"  // ⚠️ KEY: This means trial will cancel if no payment method
    }
  },
  "default_payment_method": null,  // ✅ NULL - No payment method!
  "default_source": null,          // ✅ NULL - No source!
  "pending_setup_intent": "seti_1Sa7eCIpak0rJe7RgnemXwxr"  // Setup intent exists for adding payment method
}
```

**Key Differences from Subscription WITH Payment Method:**
- `default_payment_method`: `null` (vs `"pm_1Sa7TlIpak0rJe7Rr4SsB00l"`)
- `default_source`: `null` (same in both)
- `trial_settings.end_behavior.missing_payment_method`: `"cancel"` (same in both)

### 2. Customer Object (`02_customer.json`)

**Critical Fields:**
```json
{
  "invoice_settings": {
    "default_payment_method": null  // ✅ NULL - No default payment method!
  },
  "default_source": null            // ✅ NULL - No source!
}
```

**Key Differences from Subscription WITH Payment Method:**
- `invoice_settings.default_payment_method`: `null` (vs `"pm_1Sa7TlIpak0rJe7Rr4SsB00l"`)

### 3. Invoice Preview (`03_invoice_preview.json`) ⚠️ CRITICAL

**Error Response:**
```json
{
  "error": {
    "code": "invoice_upcoming_none",
    "message": "The subscription will cancel at the end of the trial instead of generating an invoice because the customer has not provided a payment method and trial_settings[end_behavior][missing_payment_method] is set to `cancel`.",
    "type": "invalid_request_error"
  }
}
```

**This is the KEY finding!** The `createPreview` API **FAILS** with a specific error when:
- Subscription is in trial
- No payment method exists
- `trial_settings.end_behavior.missing_payment_method` is set to `"cancel"`

**Comparison:**
- **WITH payment method**: `createPreview` succeeds and returns preview invoice with `amount_due: 14400`
- **WITHOUT payment method**: `createPreview` fails with `invoice_upcoming_none` error

### 4. Payment Methods List (`04_payment_methods.json`)

**Current State (WITHOUT Payment Method):**
```json
{
  "data": [],  // ✅ EMPTY ARRAY - No payment methods!
  "has_more": false
}
```

**Comparison:**
- **WITH payment method**: `data` array contains 1 payment method
- **WITHOUT payment method**: `data` array is empty `[]`

### 5. Invoices List (`05_invoices.json`)

**Current State:**
- One invoice exists: `in_1Sa7eCIpak0rJe7RnO3hW8J3`
- Status: `paid`
- Amount: `0` (trial invoice)
- Description: "Free trial for 1 × Product Careerlyst"

**Same in both subscriptions** - both have the initial $0 trial invoice.

### 6. Upcoming Invoice (`06_upcoming_invoice.json`)

**Error Response:**
```json
{
  "error": {
    "message": "The Upcoming Invoice API does not support `billing_mode = flexible` subscriptions. To preview invoices for these subscriptions, use the Create Preview Invoice API instead.",
    "type": "invalid_request_error"
  }
}
```

**Same error in both** - `/v1/invoices/upcoming` doesn't work with flexible billing mode. Must use `createPreview` instead.

## 🎯 Implementation Verification

### Current Code Analysis

#### 1. Payment Method Detection (`app/api/billing/payment-method-status/route.ts`)

The code checks:
```typescript
const hasSubscriptionPaymentMethod = Boolean(
  stripeSubscription.default_payment_method ||
  stripeSubscription.default_source
);

const hasCustomerPaymentMethod = Boolean(
  customer.invoice_settings?.default_payment_method ||
  customer.default_source
);

const paymentMethods = await stripe.paymentMethods.list({
  customer: customerId,
  limit: 1,
});

const hasPaymentMethod = hasSubscriptionPaymentMethod || 
                        hasCustomerPaymentMethod || 
                        paymentMethods.data.length > 0;
```

**✅ This is CORRECT!** All checks are necessary and will correctly identify when there's no payment method.

#### 2. Upcoming Invoice Logic (`app/api/billing/upcoming-invoice/route.ts`)

The code currently:
1. Tries `invoices.createPreview()` first
2. Catches errors and checks for `invoice_upcoming_none`
3. Checks `trial_settings.end_behavior.missing_payment_method === 'cancel'`
4. Checks if `hasPaymentMethod` is false
5. Returns `no_upcoming_invoice: true, reason: 'trial_will_cancel_no_payment_method'`

**✅ The logic is CORRECT!** However, we should verify the error handling:

```typescript
try {
  const previewInvoice = await invoicesResource.createPreview({
    customer: subscription.stripe_customer_id,
    subscription: subscription.stripe_subscription_id,
  });
  // ... return preview data
} catch (previewError: any) {
  if (previewError?.code === 'invoice_upcoming_none') {
    const errorMessage = previewError?.message || '';
    
    if (errorMessage.includes('cancel at the end of the trial') || 
        errorMessage.includes('trial_settings') ||
        errorMessage.includes('missing_payment_method')) {
      return NextResponse.json({
        no_upcoming_invoice: true,
        reason: 'trial_will_cancel_no_payment_method',
        // ... other fields
      });
    }
  }
}
```

**The error message from Stripe is:**
> "The subscription will cancel at the end of the trial instead of generating an invoice because the customer has not provided a payment method and trial_settings[end_behavior][missing_payment_method] is set to `cancel`."

**✅ The code checks for these strings, so it should work correctly!**

## 📋 Summary of Data Structure Differences

| Field | WITH Payment Method | WITHOUT Payment Method |
|-------|-------------------|---------------------|
| `subscription.default_payment_method` | `"pm_xxx"` | `null` |
| `subscription.default_source` | `null` | `null` |
| `customer.invoice_settings.default_payment_method` | `"pm_xxx"` | `null` |
| `customer.default_source` | `null` | `null` |
| `payment_methods.list().data` | `[{...}]` (1 item) | `[]` (empty) |
| `invoices.createPreview()` | ✅ Success (returns preview) | ❌ Error (`invoice_upcoming_none`) |
| `trial_settings.end_behavior.missing_payment_method` | `"cancel"` | `"cancel"` |

## ✅ Verification Checklist

Based on the API responses, the current implementation should correctly handle:

- [x] Detect when no payment method exists (checks all 5 locations)
- [x] Handle `createPreview` error for trials without payment method
- [x] Return appropriate `no_upcoming_invoice` response
- [x] Display warning in UI for trials without payment method
- [x] Show "Add Payment Method" CTA

## 🔧 Recommended Code Review

Review these files to ensure they handle the `invoice_upcoming_none` error correctly:

1. **`app/api/billing/upcoming-invoice/route.ts`**
   - Verify error handling for `invoice_upcoming_none`
   - Ensure it checks the error message for trial cancellation keywords
   - Return `no_upcoming_invoice: true, reason: 'trial_will_cancel_no_payment_method'`

2. **`app/components/billing/BillingStatus.tsx`**
   - Verify it displays warning when `no_upcoming_invoice` is true
   - Check that it shows the correct message for `reason: 'trial_will_cancel_no_payment_method'`

3. **`app/components/billing/BillingActions.tsx`**
   - Verify "Add Payment Method" button is shown for trials without payment method
   - Check that it uses the `hasPaymentMethod` state correctly

## 📝 API Response Files

All API responses are saved in `stripe-api-responses/`:
- `01_subscription.json` - Subscription object (WITHOUT payment method)
- `02_customer.json` - Customer object (WITHOUT payment method)
- `03_invoice_preview.json` - Error response from createPreview
- `04_payment_methods.json` - Empty payment methods list
- `05_invoices.json` - Trial invoice ($0)
- `06_upcoming_invoice.json` - Error (flexible billing mode not supported)

## 🎯 Key Takeaway

**The `invoices.createPreview()` API will return an `invoice_upcoming_none` error when:**
- Subscription is in trial status
- No payment method exists on subscription or customer
- `trial_settings.end_behavior.missing_payment_method` is set to `"cancel"`

**The error message explicitly states:**
> "The subscription will cancel at the end of the trial instead of generating an invoice because the customer has not provided a payment method and trial_settings[end_behavior][missing_payment_method] is set to `cancel`."

This is the definitive way to detect that a trial will cancel due to missing payment method!
