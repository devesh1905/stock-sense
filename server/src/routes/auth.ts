import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateToken, generateResetToken, verifyResetToken } from '../lib/jwt.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { sendOtpEmail } from '../lib/mailer.js';

const router = Router();

// Validation Schemas
const signupSchema = z.object({
  loginId: z
    .string()
    .min(6, 'Login ID must be at least 6 characters')
    .max(12, 'Login ID must be at most 12 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Login ID can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z
    .string()
    .min(9, 'Password must be more than 8 characters')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must include at least one special character')
});

const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Login ID or Email is required')
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(1, 'Login ID or Email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(9, 'Password must be more than 8 characters')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must include at least one special character')
});

// Cookie helper
const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);

  // Check loginId uniqueness
  const existingLoginId = await prisma.user.findUnique({
    where: { loginId: data.loginId }
  });
  if (existingLoginId) {
    res.status(409).json({ error: 'Login ID is already taken' });
    return;
  }

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email }
  });
  if (existingEmail) {
    res.status(409).json({ error: 'Email ID is already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      loginId: data.loginId,
      email: data.email,
      name: data.name,
      passwordHash,
      role: 'STAFF'
    },
    select: {
      id: true,
      loginId: true,
      email: true,
      name: true,
      role: true
    }
  });

  const token = generateToken({
    id: user.id,
    loginId: user.loginId,
    role: user.role
  });

  setAuthCookie(res, token);
  res.status(201).json({ ok: true, user });
});

/**
 * POST /api/auth/login
 * Note: Must return exact message "Invalid Login Id or Password" on mismatch (MOCKUP-SPEC)
 */
router.post('/login', async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { loginId: data.loginId }
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid Login Id or Password' });
    return;
  }

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid Login Id or Password' });
    return;
  }

  const token = generateToken({
    id: user.id,
    loginId: user.loginId,
    role: user.role
  });

  setAuthCookie(res, token);
  res.json({
    ok: true,
    user: {
      id: user.id,
      loginId: user.loginId,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ ok: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ ok: true, user: req.user });
});

/**
 * POST /api/auth/forgot-password
 * Generates 6-digit OTP, hashes it, stores with 10-min expiry, dispatches email
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { identifier } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ loginId: identifier }, { email: identifier }]
    }
  });

  if (!user) {
    // Return friendly generic response to avoid account enumeration
    res.json({
      ok: true,
      message: 'If an account exists with that Login ID or Email, an OTP has been sent.'
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.passwordResetOtp.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt,
      attempts: 0
    }
  });

  await sendOtpEmail(user.email, otp);

  // Mask email for display: a***@example.com
  const [localPart, domain] = user.email.split('@');
  const maskedEmail =
    localPart.length > 2
      ? `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`
      : `***@${domain}`;

  res.json({
    ok: true,
    message: `OTP has been sent to ${maskedEmail}`,
    email: maskedEmail
  });
});

/**
 * POST /api/auth/verify-otp
 * Verifies 6-digit OTP and returns temporary resetToken
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { identifier, otp } = verifyOtpSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ loginId: identifier }, { email: identifier }]
    }
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid reset request' });
    return;
  }

  // Find latest unused OTP
  const activeOtp = await prisma.passwordResetOtp.findFirst({
    where: {
      userId: user.id,
      usedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!activeOtp) {
    res.status(400).json({ error: 'No active OTP found. Please request a new one.' });
    return;
  }

  if (new Date() > activeOtp.expiresAt) {
    res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    return;
  }

  if (activeOtp.attempts >= 5) {
    res.status(400).json({ error: 'Maximum attempts exceeded (5). Please request a new OTP.' });
    return;
  }

  // Increment attempts
  await prisma.passwordResetOtp.update({
    where: { id: activeOtp.id },
    data: { attempts: { increment: 1 } }
  });

  const isValid = await bcrypt.compare(otp, activeOtp.codeHash);
  if (!isValid) {
    const remaining = 4 - activeOtp.attempts;
    res.status(400).json({
      error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}`
    });
    return;
  }

  const resetToken = generateResetToken({
    userId: user.id,
    otpId: activeOtp.id
  });

  res.json({
    ok: true,
    message: 'OTP verified successfully',
    resetToken
  });
});

/**
 * POST /api/auth/reset-password
 * Consumes resetToken and sets new password
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { resetToken, newPassword } = resetPasswordSchema.parse(req.body);

  let payload;
  try {
    payload = verifyResetToken(resetToken);
  } catch {
    res.status(400).json({ error: 'Invalid or expired reset session. Please request a new OTP.' });
    return;
  }

  const otpRecord = await prisma.passwordResetOtp.findUnique({
    where: { id: payload.otpId }
  });

  if (!otpRecord || otpRecord.usedAt) {
    res.status(400).json({ error: 'This reset code has already been used.' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and mark OTP as used in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetOtp.update({
      where: { id: payload.otpId },
      data: { usedAt: new Date() }
    })
  ]);

  res.json({
    ok: true,
    message: 'Password reset successfully. You can now sign in with your new password.'
  });
});

export default router;
