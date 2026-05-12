import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/auth.js';
import User from '../models/User.js';
import UserSocietyAccess from '../models/UserSocietyAccess.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization header' });

  const payload = verifyAccessToken(authHeader.slice(7));
  if (!payload) return res.status(401).json({ error: 'Access token expired or invalid' });

  const user = await User.findById(payload.sub).select('email role name is_active');
  if (!user || !user.is_active) return res.status(401).json({ error: 'Account not found or deactivated' });

  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

export async function requireSocietyAccess(req, res, next) {
  const { user } = req;
  const societyId = req.params.societyId || req.body.society_id || req.query.society_id;
  if (!societyId) return res.status(400).json({ error: 'society_id is required' });
  if (!mongoose.isValidObjectId(societyId)) return res.status(400).json({ error: 'Invalid society_id' });
  if (user.role === 'super_admin') return next();

  const access = await UserSocietyAccess.exists({ user_id: user._id, society_id: societyId });
  if (!access) return res.status(403).json({ error: 'No access to this society' });
  next();
}
