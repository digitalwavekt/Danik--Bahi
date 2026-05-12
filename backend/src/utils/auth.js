import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES_DAYS = 30;

// Generate short-lived access token
export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id || user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_EXPIRES,
      algorithm: 'HS256',
    }
  );
}

// Generate opaque refresh token
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Hash refresh token for DB storage
export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    return null;
  }
}

// Refresh token expiry date
export function refreshTokenExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_EXPIRES_DAYS);
  return d;
}

// Hash password
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

// Compare password
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}