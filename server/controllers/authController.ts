import { z } from "zod";
import { storage } from "../storage";
import { signupSchema, loginSchema } from "@shared/schema";
import { generateRawToken, hashToken, computeExpiry } from "../services/tokenService";
import { sendVerificationEmail } from "../services/emailService";

export const signup = async (req: any, res: any) => {
  try {
    const userData = signupSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user with verified=false
    const user = await storage.createUser({ ...userData, verified: false } as any);

    // Create verification token
    const raw = generateRawToken(32);
    const tokenHash = hashToken(raw);
    const expiresAt = computeExpiry(24);
    await storage.createEmailVerificationToken(user.id, tokenHash, expiresAt);

    const apiBase = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const link = `${apiBase}/api/auth/verify?token=${raw}`;
    
    try {
      await sendVerificationEmail(user.email, link);
    } catch (emailError: any) {
      console.error('[Signup] Email sending failed:', emailError);
      // Account is created, but email failed - still return success but log the error
      // In production, you might want to queue this for retry
    }

    return res.json({ message: "Account created. Please verify your email.", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('[Signup] Error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid user data", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create account" });
  }
};

export const login = async (req: any, res: any) => {
  try {
    const loginData = loginSchema.parse(req.body);
    const user = await storage.getUserByEmail(loginData.email);
    if (!user || user.password !== loginData.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.verified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }
    return res.json({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
  } catch (error) {
    return res.status(400).json({ message: "Invalid login data" });
  }
};

export const verifyEmail = async (req: any, res: any) => {
  try {
    const raw = (req.query.token || "").toString();
    if (!raw) {
      return res
        .status(400)
        .send(`<!doctype html><html><body><h1>Verification error</h1><p>Missing token.</p></body></html>`);
    }
    const tokenHash = hashToken(raw);
    const token = await storage.getEmailVerificationTokenByHash(tokenHash);
    if (!token) {
      return res
        .status(400)
        .send(`<!doctype html><html><body><h1>Verification error</h1><p>Invalid or expired token.</p></body></html>`);
    }
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      await storage.deleteEmailVerificationToken(token.id);
      return res
        .status(400)
        .send(`<!doctype html><html><body><h1>Verification expired</h1><p>Your token has expired.</p></body></html>`);
    }
    await storage.updateUserVerification(token.userId, true);
    await storage.deleteEmailVerificationToken(token.id);
    const loginUrl = `${process.env.APP_BASE_URL || "http://localhost:5173"}/login`;
    return res
      .status(200)
      .send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Email verified</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #0f172a; }
      .card { max-width: 520px; margin: 10% auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .title { font-size: 22px; margin: 0 0 8px; }
      .desc { color: #475569; margin: 0 0 16px; }
      .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="title">Your email has been verified</h1>
      <p class="desc">You can now log in with your account.</p>
      <a class="btn" href="${loginUrl}">Go to Login</a>
    </div>
  </body>
</html>`);
  } catch (error) {
    return res
      .status(500)
      .send(`<!doctype html><html><body><h1>Verification failed</h1><p>Unexpected error.</p></body></html>`);
  }
};

export const resendVerification = async (req: any, res: any) => {
  try {
    const email = (req.body?.email || "").toString();
    if (!email) return res.status(200).json({ message: "If the account exists, a verification email will be sent." });
    const user = await storage.getUserByEmail(email);
    if (!user || user.verified) {
      return res.status(200).json({ message: "If the account exists, a verification email will be sent." });
    }
    // Issue new token (do not disclose account state)
    const raw = generateRawToken(32);
    const tokenHash = hashToken(raw);
    const expiresAt = computeExpiry(24);
    await storage.createEmailVerificationToken(user.id, tokenHash, expiresAt);
    const apiBase = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const link = `${apiBase}/api/auth/verify?token=${raw}`;
    await sendVerificationEmail(user.email, link);
    return res.status(200).json({ message: "If the account exists, a verification email will be sent." });
  } catch {
    return res.status(200).json({ message: "If the account exists, a verification email will be sent." });
  }
};