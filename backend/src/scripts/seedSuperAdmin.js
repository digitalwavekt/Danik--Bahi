import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/auth.js';

dotenv.config();

const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@yourorg.com';
const password = process.env.SUPER_ADMIN_PASSWORD || 'YourStrongPassword@123';
const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

await connectDB();
const existing = await User.findOne({ email });
if (existing) {
  console.log(`Super admin already exists: ${email}`);
  process.exit(0);
}
await User.create({ email, name, role: 'super_admin', password_hash: await hashPassword(password), is_active: true });
console.log(`✅ Super admin created: ${email}`);
process.exit(0);
