import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import EntryHeading from '../models/EntryHeading.js';
import LedgerEntry from '../models/LedgerEntry.js';
import { s3, S3_BUCKET, S3_PUBLIC_BASE_URL } from '../config/s3.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function saveBill(req, societyId) {
  if (!req.file) return {};

  if (!S3_BUCKET || !S3_PUBLIC_BASE_URL) {
    throw new Error('S3 is not configured');
  }

  const originalName = req.file.originalname || 'bill';
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';

  const key = `bills/${societyId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  await new Upload({
    client: s3,
    params: {
      Bucket: S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    },
  }).done();

  return {
    bill_path: key,
    bill_url: `${S3_PUBLIC_BASE_URL}/${key}`,
  };
}

async function deleteBillFromS3(key) {
  if (!key || !S3_BUCKET) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

export async function createEntry(req, res) {
  try {
    const societyId = req.body.society_id || req.body.societyId;
    const headingId = req.body.heading_id || req.body.headingId;
    const subHeading = req.body.sub_heading || req.body.subHeading || '';
    const { amount, entry_date, notes } = req.body;

    if (!societyId) return res.status(400).json({ error: 'Select society' });
    if (!headingId) return res.status(400).json({ error: 'Select heading' });
    if (!isValidObjectId(societyId)) return res.status(400).json({ error: 'Invalid society selected' });
    if (!isValidObjectId(headingId)) return res.status(400).json({ error: 'Invalid heading selected' });

    const heading = await EntryHeading.findById(headingId);
    if (!heading) return res.status(404).json({ error: 'Heading not found' });
    if (!heading.is_active) return res.status(400).json({ error: 'Heading is inactive' });

    if (heading.society_id.toString() !== societyId) {
      return res.status(400).json({ error: 'Heading does not belong to selected society' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (entry_date && entry_date > today) {
      return res.status(400).json({ error: 'Entry date cannot be in future' });
    }

    const bill = await saveBill(req, societyId);

    const entry = await LedgerEntry.create({
      society_id: societyId,
      heading_id: headingId,
      sub_heading: subHeading,
      amount: Number(amount),
      type: heading.type,
      entry_date,
      notes: notes || '',
      ...bill,
      created_by: req.user._id,
      is_deleted: false,
    });

    await entry.populate([
      { path: 'heading_id', select: 'name type' },
      { path: 'created_by', select: 'name' },
    ]);

    return res.status(201).json({ entry });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create entry' });
  }
}

export async function listEntries(req, res) {
  try {
    const { societyId } = req.params;
    const { from, to, type, heading_id, headingId, page = 1, limit = 50 } = req.query;

    if (!isValidObjectId(societyId)) return res.status(400).json({ error: 'Invalid society' });

    const filter = { society_id: societyId, is_deleted: false };

    if (from || to) {
      filter.entry_date = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    if (type) filter.type = type;
    if (heading_id || headingId) filter.heading_id = heading_id || headingId;

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      LedgerEntry.find(filter)
        .populate('heading_id', 'name type')
        .populate('created_by', 'name')
        .sort({ entry_date: -1, created_at: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LedgerEntry.countDocuments(filter),
    ]);

    return res.json({
      entries: entries.map((e) => ({ ...e.toObject(), id: e._id.toString() })),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load entries' });
  }
}

export async function getEntry(req, res) {
  try {
    const entry = await LedgerEntry.findOne({
      _id: req.params.entryId,
      is_deleted: false,
    })
      .populate('heading_id', 'name type')
      .populate('created_by', 'name');

    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    return res.json({
      entry: { ...entry.toObject(), id: entry._id.toString() },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load entry' });
  }
}

export async function updateEntry(req, res) {
  try {
    const entry = await LedgerEntry.findOne({
      _id: req.params.entryId,
      is_deleted: false,
    });

    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const today = new Date().toISOString().split('T')[0];

    if (req.body.entry_date && req.body.entry_date > today) {
      return res.status(400).json({ error: 'Date cannot be in future' });
    }

    for (const key of ['sub_heading', 'amount', 'entry_date', 'notes']) {
      if (req.body[key] !== undefined) entry[key] = req.body[key];
    }

    if (req.file && entry.bill_path) {
      await deleteBillFromS3(entry.bill_path).catch(() => { });
    }

    if (req.file) {
      Object.assign(entry, await saveBill(req, entry.society_id.toString()));
    }

    entry.updated_by = req.user._id;

    await entry.save();
    await entry.populate('heading_id', 'name type');

    return res.json({ entry });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update entry' });
  }
}

export async function deleteEntry(req, res) {
  try {
    const entry = await LedgerEntry.findByIdAndUpdate(
      req.params.entryId,
      { is_deleted: true, updated_by: req.user._id },
      { new: true }
    );

    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    return res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete entry' });
  }
}