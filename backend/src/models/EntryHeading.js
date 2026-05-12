import mongoose from 'mongoose';

const headingSchema = new mongoose.Schema({
  society_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

headingSchema.virtual('id').get(function () { return this._id.toString(); });
headingSchema.index({ society_id: 1, name: 1, type: 1 });

export default mongoose.model('EntryHeading', headingSchema);
