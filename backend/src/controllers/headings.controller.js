import mongoose from 'mongoose';
import EntryHeading from '../models/EntryHeading.js';
import LedgerEntry from '../models/LedgerEntry.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function createHeading(req, res) {
  const societyId = req.body.society_id || req.body.societyId;
  const { name, type } = req.body;

  if (!societyId) {
    return res.status(400).json({ error: 'Society is required' });
  }

  if (!isValidObjectId(societyId)) {
    return res.status(400).json({ error: 'Invalid society selected' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Heading name required' });
  }

  if (!['credit', 'debit'].includes(type)) {
    return res.status(400).json({ error: 'Valid heading type required' });
  }

  const existing = await EntryHeading.findOne({
    society_id: societyId,
    name: name.trim(),
    type,
  });

  if (existing) {
    return res.status(409).json({ error: 'Heading already exists for this society' });
  }

  const heading = await EntryHeading.create({
    society_id: societyId,
    name: name.trim(),
    type,
    is_active: true,
    created_by: req.user?._id,
  });

  return res.status(201).json({ heading });
}

export async function listHeadings(req, res) {
  const societyId = req.params.societyId;

  if (!societyId) {
    return res.status(400).json({ error: 'Society is required' });
  }

  if (!isValidObjectId(societyId)) {
    return res.status(400).json({ error: 'Invalid society selected' });
  }

  const filter = {
    society_id: societyId,
  };

  if (req.query.active !== 'all') {
    filter.is_active = true;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  const headings = await EntryHeading.find(filter).sort({ name: 1 });

  return res.json({ headings });
}

export async function toggleHeading(req, res) {
  const headingId = req.params.headingId;

  if (!isValidObjectId(headingId)) {
    return res.status(400).json({ error: 'Invalid heading id' });
  }

  const current = await EntryHeading.findById(headingId);

  if (!current) {
    return res.status(404).json({ error: 'Heading not found' });
  }

  current.is_active = !current.is_active;
  await current.save();

  return res.json({ heading: current });
}

export async function deleteHeading(req, res) {
  const headingId = req.params.headingId;

  if (!isValidObjectId(headingId)) {
    return res.status(400).json({ error: 'Invalid heading id' });
  }

  const count = await LedgerEntry.countDocuments({
    heading_id: headingId,
    is_deleted: false,
  });

  if (count > 0) {
    return res.status(409).json({
      error: 'Cannot delete heading with existing entries. Deactivate it instead.',
    });
  }

  const deleted = await EntryHeading.findByIdAndDelete(headingId);

  if (!deleted) {
    return res.status(404).json({ error: 'Heading not found' });
  }

  return res.json({ message: 'Heading deleted' });
}