import User from '../models/User.js';
import { hashPassword } from '../utils/auth.js';

export async function syncSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    if (!email || !password) {
        console.log(
            'SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping super admin sync.'
        );
        return;
    }

    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
        existingSuperAdmin.email = email.toLowerCase().trim();
        existingSuperAdmin.name = name;
        existingSuperAdmin.password_hash = await hashPassword(password);
        existingSuperAdmin.is_active = true;

        await existingSuperAdmin.save();

        console.log(`✅ Super admin synced from env: ${email}`);
        return;
    }

    await User.create({
        email: email.toLowerCase().trim(),
        name,
        role: 'super_admin',
        password_hash: await hashPassword(password),
        is_active: true,
    });

    console.log(`✅ Super admin created from env: ${email}`);
}