# Sahakari Samiti Dainik Bahi — MongoDB Architecture

## Stack
- Backend: Node.js + Express + Mongoose
- Database: MongoDB Atlas
- Auth: JWT access token + opaque refresh token stored hashed in MongoDB
- File uploads: local `/uploads/bills` static folder for MVP
- Web: React + Vite on Vercel
- Mobile: Expo Android APK

## Collections
- users
- refresh_tokens
- societies
- user_society_accesses
- entry_headings
- ledger_entries

## Deployment Env
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=64+ char secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app
PUBLIC_API_URL=https://your-render-api.onrender.com
NODE_ENV=production
PORT=4000
```

## Important Note
Local file uploads on Render are not permanent across rebuilds/redeploys. For production, replace local upload storage with S3 or Cloudinary.
