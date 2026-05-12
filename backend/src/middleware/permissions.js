import mongoose from 'mongoose';
import LedgerEntry from '../models/LedgerEntry.js';
import UserSocietyAccess from '../models/UserSocietyAccess.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export function requireRole(roles = []) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        if (req.user.role === 'super_admin') return next();

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        next();
    };
}

export async function hasSocietyPermission(user, societyId, permission) {
    if (!user) return false;
    if (user.role === 'super_admin') return true;

    if (!societyId || !isValidObjectId(societyId)) return false;

    const access = await UserSocietyAccess.findOne({
        user_id: user._id,
        society_id: societyId,
    });

    if (!access) return false;

    return access.permissions?.[permission] === true;
}

export function requireSocietyPermission(permission = 'read') {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

            if (req.user.role === 'super_admin') return next();

            const societyId =
                req.params.societyId ||
                req.body.society_id ||
                req.body.societyId ||
                req.query.society_id ||
                req.query.societyId;

            if (!societyId || !isValidObjectId(societyId)) {
                return res.status(400).json({ error: 'Valid society is required' });
            }

            const allowed = await hasSocietyPermission(req.user, societyId, permission);

            if (!allowed) {
                return res.status(403).json({
                    error: `You do not have ${permission} permission for this society`,
                });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
}

export function requireEntryPermission(permission = 'write') {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

            if (req.user.role === 'super_admin') return next();

            const entryId = req.params.entryId;

            if (!entryId || !isValidObjectId(entryId)) {
                return res.status(400).json({ error: 'Invalid entry id' });
            }

            const entry = await LedgerEntry.findOne({
                _id: entryId,
                is_deleted: false,
            }).select('society_id');

            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            const allowed = await hasSocietyPermission(
                req.user,
                entry.society_id.toString(),
                permission
            );

            if (!allowed) {
                return res.status(403).json({
                    error: `You do not have ${permission} permission for this entry`,
                });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
}