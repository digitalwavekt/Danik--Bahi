import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { verifyPassword, generateAccessToken, generateRefreshToken, hashRefreshToken, refreshTokenExpiry } from '../utils/auth.js';

function safeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password_hash;
  delete obj.__v;
  return obj;
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).lean(false);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.is_active) return res.status(403).json({ error: 'Account is deactivated' });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  await RefreshToken.create({
    user_id: user._id,
    token_hash: hashRefreshToken(refreshToken),
    expires_at: refreshTokenExpiry(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] || '',
  });

  return res.status(200).json({ access_token: accessToken, refresh_token: refreshToken, user: safeUser(user) });
}

export async function refresh(req, res) {
  const { refresh_token } = req.body;
  const tokenHash = hashRefreshToken(refresh_token);
  const tokenRow = await RefreshToken.findOne({ token_hash: tokenHash, is_revoked: false }).populate('user_id');
  if (!tokenRow) return res.status(401).json({ error: 'Invalid refresh token' });

  if (tokenRow.expires_at < new Date()) {
    tokenRow.is_revoked = true;
    await tokenRow.save();
    return res.status(401).json({ error: 'Refresh token expired, please login again' });
  }

  const user = tokenRow.user_id;
  if (!user?.is_active) return res.status(403).json({ error: 'Account is deactivated' });

  tokenRow.is_revoked = true;
  await tokenRow.save();

  const newRefreshToken = generateRefreshToken();
  await RefreshToken.create({
    user_id: user._id,
    token_hash: hashRefreshToken(newRefreshToken),
    expires_at: refreshTokenExpiry(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] || '',
  });

  return res.status(200).json({ access_token: generateAccessToken(user), refresh_token: newRefreshToken, user: safeUser(user) });
}

export async function logout(req, res) {
  const { refresh_token } = req.body;
  if (refresh_token) await RefreshToken.updateOne({ token_hash: hashRefreshToken(refresh_token) }, { is_revoked: true });
  return res.status(200).json({ message: 'Logged out successfully' });
}

export async function logoutAll(req, res) {
  await RefreshToken.updateMany({ user_id: req.user._id, is_revoked: false }, { is_revoked: true });
  return res.status(200).json({ message: 'Logged out from all devices' });
}
