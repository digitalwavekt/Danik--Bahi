import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['super_admin', 'society_admin', 'editor', 'viewer', 'auditor'], required: true },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('id').get(function () { return this._id.toString(); });
{ unique: true };

export default mongoose.model('User', userSchema);
