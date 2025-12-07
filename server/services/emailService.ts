import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;

async function getTransport(): Promise<nodemailer.Transporter> {
  if (cachedTransport) return cachedTransport;

  const hasSmtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

  if (hasSmtp) {
    cachedTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
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
  try {
    const transporter = await getTransport();
    const from = process.env.EMAIL_FROM || "no-reply@example.com";
    
    console.log(`[Email Service] Attempting to send verification email to: ${email}`);
    console.log(`[Email Service] Using transport: ${process.env.SMTP_HOST ? 'SMTP' : 'Ethereal (test)'}`);
    
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
  } catch (error: any) {
    console.error("[Email Service] ❌ Failed to send email:", error);
    console.error("[Email Service] Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    // Re-throw so the caller knows email failed
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

