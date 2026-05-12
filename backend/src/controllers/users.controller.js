import mongoose from 'mongoose';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import UserSocietyAccess from '../models/UserSocietyAccess.js';
import { hashPassword } from '../utils/auth.js';

function publicFields() {
  return 'email name role is_active created_at created_by';
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function getDefaultPermissions(role) {
  if (role === 'society_admin') {
    return { read: true, write: true, export: true };
  }

  if (role === 'editor') {
    // As per current plan: editor can read + export only, no write
    return { read: true, write: false, export: true };
  }

  if (role === 'auditor') {
    return { read: true, write: false, export: true };
  }

  // viewer
  return { read: true, write: false, export: false };
}

function normalizeSocietyAccess(societyAccess = [], fallbackRole = 'viewer') {
  const result = [];

  for (const item of societyAccess) {
    if (typeof item === 'string') {
      if (isValidObjectId(item)) {
        result.push({
          society_id: item,
          permissions: getDefaultPermissions(fallbackRole),
        });
      }
      continue;
    }

    const societyId = item?.society_id || item?.societyId || item?.id;

    if (!societyId || !isValidObjectId(societyId)) continue;

    result.push({
      society_id: societyId,
      permissions: {
        read: item?.permissions?.read ?? item?.read ?? true,
        write: item?.permissions?.write ?? item?.write ?? false,
        export: item?.permissions?.export ?? item?.export ?? false,
      },
    });
  }

  return result;
}

function canManageUser(actor, target) {
  if (actor.role === 'super_admin') return true;

  return target.created_by?.toString() === actor._id.toString();
}

export async function createUser(req, res) {
  try {
    const {
      email,
      name,
      password,
      role,
      society_ids = [],
      society_access = [],
    } = req.body;

    const creator = req.user;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required' });
    }

    if (!['society_admin', 'editor', 'viewer', 'auditor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (
      creator.role === 'society_admin' &&
      ['super_admin', 'society_admin'].includes(role)
    ) {
      return res.status(403).json({ error: 'Cannot create users with this role' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const newUser = await User.create({
      email: normalizedEmail,
      name: name.trim(),
      role,
      password_hash: await hashPassword(password),
      created_by: creator._id,
    });

    const accessInput =
      society_access.length > 0
        ? normalizeSocietyAccess(society_access, role)
        : normalizeSocietyAccess(society_ids, role);

    if (accessInput.length > 0) {
      await UserSocietyAccess.insertMany(
        accessInput.map((row) => ({
          user_id: newUser._id,
          society_id: row.society_id,
          permissions: row.permissions,
          granted_by: creator._id,
        })),
        { ordered: false }
      ).catch(() => { });
    }

    const user = await User.findById(newUser._id).select(publicFields()).lean();

    const access = await UserSocietyAccess.find({ user_id: newUser._id })
      .populate('society_id', 'name')
      .lean();

    return res.status(201).json({
      user: {
        ...user,
        id: user._id.toString(),
        user_society_access: access.map((row) => ({
          society_id: row.society_id?._id?.toString(),
          societies: row.society_id ? { name: row.society_id.name } : null,
          permissions: row.permissions,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function listUsers(req, res) {
  try {
    const filter = { _id: { $ne: req.user._id } };

    if (req.user.role !== 'super_admin') {
      filter.created_by = req.user._id;
    }

    const users = await User.find(filter)
      .select(publicFields())
      .sort({ created_at: -1 })
      .lean();

    const ids = users.map((u) => u._id);

    const access = await UserSocietyAccess.find({ user_id: { $in: ids } })
      .populate('society_id', 'name')
      .lean();

    const byUser = access.reduce((acc, row) => {
      const key = row.user_id.toString();
      acc[key] ||= [];
      acc[key].push({
        society_id: row.society_id?._id?.toString(),
        societies: row.society_id ? { name: row.society_id.name } : null,
        permissions: row.permissions || { read: true, write: false, export: false },
      });
      return acc;
    }, {});

    return res.json({
      users: users.map((u) => ({
        ...u,
        id: u._id.toString(),
        user_society_access: byUser[u._id.toString()] || [],
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load users' });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const target = await User.findById(req.params.userId);

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot modify super admin' });
    }

    if (!canManageUser(req.user, target)) {
      return res.status(403).json({ error: 'Cannot modify this user' });
    }

    target.is_active = !target.is_active;
    await target.save();

    if (!target.is_active) {
      await RefreshToken.updateMany(
        { user_id: target._id },
        { is_revoked: true }
      );
    }

    return res.json({
      user: {
        id: target._id.toString(),
        is_active: target.is_active,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}

export async function deleteUser(req, res) {
  try {
    const target = await User.findById(req.params.userId);

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    if (!canManageUser(req.user, target)) {
      return res.status(403).json({ error: 'Cannot delete this user' });
    }

    await RefreshToken.updateMany(
      { user_id: target._id },
      { is_revoked: true }
    );

    await UserSocietyAccess.deleteMany({ user_id: target._id });
    await target.deleteOne();

    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}

export async function updateSocietyAccess(req, res) {
  try {
    const { society_ids = [], society_access = [], role } = req.body;

    const target = await User.findById(req.params.userId);

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot update super admin access' });
    }

    if (!canManageUser(req.user, target)) {
      return res.status(403).json({ error: 'Cannot update this user access' });
    }

    await UserSocietyAccess.deleteMany({ user_id: target._id });

    const effectiveRole = role || target.role;

    const accessInput =
      society_access.length > 0
        ? normalizeSocietyAccess(society_access, effectiveRole)
        : normalizeSocietyAccess(society_ids, effectiveRole);

    if (accessInput.length > 0) {
      await UserSocietyAccess.insertMany(
        accessInput.map((row) => ({
          user_id: target._id,
          society_id: row.society_id,
          permissions: row.permissions,
          granted_by: req.user._id,
        })),
        { ordered: false }
      ).catch(() => { });
    }

    return res.json({ message: 'Access updated' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update access' });
  }
}