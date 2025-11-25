# Google OAuth with Supabase - Setup & Troubleshooting Guide

This document covers the complete setup, common issues, and lessons learned from implementing Google OAuth with Supabase in a Next.js application.

## Table of Contents
- [Overview](#overview)
- [Root Cause of Production Issues](#root-cause-of-production-issues)
- [Required Environment Variables](#required-environment-variables)
- [OAuth Flow Explained](#oauth-flow-explained)
- [Supabase Configuration](#supabase-configuration)
- [Google Cloud Console Configuration](#google-cloud-console-configuration)
- [Cookie Handling in Route Handlers](#cookie-handling-in-route-handlers)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)
- [Debugging Tips](#debugging-tips)

---

## Overview

Google OAuth in this application uses:
- **Supabase Auth** as the OAuth provider handler
- **Next.js Route Handlers** for the callback
- **PKCE flow** for enhanced security

## Root Cause of Production Issues

### 🔴 Critical Issue: Missing `NEXT_PUBLIC_SITE_URL`

**The #1 cause of OAuth failures in production is a missing or incorrect `NEXT_PUBLIC_SITE_URL` environment variable in Vercel.**

#### What Happens Without It:
1. User clicks "Sign in with Google"
2. `GoogleSignInButton` calls `getSiteUrl()` which falls back to `window.location.origin`
3. In some edge cases or during SSR, this can return incorrect values
4. The `redirectTo` URL passed to Supabase becomes malformed
5. Supabase doesn't recognize the redirect URL → falls back to Site URL (homepage)
6. User ends up on homepage instead of `/auth/callback`

#### The Fix:
```bash
# In Vercel Environment Variables
NEXT_PUBLIC_SITE_URL=https://productcareerlyst.com
```

**Always set this explicitly in production - never rely on `window.location.origin`.**

---

## Required Environment Variables

### Vercel Production Environment

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | ✅ **CRITICAL** | `https://productcareerlyst.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `eyJ...` |

### Local Development (.env.local)

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## OAuth Flow Explained

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Google OAuth Flow                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. User clicks "Sign in with Google"
   │
   ▼
2. App calls supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: '${NEXT_PUBLIC_SITE_URL}/auth/callback' }
   })
   │
   ▼
3. Browser redirects to Supabase Auth:
   https://xxx.supabase.co/auth/v1/authorize?provider=google&redirect_to=...
   │
   ▼
4. Supabase redirects to Google:
   https://accounts.google.com/o/oauth2/auth?...
   │
   ▼
5. User authenticates with Google
   │
   ▼
6. Google redirects back to Supabase:
   https://xxx.supabase.co/auth/v1/callback?code=...
   │
   ▼
7. Supabase exchanges code, creates session, redirects to YOUR app:
   https://productcareerlyst.com/auth/callback?code=...
   │
   ▼
8. Your /auth/callback route:
   - Exchanges code for session tokens
   - Sets auth cookies on response
   - Redirects to /onboarding or /dashboard
```

---

## Supabase Configuration

### Authentication → URL Configuration

#### Site URL
```
https://productcareerlyst.com
```
- This is the **default fallback** redirect URL
- Used when no redirect URL is specified or doesn't match allow list
- **Cannot use wildcards**

#### Redirect URLs (Allow List)
```
http://localhost:3000/auth/callback
https://productcareerlyst.com/auth/callback
```
- These are the ONLY URLs Supabase will redirect to
- If the `redirectTo` doesn't match, Supabase uses Site URL instead
- **Wildcards ARE allowed** (e.g., `https://productcareerlyst.com/**`)

### Authentication → Providers → Google

1. Enable Google provider
2. Add Client ID from Google Cloud Console
3. Add Client Secret from Google Cloud Console

---

## Google Cloud Console Configuration

### APIs & Services → Credentials → OAuth 2.0 Client IDs

#### Authorized JavaScript Origins
```
https://productcareerlyst.com
http://localhost:3000
```

#### Authorized Redirect URIs
```
https://xxx.supabase.co/auth/v1/callback
```
⚠️ **Important**: This is your SUPABASE project URL, NOT your app URL!

### OAuth Consent Screen
- App name: Product Careerlyst
- User support email: your-email@example.com
- Authorized domains: `productcareerlyst.com`, `supabase.co`

---

## Cookie Handling in Route Handlers

### The Problem
In Next.js Route Handlers, cookies set via `cookieStore.set()` are NOT automatically attached to redirect responses. This causes auth to fail silently.

### The Solution
We explicitly track and transfer cookies to the redirect response:

```typescript
// Track cookies that Supabase sets
const cookiesToSet: { name: string; value: string; options: any }[] = []

const supabase = createServerClient(URL, KEY, {
  cookies: {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookies) {
      // Store cookies for later
      cookies.forEach((cookie) => {
        cookiesToSet.push(cookie)
      })
    },
  },
})

// After auth operations, explicitly set cookies on response
const response = NextResponse.redirect(redirectTo)
cookiesToSet.forEach(({ name, value, options }) => {
  response.cookies.set(name, value, options)
})
return response
```

### Why This Matters
- `cookieStore.set()` modifies the server's internal cookie store
- `NextResponse.redirect()` creates a NEW response without those cookies
- Cookies must be explicitly copied to the redirect response
- Without this, the browser never receives the auth tokens

---

## Common Issues & Troubleshooting

### Issue: User redirected to homepage instead of callback

**Symptoms:**
- Click "Sign in with Google"
- End up on homepage (not `/auth/callback`)
- Second attempt sometimes works

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Missing `NEXT_PUBLIC_SITE_URL` | Set in Vercel environment variables |
| Callback URL not in Supabase allow list | Add to Redirect URLs in Supabase |
| Wrong redirect URI in Google Console | Use Supabase URL, not app URL |

### Issue: User authenticated but sent to wrong page

**Symptoms:**
- OAuth completes successfully
- User goes to dashboard instead of onboarding
- Or user goes to login page

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Cookies not attached to redirect | Use explicit cookie transfer pattern |
| Onboarding check failing silently | Check Vercel logs for errors |
| Middleware not seeing user | Ensure cookies are set before redirect |

### Issue: "Invalid redirect URI" error

**Symptoms:**
- Google shows error about redirect URI

**Solution:**
- In Google Cloud Console, add: `https://xxx.supabase.co/auth/v1/callback`
- NOT your app's callback URL

### Issue: Works locally, fails in production

**Symptoms:**
- Everything works on localhost
- Fails silently in production

**Checklist:**
1. ✅ `NEXT_PUBLIC_SITE_URL` set in Vercel
2. ✅ Production callback URL in Supabase Redirect URLs
3. ✅ Production domain in Google Console authorized origins
4. ✅ Supabase callback URL in Google Console redirect URIs

---

## Debugging Tips

### 1. Check Vercel Function Logs

After attempting sign-in, check Vercel logs for:
```
[OAuth Callback] Request received: { hasCode: true, ... }
[OAuth Callback] Exchange result: { hasUser: true, ... }
[OAuth Callback] Final redirect to /onboarding with 2 cookies set
```

### 2. Verify Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:
- Ensure `NEXT_PUBLIC_SITE_URL` is set
- Check it doesn't have a trailing slash
- Verify it matches your actual domain exactly

### 3. Test the OAuth URL

When clicking "Sign in with Google", check the browser's network tab:
- The request to Supabase should include `redirect_to=https://productcareerlyst.com/auth/callback`
- If it shows `localhost` or wrong URL, `NEXT_PUBLIC_SITE_URL` is wrong

### 4. Check Supabase Logs

In Supabase Dashboard → Logs → Auth:
- Look for OAuth callback attempts
- Check for redirect URL mismatch errors

---

## Files Involved

| File | Purpose |
|------|---------|
| `app/auth/callback/route.ts` | Handles OAuth callback, exchanges code for session |
| `app/components/GoogleSignInButton.tsx` | Initiates OAuth flow |
| `lib/utils/site-url.ts` | Returns site URL for redirects |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/supabase/middleware.ts` | Session refresh middleware |

---

## Key Lessons Learned

1. **Always set `NEXT_PUBLIC_SITE_URL` explicitly in production** - This was the root cause of our issues.

2. **Cookies must be explicitly transferred to redirect responses** in Route Handlers - they don't transfer automatically.

3. **The Google Console redirect URI should be Supabase's URL**, not your app's callback URL.

4. **Test in production-like environment** - OAuth behaves differently locally vs production due to cookies, HTTPS, and environment variables.

5. **Add comprehensive logging** to OAuth callbacks - silent failures are common and hard to debug without logs.

6. **Protect the onboarding route** in middleware - unauthenticated users shouldn't be able to access it.

---

## Quick Reference

### Minimum Vercel Environment Variables
```
NEXT_PUBLIC_SITE_URL=https://productcareerlyst.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Supabase Redirect URLs
```
http://localhost:3000/auth/callback
https://productcareerlyst.com/auth/callback
```

### Google Console Redirect URI
```
https://xxx.supabase.co/auth/v1/callback
```

---

*Last updated: November 2025*

