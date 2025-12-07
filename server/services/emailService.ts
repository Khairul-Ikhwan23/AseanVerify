import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;
let transportPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransport(): Promise<nodemailer.Transporter> {
  if (cachedTransport) return cachedTransport;
  
  // If we're already creating a transport, wait for it
  if (transportPromise) return transportPromise;

  const hasSmtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

  transportPromise = (async () => {
    if (hasSmtp) {
      console.log('Using SMTP transport:', process.env.SMTP_HOST);
      cachedTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000, // 10 second timeout (increased for Gmail)
        greetingTimeout: 10000,
      });
      return cachedTransport;
    }

    // Dev/test fallback: Ethereal with timeout
    console.log('No SMTP configured, attempting to use Ethereal test email service...');
    try {
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Ethereal account creation timeout')), 5000)
        )
      ]);
      
      cachedTransport = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });
      console.log('Ethereal transport created successfully');
      return cachedTransport;
    } catch (error) {
      console.error('Failed to create email transport:', error);
      // Return a dummy transport that won't actually send
      // This allows signup to continue even if email fails
      cachedTransport = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false },
      } as any);
      return cachedTransport;
    }
  })();

  return transportPromise;
}

export async function sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
  try {
    // Add timeout to transport creation
    const transporter = await Promise.race([
      getTransport(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Email transport timeout')), 8000)
      )
    ]);
    
    const from = process.env.EMAIL_FROM || "no-reply@example.com";
    
    // Add timeout to email sending
    const info = await Promise.race([
      transporter.sendMail({
        from,
        to: email,
        subject: "Verify your email",
        html: `
          <p>Welcome! Please verify your email by clicking the link below:</p>
          <p><a href="${verificationLink}">Verify Email</a></p>
          <p>If you did not create an account, you can ignore this message.</p>
        `,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 8000)
      )
    ]);

    // Log success
    console.log('Verification email sent successfully to:', email);
    
    // Log Ethereal preview URL in dev (if using Ethereal)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Email preview (Ethereal):", previewUrl);
    }
  } catch (error) {
    // Log error but don't throw - email failure shouldn't block signup
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Email sending failed (non-critical):', errorMessage);
    // Don't re-throw - let caller handle gracefully
  }
}

