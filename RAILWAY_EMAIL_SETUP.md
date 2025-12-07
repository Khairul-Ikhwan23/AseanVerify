# 📧 Free Email Setup for Railway

Since Railway blocks outbound SMTP connections, you need to use **API-based email providers**. Here are the best **free** options:

## 🏆 Recommended: Resend (Best for Railway)

**Free Tier:** 3,000 emails/month, 100 emails/day

### Setup Steps:

1. **Sign up**: https://resend.com/signup
2. **Get API Key**: 
   - Go to **API Keys** in dashboard
   - Click **Create API Key**
   - Copy the key (starts with `re_`)
3. **Add to Railway**:
   - Go to Railway Dashboard → Your Project → **Variables**
   - Add these variables:

| Variable Name | Value |
|--------------|-------|
| `RESEND_API_KEY` | `re_your_api_key_here` |
| `EMAIL_FROM` | `onboarding@resend.dev` (or your verified domain) |

4. **Deploy** - Railway will auto-redeploy

✅ **Done!** Emails will now work on Railway.

---

## Option 2: Brevo (formerly Sendinblue)

**Free Tier:** 300 emails/day (9,000/month)

### Setup Steps:

1. **Sign up**: https://www.brevo.com/
2. **Get API Key**:
   - Go to **SMTP & API** → **API Keys**
   - Click **Generate a new API key**
   - Copy the key
3. **Add to Railway**:

| Variable Name | Value |
|--------------|-------|
| `BREVO_API_KEY` | `your_brevo_api_key` |
| `EMAIL_FROM` | `noreply@yourdomain.com` |

---

## Option 3: SendGrid

**Free Tier:** 100 emails/day (3,000/month)

### Setup Steps:

1. **Sign up**: https://signup.sendgrid.com/
2. **Get API Key**:
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Select **Full Access** or **Restricted Access** (with Mail Send permission)
   - Copy the key (starts with `SG.`)
3. **Add to Railway**:

| Variable Name | Value |
|--------------|-------|
| `SENDGRID_API_KEY` | `SG.your_api_key_here` |
| `EMAIL_FROM` | `noreply@example.com` |

---

## Option 4: Mailgun

**Free Tier:** 5,000 emails/month (first 3 months), then 1,000/month

**Note:** Requires domain verification (more setup)

### Setup Steps:

1. **Sign up**: https://www.mailgun.com/
2. **Verify Domain**:
   - Go to **Sending** → **Domains**
   - Add your domain or use sandbox domain for testing
3. **Get API Key**:
   - Go to **Sending** → **Domain Settings** → **API Keys**
   - Copy the Private API key
4. **Add to Railway**:

| Variable Name | Value |
|--------------|-------|
| `MAILGUN_API_KEY` | `your_mailgun_api_key` |
| `MAILGUN_DOMAIN` | `your-domain.com` or `sandbox123.mailgun.org` |
| `EMAIL_FROM` | `noreply@your-domain.com` |

---

## 🎯 Quick Comparison

| Provider | Free Tier | Ease of Setup | Best For |
|----------|-----------|---------------|----------|
| **Resend** | 3,000/month | ⭐⭐⭐⭐⭐ Easiest | Railway deployments |
| **Brevo** | 9,000/month | ⭐⭐⭐⭐ Easy | High volume |
| **SendGrid** | 3,000/month | ⭐⭐⭐ Medium | Established provider |
| **Mailgun** | 1,000/month* | ⭐⭐ Complex | Custom domains |

*After first 3 months

---

## 🔧 How It Works

The email service automatically tries providers in this order:
1. **Resend** (if `RESEND_API_KEY` is set)
2. **Brevo** (if `BREVO_API_KEY` is set)
3. **SendGrid** (if `SENDGRID_API_KEY` is set)
4. **Mailgun** (if `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set)
5. **SMTP** (for localhost only - won't work on Railway)
6. **Ethereal** (test emails - fallback)

**You only need to configure ONE provider!** The first one found will be used.

---

## ✅ Testing

After adding the environment variables:

1. **Redeploy** on Railway (automatic when you add variables)
2. **Register a new account** or use resend verification
3. **Check your email inbox** - you should receive the verification email!

---

## 🐛 Troubleshooting

### "No email provider configured"
- Make sure you added the API key variable to Railway
- Check the variable name is exactly correct (case-sensitive)
- Redeploy after adding variables

### "API error: Unauthorized"
- Check your API key is correct
- For SendGrid: Make sure API key has "Mail Send" permission
- For Mailgun: Verify your domain is verified

### "Email not received"
- Check spam folder
- Verify `EMAIL_FROM` is set correctly
- Check Railway logs for error messages

---

## 💡 Recommendation

**For Railway, use Resend** - it's the easiest to set up and works perfectly with Railway's infrastructure. The 3,000 emails/month free tier is plenty for most applications.

