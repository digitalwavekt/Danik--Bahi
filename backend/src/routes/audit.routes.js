import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
    try {
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        const query = {};

        if (req.user.role !== 'super_admin') {
            query.society = req.user.society;
        }

        const logs = await AuditLog.find(query)
            .populate('user', 'name email role')
            .populate('society', 'name')
            .sort({ createdAt: -1 })
            .limit(200);

        res.json({
            success: true,
            logs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
        });
    }
});

export default router;