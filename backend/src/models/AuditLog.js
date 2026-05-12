import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        society: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Society',
            default: null,
        },
        action: {
            type: String,
            required: true,
        },
        module: {
            type: String,
            required: true,
        },
        entity_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        entity_type: {
            type: String,
            default: null,
        },
        metadata: {
            type: Object,
            default: {},
        },
        ip_address: {
            type: String,
            default: null,
        },
        user_agent: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);