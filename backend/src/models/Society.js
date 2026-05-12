import mongoose from 'mongoose';

const societySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  registration_number: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

societySchema.virtual('id').get(function () { return this._id.toString(); });

export default mongoose.model('Society', societySchema);
