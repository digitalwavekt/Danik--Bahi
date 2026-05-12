import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token_hash: { type: String, required: true, unique: true, index: true },
  expires_at: { type: Date, required: true },
  is_revoked: { type: Boolean, default: false },
  ip_address: String,
  user_agent: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

refreshTokenSchema.virtual('id').get(function () { return this._id.toString(); });

export default mongoose.model('RefreshToken', refreshTokenSchema);
