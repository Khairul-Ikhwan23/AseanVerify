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
  const transporter = await getTransport();
  const from = process.env.EMAIL_FROM || "no-reply@example.com";
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

  // Log Ethereal preview URL in dev
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Email preview:", previewUrl);
  }
}

