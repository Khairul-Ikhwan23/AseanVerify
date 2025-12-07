import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;

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
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create a fresh transport for each attempt (in case connection was closed)
      if (attempt > 1) {
        cachedTransport = null; // Force recreation
        console.log(`[Email Service] Retry attempt ${attempt}/${maxRetries}`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const transporter = await getTransport();
      const from = process.env.EMAIL_FROM || "no-reply@example.com";
      
      console.log(`[Email Service] Attempting to send verification email to: ${email}`);
      console.log(`[Email Service] Using transport: ${process.env.SMTP_HOST ? 'SMTP' : 'Ethereal (test)'}`);
      console.log(`[Email Service] SMTP Config: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
      
      const info = await transporter.sendMail({
        from,
        to: email,
        subject: "Verify your email",
        html: `
          <p>Welcome! Please verify your email by clicking the link below:</p>
          <p><a href="${verificationLink}">Verify Email</a></p>
          <p>If you did not create an account, you can ignore this message.</p>
        `,
      });

      // Log Ethereal preview URL in dev (test emails)
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("═══════════════════════════════════════════════════════════");
        console.log("📧 EMAIL SENT (Ethereal Test Account)");
        console.log("⚠️  This is a TEST email - it was NOT actually sent!");
        console.log("🔗 Preview URL:", previewUrl);
        console.log("💡 To send real emails, configure SMTP in environment variables");
        console.log("═══════════════════════════════════════════════════════════");
      } else {
        console.log(`[Email Service] ✅ Email sent successfully to ${email}`);
        console.log(`[Email Service] Message ID: ${info.messageId}`);
      }
      
      // Success - exit retry loop
      return;
    } catch (error: any) {
      lastError = error;
      console.error(`[Email Service] ❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
      console.error("[Email Service] Error details:", {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port,
      });
      
      // If it's a timeout or connection error, retry
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        if (attempt < maxRetries) {
          console.log(`[Email Service] Will retry... (${maxRetries - attempt} attempts remaining)`);
          continue;
        }
      } else {
        // For other errors (auth, etc.), don't retry
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
    }
  }
  
  // All retries exhausted
  throw new Error(`Failed to send verification email after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

