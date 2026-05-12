import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  society_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true, index: true },
  heading_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EntryHeading', required: true, index: true },
  sub_heading: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  entry_date: { type: String, required: true, index: true },
  bill_url: { type: String, default: null },
  bill_path: { type: String, default: null },
  notes: { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  is_deleted: { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

entrySchema.virtual('id').get(function () { return this._id.toString(); });
entrySchema.index({ society_id: 1, entry_date: -1, created_at: -1 });

export default mongoose.model('LedgerEntry', entrySchema);
