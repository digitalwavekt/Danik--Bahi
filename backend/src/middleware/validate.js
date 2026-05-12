import { z } from 'zod';

const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid MongoDB ObjectId');

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({ error: 'Validation failed', errors: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) });
    }
    req.body = result.data;
    next();
  };
}

export const schemas = {
  login: z.object({ email: z.string().email('Invalid email').toLowerCase().trim(), password: z.string().min(6, 'Password too short') }),
  createUser: z.object({
    email: z.string().email().toLowerCase().trim(),
    name: z.string().min(2).max(100).trim(),
    password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
    role: z.enum(['society_admin', 'editor', 'viewer', 'auditor']),
    society_ids: z.array(mongoId).optional(),
  }),
  createSociety: z.object({ name: z.string().min(2).max(200).trim(), registration_number: z.string().max(100).trim().optional(), address: z.string().max(500).trim().optional() }),
  createHeading: z.object({ society_id: mongoId, name: z.string().min(1).max(200).trim(), type: z.enum(['credit', 'debit']) }),
  createEntry: z.object({ society_id: mongoId, heading_id: mongoId, sub_heading: z.string().min(1).max(300).trim(), amount: z.coerce.number().positive('Amount must be positive'), entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'), notes: z.string().max(1000).trim().optional() }),
  updateEntry: z.object({ sub_heading: z.string().min(1).max(300).trim().optional(), amount: z.coerce.number().positive().optional(), entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), notes: z.string().max(1000).trim().optional() }),
  refreshToken: z.object({ refresh_token: z.string().min(10) }),
};
