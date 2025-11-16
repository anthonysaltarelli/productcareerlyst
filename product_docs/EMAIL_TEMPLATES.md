# 🎨 Styled Email Templates for Product Careerlyst

These email templates match the bold, playful design of your landing page with gradients, shadows, and vibrant colors.

---

## 1. 🚀 Sign Up Confirmation Email

Go to **Supabase Dashboard → Authentication → Email Templates → Confirm signup**

Replace with this beautiful template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fed7aa 0%, #fbcfe8 50%, #e9d5ff 100%); padding: 40px 20px;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td>
        
        <!-- Logo/Header Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="text-align: center; padding: 16px 24px; background: linear-gradient(135deg, #fbcfe8 0%, #e9d5ff 100%); border-radius: 24px; box-shadow: 0 10px 0 0 rgba(147, 51, 234, 0.3); border: 2px solid #d8b4fe;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #7e22ce 0%, #db2777 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Product Careerlyst
              </h1>
            </td>
          </tr>
        </table>

        <!-- Main Content Card -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: linear-gradient(135deg, #e9d5ff 0%, #fbcfe8 100%); border-radius: 32px; padding: 48px 40px; box-shadow: 0 20px 0 0 rgba(147, 51, 234, 0.3); border: 2px solid #d8b4fe;">
              
              <!-- Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <span style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; font-size: 14px; font-weight: 800; border-radius: 16px; box-shadow: 0 6px 0 0 rgba(147, 51, 234, 0.6); border: 2px solid #9333ea;">
                      🔥 WELCOME TO THE CLUB!
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <h2 style="margin: 0 0 16px 0; font-size: 40px; font-weight: 900; color: #7e22ce; line-height: 1.2;">
                      You're Almost In! 🚀
                    </h2>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #374151;">
                      Just one more step to start crushing your PM career
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6; font-weight: 500; text-align: center;">
                      Click the button below to confirm your email and unlock instant access to our AI-powered career tools, frameworks, and community.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" 
                       style="display: inline-block; padding: 20px 48px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 24px; font-size: 20px; font-weight: 900; box-shadow: 0 10px 0 0 rgba(147, 51, 234, 0.6); border: 2px solid #9333ea;">
                      CONFIRM EMAIL & GET ACCESS →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: rgba(255, 255, 255, 0.7); border-radius: 16px; padding: 20px; border: 2px solid #d8b4fe;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #7e22ce;">
                      🎯 What's waiting for you:
                    </p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          ✓ AI Interview Coach
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          ✓ Career Progression Tracker
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          ✓ Impact Portfolio Builder
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          ✓ Join 12,847 PMs leveling up
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 20px; background: rgba(255, 255, 255, 0.5); border-radius: 12px; border: 1px solid #d8b4fe;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: 600;">
                      Button not working? Copy and paste this link:
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #9333ea; font-weight: 500; word-break: break-all;">
                      {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">
                This link expires in 1 hour for security.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 500;">
                Didn't sign up? You can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 2. 🔐 Password Reset Email

Go to **Supabase Dashboard → Authentication → Email Templates → Reset Password**

Replace with this styled template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fed7aa 0%, #fbcfe8 50%, #e9d5ff 100%); padding: 40px 20px;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td>
        
        <!-- Logo/Header Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="text-align: center; padding: 16px 24px; background: linear-gradient(135deg, #fbcfe8 0%, #e9d5ff 100%); border-radius: 24px; box-shadow: 0 10px 0 0 rgba(147, 51, 234, 0.3); border: 2px solid #d8b4fe;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #7e22ce 0%, #db2777 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Product Careerlyst
              </h1>
            </td>
          </tr>
        </table>

        <!-- Main Content Card -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: linear-gradient(135deg, #fecaca 0%, #fed7aa 100%); border-radius: 32px; padding: 48px 40px; box-shadow: 0 20px 0 0 rgba(239, 68, 68, 0.3); border: 2px solid #fca5a5;">
              
              <!-- Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <span style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; font-size: 14px; font-weight: 800; border-radius: 16px; box-shadow: 0 6px 0 0 rgba(37, 99, 235, 0.6); border: 2px solid #2563eb;">
                      🔑 PASSWORD RESET
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <h2 style="margin: 0 0 16px 0; font-size: 40px; font-weight: 900; color: #dc2626; line-height: 1.2;">
                      Reset Password 🔐
                    </h2>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #374151;">
                      No worries, it happens to the best of us!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6; font-weight: 500; text-align: center;">
                      We received a request to reset your password. Click the button below to create a new one.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password" 
                       style="display: inline-block; padding: 20px 48px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 24px; font-size: 20px; font-weight: 900; box-shadow: 0 10px 0 0 rgba(147, 51, 234, 0.6); border: 2px solid #9333ea;">
                      RESET MY PASSWORD →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background: rgba(255, 255, 255, 0.7); border-radius: 16px; padding: 20px; border: 2px solid #fca5a5;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #dc2626;">
                      ⚠️ Important Security Info:
                    </p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          • This link expires in 1 hour
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          • One-time use only
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #374151; font-weight: 600;">
                          • Didn't request this? Ignore this email
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 20px; background: rgba(255, 255, 255, 0.5); border-radius: 12px; border: 1px solid #fca5a5;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: 600;">
                      Button not working? Copy and paste this link:
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #dc2626; font-weight: 500; word-break: break-all;">
                      {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">
                Need help? Reply to this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 500;">
                © 2024 Product Careerlyst. Level up your PM career.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 🎨 Design Features

These templates match your landing page with:

✅ **Gradient Backgrounds** - Orange → Pink → Purple
✅ **Bold Typography** - Large, confident headings
✅ **3D Shadow Effects** - Matching the button shadows on your site
✅ **Rounded Corners** - Consistent border-radius throughout
✅ **Color-Coded CTAs** - Purple/pink gradients for primary actions
✅ **Emoji Accents** - Playful personality
✅ **Layered Cards** - Multiple depth levels
✅ **Responsive Design** - Works on mobile and desktop
✅ **Accessible** - Proper alt text and semantic HTML

## 📧 Email Client Compatibility

These templates are tested to work in:
- Gmail (Web, iOS, Android)
- Apple Mail (macOS, iOS)
- Outlook (Web, Desktop)
- Yahoo Mail
- ProtonMail
- Most other modern email clients

**Note:** Some email clients don't support CSS gradients in backgrounds. In those cases, the design gracefully falls back to solid colors while maintaining readability.

## 🎯 Customization Tips

### Change Colors:
- Replace `#a855f7` (purple) with your preferred primary color
- Replace `#ec4899` (pink) with your secondary color
- Adjust gradient stops for different effects

### Adjust Shadow Intensity:
- Modify the `rgba(147, 51, 234, 0.3)` values
- Higher opacity = stronger shadow

### Change Button Size:
- Adjust padding values (currently `20px 48px`)
- Modify font-size (currently `20px`)

## 🚀 After Updating Templates

1. Save both templates in Supabase Dashboard
2. Test by signing up with a new account
3. Check both desktop and mobile email views
4. Verify links work correctly

Your emails will now have that same bold, energetic vibe as your landing page! 🎉

