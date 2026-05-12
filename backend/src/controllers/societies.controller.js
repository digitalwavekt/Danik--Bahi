import mongoose from 'mongoose';
import Society from '../models/Society.js';
import LedgerEntry from '../models/LedgerEntry.js';
import UserSocietyAccess from '../models/UserSocietyAccess.js';

export async function createSociety(req, res) {
  const society = await Society.create({ ...req.body, created_by: req.user._id });
  return res.status(201).json({ society });
}

export async function listSocieties(req, res) {
  if (req.user.role === 'super_admin') {
    const societies = await Society.find().sort({ created_at: -1 });
    return res.json({ societies });
  }
  const access = await UserSocietyAccess.find({ user_id: req.user._id }).populate('society_id').sort({ created_at: -1 });
  return res.json({ societies: access.map((a) => a.society_id).filter(Boolean) });
}

export async function getSociety(req, res) {
  const society = await Society.findById(req.params.societyId);
  if (!society) return res.status(404).json({ error: 'Society not found' });
  return res.json({ society });
}

export async function updateSociety(req, res) {
  const society = await Society.findByIdAndUpdate(req.params.societyId, req.body, { new: true, runValidators: true });
  if (!society) return res.status(404).json({ error: 'Society not found' });
  return res.json({ society });
}

export async function getSocietyBalance(req, res) {
  const result = await LedgerEntry.aggregate([
    { $match: { society_id: new mongoose.Types.ObjectId(req.params.societyId), is_deleted: false } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const totalCredit = result.find((r) => r._id === 'credit')?.total || 0;
  const totalDebit = result.find((r) => r._id === 'debit')?.total || 0;
  return res.json({ total_credit: totalCredit, total_debit: totalDebit, balance: totalCredit - totalDebit });
}
