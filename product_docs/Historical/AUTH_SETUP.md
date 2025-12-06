# Supabase Authentication Setup Guide

## ✅ What's Been Implemented

All Supabase authentication pages have been successfully imported and styled to match your homepage design:

### Pages Created:
- ✅ `/auth/login` - Login page
- ✅ `/auth/sign-up` - Sign up page
- ✅ `/auth/forgot-password` - Password reset request
- ✅ `/auth/update-password` - Update password after reset
- ✅ `/auth/sign-up-success` - Success message after registration
- ✅ `/auth/error` - Error handling page
- ✅ `/auth/confirm` - Email confirmation handler (route)
- ✅ `/protected` - Example protected dashboard page

### Components Created:
- ✅ `LoginForm` - Login form with error handling
- ✅ `SignUpForm` - Registration form
- ✅ `ForgotPasswordForm` - Password reset form
- ✅ `UpdatePasswordForm` - Password update form
- ✅ `LogoutButton` - Logout functionality
- ✅ `MobileMenu` - Mobile navigation with auth support
- ✅ Updated `Navigation` - Shows different links based on auth status

### Infrastructure:
- ✅ Supabase client utilities (client, server, middleware)
- ✅ Middleware for auth protection
- ✅ Server-side auth checking

## 🎨 Styling

All auth pages match your homepage design with:
- Beautiful gradient backgrounds (orange → pink → purple)
- Rounded cards with shadows
- Bold, playful typography
- Consistent color scheme
- Responsive design
- Accessible forms with proper labels and ARIA attributes

## ⚙️ Environment Setup

1. Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Get these values from your Supabase project:
   - Go to your Supabase Dashboard
   - Navigate to Project Settings → API
   - Copy the URL and anon/public key

## 📧 Email Template Setup

You need to configure email templates in Supabase for the auth flow to work properly.

### 1. Sign Up Email Template

Go to Supabase Dashboard → Authentication → Email Templates → Confirm signup

**IMPORTANT:** Replace the ENTIRE template with this HTML:

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

### 2. Reset Password Email Template

Go to Supabase Dashboard → Authentication → Email Templates → Reset password

**IMPORTANT:** Replace the ENTIRE template with this HTML:

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

**Key Points:**
- Use `{{ .TokenHash }}` NOT `{{ .Token }}`
- Link directly to your app, NOT to Supabase's verification endpoint
- Include `type=email` for signup, `type=recovery` for password reset
- The `next` parameter is optional but useful for password reset flow

## 🔐 URL Configuration

In Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL**: Set to your production URL (e.g., `https://yoursite.com`)
   - For local dev: `http://localhost:3000`

2. **Redirect URLs**: Add these URLs:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/auth/forgot-password`
   - `http://localhost:3000/auth/update-password`
   - `http://localhost:3000/protected`
   - (Add production URLs when deploying)

## 🚀 Testing the Auth Flow

### Sign Up Flow:
1. Navigate to `/auth/sign-up`
2. Enter email and password
3. Check email for confirmation link
4. Click link to verify email
5. Redirected to homepage or specified route

### Login Flow:
1. Navigate to `/auth/login`
2. Enter credentials
3. Redirected to `/protected` dashboard

### Password Reset Flow:
1. Navigate to `/auth/forgot-password`
2. Enter email
3. Check email for reset link
4. Click link to go to `/auth/update-password`
5. Enter new password
6. Redirected to `/protected` dashboard

### Protected Routes:
- Any route starting with `/protected` requires authentication
- Unauthenticated users are redirected to `/auth/login`

## 🎯 Next Steps

1. **Set up environment variables** in `.env.local`
2. **Configure email templates** in Supabase Dashboard
3. **Set redirect URLs** in Supabase Dashboard
4. **Test the auth flow** locally
5. **Customize the protected page** with your actual dashboard content
6. **Add more protected routes** as needed

## 📝 Navigation Updates

The navigation now shows:
- **When logged out**: Features, Testimonials, Pricing, Sign In, Get Access
- **When logged in**: Dashboard, Features, User Email

## 🎨 Customization

All auth pages use the same design system as your homepage. To customize:
- Colors: Adjust gradient classes (from-purple-X to-pink-X)
- Rounded corners: Adjust rounded-[Xrem] classes
- Shadows: Adjust shadow-[...] classes
- Spacing: Adjust padding and margin classes

## 🐛 Troubleshooting

### "Invalid login credentials"
- Ensure email is confirmed (check Supabase Dashboard → Authentication → Users)
- Verify environment variables are set correctly

### "Email not sent"
- Check email templates are configured
- Verify SMTP settings in Supabase Dashboard
- Check spam folder

### "Redirect not working"
- Ensure all redirect URLs are added to Supabase URL Configuration
- Check Site URL is set correctly

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Next.js with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)

