# 📧 Email Setup Guide - Nodemailer Configuration

Complete guide to set up real email sending with nodemailer (instead of test emails).

## 🎯 Quick Setup (Gmail - Recommended for Testing)

### Step 1: Enable Gmail App Password

1. **Go to Google Account**: https://myaccount.google.com
2. **Security** → **2-Step Verification** → Enable it
3. **Go to App Passwords**: https://myaccount.google.com/apppasswords
4. **Create App Password**:
   - Select App: **Mail**
   - Select Device: **Other (Custom name)** → Type: "MSME Passport"
   - Click **Generate**
5. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Add to Local .env File

Edit your `.env` file in the project root:

```env
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=your-email@gmail.com
```

**Important**: 
- Remove spaces from the app password
- Use the full email as `SMTP_USER`
- Use the 16-char password (no spaces) as `SMTP_PASS`

### Step 3: Add to Railway (Production)

1. Go to **Railway Dashboard** → Your Project
2. Click **Variables** tab
3. Click **+ New Variable** for each:

| Variable Name | Value |
|--------------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-16-char-app-password` |
| `EMAIL_FROM` | `your-email@gmail.com` |

4. Click **Save** (Railway will auto-redeploy)

### Step 4: Test It

1. **Restart your server** (if running locally)
2. **Register a new account**
3. **Check your email inbox** - you should receive the verification email!

---

## 📋 Alternative Email Providers

### Option 2: SendGrid (Free: 100 emails/day)

**Setup:**
1. Sign up: https://sendgrid.com
2. Verify your email
3. Create API Key: **Settings** → **API Keys** → **Create API Key**
4. Copy the API key

**Environment Variables:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourdomain.com
```

---

### Option 3: Mailgun (Free: 5,000 emails/month)

**Setup:**
1. Sign up: https://www.mailgun.com
2. Verify domain (or use sandbox for testing)
3. Get credentials: **Sending** → **Domain Settings** → **SMTP credentials**

**Environment Variables:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

---

### Option 4: Outlook/Hotmail

**Setup:**
1. Go to: https://account.microsoft.com/security
2. Enable 2FA
3. Create app password (similar to Gmail)

**Environment Variables:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@outlook.com
```

---

## 🔍 How to Verify It's Working

### Check Server Logs

When you register, you should see in console:

**If SMTP is configured:**
```
[Email Service] Attempting to send verification email to: user@example.com
[Email Service] Using transport: SMTP
[Email Service] ✅ Email sent successfully to user@example.com
[Email Service] Message ID: <message-id>
```

**If using test emails (no SMTP):**
```
[Email Service] Attempting to send verification email to: user@example.com
[Email Service] Using transport: Ethereal (test)
═══════════════════════════════════════════════════════════
📧 EMAIL SENT (Ethereal Test Account)
⚠️  This is a TEST email - it was NOT actually sent!
🔗 Preview URL: https://ethereal.email/message/...
```

### Test Email Endpoint (Development Only)

If `NODE_ENV=development`, you can test email:

```bash
curl -X POST http://localhost:5000/api/dev/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@gmail.com"}'
```

Check console for preview URL or check your inbox.

---

## 🐛 Troubleshooting

### Gmail Issues

**Error: "Invalid login" or "Authentication failed"**
- Make sure you're using an **App Password**, not your regular password
- Remove spaces from the app password
- Verify 2FA is enabled

**Error: "Less secure app access"**
- Gmail doesn't support "less secure apps" anymore
- You MUST use App Passwords (not regular password)

**Emails going to spam:**
- Normal for new senders
- Add `EMAIL_FROM` to match your Gmail address
- Consider using a custom domain for production

### SendGrid Issues

**Error: "Authentication failed"**
- Make sure `SMTP_USER` is exactly `apikey` (lowercase)
- Verify your API key starts with `SG.`
- Check API key has "Mail Send" permissions

### General Issues

**Emails not sending:**
1. Check all environment variables are set
2. Check server logs for errors
3. Verify SMTP credentials are correct
4. Test with the test endpoint

**"Using Ethereal" message:**
- Means SMTP is not configured
- Check environment variables are loaded
- Restart server after adding variables

---

## 📝 Environment Variables Reference

### Required for Real Emails:
```env
SMTP_HOST=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                  # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # SMTP username (usually your email)
SMTP_PASS=your-password           # SMTP password (app password for Gmail)
EMAIL_FROM=noreply@example.com    # From address (what users see)
```

### Optional:
```env
SMTP_PORT=587                     # Defaults to 587 if not set
SMTP_SECURE=false                 # Defaults to false if not set
```

---

## ✅ Quick Checklist

- [ ] SMTP provider account created (Gmail/SendGrid/etc.)
- [ ] App password/API key generated
- [ ] Environment variables added to `.env` (local)
- [ ] Environment variables added to Railway (production)
- [ ] Server restarted
- [ ] Test registration - check inbox
- [ ] Check server logs for email status

---

## 🎉 You're Done!

Once configured, your app will send real verification emails instead of test emails. Users will receive emails in their inbox!

**Next Steps:**
- Test with a real email address
- Check spam folder if email doesn't arrive
- Consider setting up a custom domain email for production

