import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/auth.js';

dotenv.config();

const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@yourorg.com';
const password =
  process.env.SUPER_ADMIN_PASSWORD || 'YourStrongPassword@123';

const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

await connectDB();

const existingSuperAdmin = await User.findOne({
  role: 'super_admin',
});

if (existingSuperAdmin) {
  existingSuperAdmin.email = email.toLowerCase().trim();
  existingSuperAdmin.name = name;
  existingSuperAdmin.password_hash = await hashPassword(password);
  existingSuperAdmin.is_active = true;

  await existingSuperAdmin.save();

  console.log(`✅ Super admin updated: ${email}`);
  process.exit(0);
}

await User.create({
  email: email.toLowerCase().trim(),
  name,
  role: 'super_admin',
  password_hash: await hashPassword(password),
  is_active: true,
});

console.log(`✅ Super admin created: ${email}`);
process.exit(0);