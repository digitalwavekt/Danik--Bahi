# Sahakari Samiti Dainik Bahi — Deployment Guide

## Prerequisites
- Supabase account (free tier works)
- Render account (for backend)
- Vercel account (for frontend)
- Expo account (for mobile APK build)

---

## Step 1 — Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** → paste the contents of `backend/src/config/migration.sql` → Run
3. Go to **Storage** → Create a new bucket called `bills` → Set to **Public**
4. Copy your:
   - Project URL: `https://xxxx.supabase.co`
   - Service Role Key (from Settings → API)

---

## Step 2 — Create Super Admin

Run this Node.js snippet ONCE locally to generate the bcrypt hash:

```js
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('YourStrongPassword@123', 12);
console.log(hash);
```

Then in Supabase SQL Editor:
```sql
INSERT INTO users (email, name, role, password_hash)
VALUES ('superadmin@yourorg.com', 'Super Admin', 'super_admin', '$2b$12$...PASTE_HASH_HERE...');
```

---

## Step 3 — Backend (Render)

1. Push `/backend` folder to a GitHub repo
2. Go to render.com → New Web Service → Connect your repo
3. Set environment variables:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJxxx...
   JWT_SECRET=generate-a-64-char-random-string
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   NODE_ENV=production
   PORT=4000
   ```
4. Deploy. Note the URL: `https://dainik-bahi-api.onrender.com`

---

## Step 4 — Frontend (Vercel)

1. Push `/frontend` folder to GitHub
2. Go to vercel.com → Import project
3. Add environment variable:
   ```
   VITE_API_URL=https://dainik-bahi-api.onrender.com/api
   ```
4. Deploy. Get URL like: `https://dainik-bahi.vercel.app`
5. Go back to Render → Update `ALLOWED_ORIGINS` with your Vercel URL

---

## Step 5 — Mobile App (Android APK)

1. cd into `/mobile`
2. Update `app.json` with your EAS project ID
3. Update `EXPO_PUBLIC_API_URL` in `.env`:
   ```
   EXPO_PUBLIC_API_URL=https://dainik-bahi-api.onrender.com/api
   ```
4. Install EAS CLI: `npm install -g eas-cli`
5. Login: `eas login`
6. Build APK: `eas build -p android --profile preview`
7. Download and install the APK on Android device

---

## Security Checklist

- [ ] Super admin password changed after first login
- [ ] JWT_SECRET is at least 64 random characters
- [ ] ALLOWED_ORIGINS is set to exact Vercel URL only
- [ ] Supabase service key is NOT exposed to frontend
- [ ] Supabase Row Level Security (RLS) disabled (API handles auth)
- [ ] All sub-admins have minimal required permissions

---

## Folder Structure

```
dainik-bahi/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # Supabase client, migration SQL
│   │   ├── controllers/      # auth, users, societies, headings, entries, reports
│   │   ├── middleware/        # auth.js (JWT), validate.js (Zod)
│   │   ├── routes/           # All routes in index.js
│   │   ├── utils/            # JWT, bcrypt helpers
│   │   └── server.js         # Entry point
│   └── render.yaml           # Render deploy config
│
├── frontend/                 # React + Vite + Tailwind (Web)
│   ├── src/
│   │   ├── api/              # Axios client with auto-refresh
│   │   ├── components/       # Layout, ProtectedRoute, DeleteConfirmModal
│   │   ├── pages/            # Login, Dashboard, Entries, EntryForm,
│   │   │                       Societies, Headings, Reports, Users
│   │   └── store/            # Zustand auth store
│   └── vercel.json
│
└── mobile/                   # React Native + Expo (Android)
    ├── app/                  # Expo Router pages
    │   ├── (tabs)/           # Dashboard, Entries, NewEntry, Reports, Profile
    │   └── login.js
    ├── src/
    │   ├── api/              # Axios client with auto-refresh
    │   ├── screens/          # All screen components
    │   └── store/            # Zustand + SecureStore auth
    └── app.json
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | /auth/login | — | Any |
| POST | /auth/refresh | — | Any |
| POST | /auth/logout | — | Any |
| GET | /societies | ✓ | Any |
| POST | /societies | ✓ | super_admin |
| GET | /societies/:id/balance | ✓ | Access |
| GET | /societies/:id/entries | ✓ | Access |
| POST | /entries | ✓ | Editor+ |
| PUT | /entries/:id | ✓ | Editor+ |
| DELETE | /entries/:id | ✓ | Editor+ |
| GET | /societies/:id/headings | ✓ | Access |
| POST | /headings | ✓ | Admin+ |
| GET | /users | ✓ | Admin+ |
| POST | /users | ✓ | Admin+ |
| GET | /societies/:id/reports/summary | ✓ | Auditor+ |
| GET | /societies/:id/reports/export | ✓ | Auditor+ |
