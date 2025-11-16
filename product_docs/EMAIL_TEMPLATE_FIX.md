# 🔧 Email Template Configuration Fix

## The Problem

Your confirmation email is linking to Supabase's verification endpoint instead of your app, causing the "No token hash or type" error.

**Current (Wrong) Link:**
```
https://jshyrizjqtvhiwmmraqp.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=http://localhost:3000/auth/confirm
```

**Correct Link Should Be:**
```
http://localhost:3000/auth/confirm?token_hash=...&type=email
```

## ✅ How to Fix

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Confirm Signup Template

Click on **"Confirm signup"** template and replace the entire content with:

```html
<h2>Welcome to Product Careerlyst! 🚀</h2>

<p>Thanks for signing up! We're excited to help you level up your PM career.</p>

<p>Click the button below to confirm your email address and get started:</p>

<p>
  <a 
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;"
  >
    Confirm Your Email →
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="color: #666; font-size: 12px; word-break: break-all;">
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
</p>

<p style="margin-top: 24px; color: #666; font-size: 12px;">
  If you didn't create an account, you can safely ignore this email.
</p>
```

### Step 3: Update Reset Password Template

Click on **"Reset Password"** (or "Magic Link") template and replace with:

```html
<h2>Reset Your Password 🔐</h2>

<p>We received a request to reset your password for your Product Careerlyst account.</p>

<p>Click the button below to set a new password:</p>

<p>
  <a 
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password"
    style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;"
  >
    Reset Password →
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="color: #666; font-size: 12px; word-break: break-all;">
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password
</p>

<p style="margin-top: 24px; color: #666; font-size: 12px;">
  If you didn't request a password reset, you can safely ignore this email.
</p>
<p style="color: #666; font-size: 12px;">
  This link expires in 1 hour.
</p>
```

### Step 4: Update Site URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   - **Local development:** `http://localhost:3000`
   - **Production:** `https://yourdomain.com`

### Step 5: Add Redirect URLs

In the same **URL Configuration** section, add these to **Redirect URLs**:

```
http://localhost:3000/auth/confirm
http://localhost:3000/auth/update-password
http://localhost:3000/protected
```

For production, also add:
```
https://yourdomain.com/auth/confirm
https://yourdomain.com/auth/update-password
https://yourdomain.com/protected
```

### Step 6: Test the Flow

1. **Delete your test user** from Supabase Dashboard → Authentication → Users
2. Go to `http://localhost:3000/auth/sign-up`
3. Sign up with a new email
4. Check your email
5. Click the confirmation link
6. You should be redirected to `/protected` dashboard

## 🎨 Email Template Variables

These variables are available in Supabase email templates:

- `{{ .SiteURL }}` - Your site URL (e.g., `http://localhost:3000`)
- `{{ .TokenHash }}` - The verification token
- `{{ .Email }}` - User's email address
- `{{ .RedirectTo }}` - Optional redirect URL (if provided)
- `{{ .Token }}` - Legacy token (deprecated, use TokenHash)

## 🐛 Still Having Issues?

### Check Email Logs

1. Go to Supabase Dashboard → **Authentication** → **Logs**
2. Look for email sending errors
3. Check if emails are being delivered

### Test Email Template

You can test the template by:
1. Using a real email address (not a disposable one)
2. Check spam/junk folder
3. Make sure SMTP is configured (Supabase provides this by default)

### Common Issues

**"Invalid token"**
- Token expired (they expire after 1 hour)
- Sign up again with a fresh account

**"Email not sent"**
- Check Supabase email rate limits
- Verify your project isn't paused
- Check Authentication → Settings → Email Auth is enabled

**"Redirect not working"**
- Ensure all URLs are added to Redirect URLs list
- Check Site URL matches your actual domain/localhost

## 📝 Important Notes

1. **Token Expiration:** Email tokens expire after 1 hour for security
2. **One-time Use:** Each token can only be used once
3. **Case Sensitive:** URLs are case-sensitive, ensure exact match
4. **HTTPS in Production:** Always use HTTPS in production

## 🚀 After Fixing

Once you've updated the templates:
1. Test with a new sign-up (delete old test users first)
2. The email should now link directly to your app
3. Confirmation should work smoothly
4. User will be redirected to `/protected` dashboard

---

**Need more help?** Check `AUTH_SETUP.md` for complete authentication setup guide.

