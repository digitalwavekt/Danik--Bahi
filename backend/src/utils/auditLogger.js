import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
    req,
    action,
    module,
    entity_id = null,
    entity_type = null,
    society = null,
    metadata = {},
}) => {
    try {
        await AuditLog.create({
            user: req.user?._id || req.user?.id || null,
            society: society || req.user?.society || null,
            action,
            module,
            entity_id,
            entity_type,
            metadata,
            ip_address:
                req.headers['x-forwarded-for']?.split(',')[0] ||
                req.socket?.remoteAddress ||
                null,
            user_agent: req.headers['user-agent'] || null,
        });
    } catch (error) {
        console.error('Audit log failed:', error.message);
    }
};