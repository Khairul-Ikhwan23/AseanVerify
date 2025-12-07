import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;

// API-based email providers (for Railway - no SMTP needed)
async function sendViaResend(email: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Resend API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  console.log(`[Email Service] ✅ Email sent via Resend. ID: ${data.id}`);
}

async function sendViaSendGrid(email: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not configured");

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.EMAIL_FROM || "noreply@example.com" },
      subject: subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error || response.statusText}`);
  }

  console.log(`[Email Service] ✅ Email sent via SendGrid`);
}

async function sendViaMailgun(email: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) throw new Error("MAILGUN_API_KEY and MAILGUN_DOMAIN must be configured");

  const formData = new URLSearchParams();
  formData.append("from", process.env.EMAIL_FROM || `noreply@${domain}`);
  formData.append("to", email);
  formData.append("subject", subject);
  formData.append("html", html);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Mailgun API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  console.log(`[Email Service] ✅ Email sent via Mailgun. ID: ${data.id}`);
}

async function sendViaBrevo(email: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM || "noreply@example.com" },
      to: [{ email }],
      subject: subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Brevo API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  console.log(`[Email Service] ✅ Email sent via Brevo. Message ID: ${data.messageId}`);
}

async function getTransport(): Promise<nodemailer.Transporter> {
  if (cachedTransport) return cachedTransport;

  const hasSmtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

  if (hasSmtp) {
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const isSecure = process.env.SMTP_SECURE === "true";
    
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Connection timeout settings for Railway/production environments
      connectionTimeout: 60000, // 60 seconds (default is 2 seconds, too short for Railway)
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Retry settings
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      // TLS/SSL options
      tls: {
        // Don't fail on invalid certificates (some SMTP servers have self-signed certs)
        rejectUnauthorized: false,
        // Allow legacy TLS versions if needed
        minVersion: 'TLSv1',
      },
      // For non-secure connections, upgrade to TLS
      requireTLS: !isSecure && port === 587,
    });
    
    // Verify connection on startup (optional, but helps catch issues early)
    try {
      await cachedTransport.verify();
      console.log('[Email Service] ✅ SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.warn('[Email Service] ⚠️ SMTP verification failed (will retry on send):', verifyError.message);
      // Don't fail here - connection might work on actual send
    }
    
    return cachedTransport;
  }

  // Dev/test fallback: Ethereal
  const testAccount = await nodemailer.createTestAccount();
  cachedTransport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return cachedTransport;
}

export async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
  const subject = "Verify your email";
  const html = `
    <p>Welcome! Please verify your email by clicking the link below:</p>
    <p><a href="${verificationLink}">Verify Email</a></p>
    <p>If you did not create an account, you can ignore this message.</p>
  `;

  console.log(`[Email Service] Attempting to send verification email to: ${email}`);

  // Priority order: API providers first (for Railway), then SMTP (for localhost), then Ethereal (fallback)
  
  // 1. Try Resend (recommended for Railway - 3,000 emails/month free)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Email Service] Using transport: Resend API`);
      await sendViaResend(email, subject, html);
      return;
    } catch (error: any) {
      console.error(`[Email Service] Resend failed:`, error.message);
      // Fall through to next provider
    }
  }

  // 2. Try Brevo (300 emails/day free)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`[Email Service] Using transport: Brevo API`);
      await sendViaBrevo(email, subject, html);
      return;
    } catch (error: any) {
      console.error(`[Email Service] Brevo failed:`, error.message);
      // Fall through to next provider
    }
  }

  // 3. Try SendGrid (100 emails/day free)
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`[Email Service] Using transport: SendGrid API`);
      await sendViaSendGrid(email, subject, html);
      return;
    } catch (error: any) {
      console.error(`[Email Service] SendGrid failed:`, error.message);
      // Fall through to next provider
    }
  }

  // 4. Try Mailgun (5,000 emails/month free, requires domain)
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    try {
      console.log(`[Email Service] Using transport: Mailgun API`);
      await sendViaMailgun(email, subject, html);
      return;
    } catch (error: any) {
      console.error(`[Email Service] Mailgun failed:`, error.message);
      // Fall through to SMTP
    }
  }

  // 5. Try SMTP (for localhost - won't work on Railway)
  const hasSmtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
  if (hasSmtp) {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          cachedTransport = null;
          console.log(`[Email Service] SMTP retry attempt ${attempt}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        const transporter = await getTransport();
        const from = process.env.EMAIL_FROM || "no-reply@example.com";
        
        console.log(`[Email Service] Using transport: SMTP`);
        console.log(`[Email Service] SMTP Config: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
        
        const info = await transporter.sendMail({
          from,
          to: email,
          subject: subject,
          html: html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("═══════════════════════════════════════════════════════════");
          console.log("📧 EMAIL SENT (Ethereal Test Account)");
          console.log("⚠️  This is a TEST email - it was NOT actually sent!");
          console.log("🔗 Preview URL:", previewUrl);
          console.log("═══════════════════════════════════════════════════════════");
        } else {
          console.log(`[Email Service] ✅ Email sent successfully via SMTP`);
          console.log(`[Email Service] Message ID: ${info.messageId}`);
        }
        
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`[Email Service] ❌ SMTP attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
          if (attempt < maxRetries) {
            continue;
          }
        } else {
          throw new Error(`Failed to send verification email: ${error.message}`);
        }
      }
    }
    
    throw new Error(`Failed to send verification email after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // 6. Fallback to Ethereal (test emails)
  try {
    console.log(`[Email Service] Using transport: Ethereal (test - no email provider configured)`);
    const transporter = await getTransport();
    const info = await transporter.sendMail({
      from: "test@ethereal.email",
      to: email,
      subject: subject,
      html: html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("📧 EMAIL SENT (Ethereal Test Account)");
      console.log("⚠️  This is a TEST email - it was NOT actually sent!");
      console.log("🔗 Preview URL:", previewUrl);
      console.log("💡 Configure an email provider (Resend/Brevo/SendGrid/Mailgun) for production");
      console.log("═══════════════════════════════════════════════════════════");
    }
  } catch (error: any) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

