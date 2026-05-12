import mongoose from 'mongoose';

const userSocietyAccessSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    society_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    permissions: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
    },
    granted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

userSocietyAccessSchema.index(
  { user_id: 1, society_id: 1 },
  { unique: true }
);

export default mongoose.model('UserSocietyAccess', userSocietyAccessSchema);