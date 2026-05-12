# Sahakari Samiti Dainik Bahi — Architecture

## Overview
Daily ledger entry system for cooperative societies. Multi-tenant, role-based, mobile + web.

## Stack
- **Frontend (Web):** React 18 + Vite + TailwindCSS → Vercel
- **Mobile (Android):** React Native (Expo) → APK
- **Backend:** Node.js + Express → Render
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (bill uploads)
- **Auth:** JWT Access Token (15min) + Refresh Token (30 days, stored in httpOnly cookie)

## Roles
| Role | Description |
|------|-------------|
| super_admin | Full system access. Creates societies, manages sub-admins |
| society_admin | Full access to assigned society/societies |
| editor | Can add/edit/delete entries in assigned society |
| viewer | Read-only access to assigned society |
| auditor | Can view reports and export PDF/Excel for assigned society |

## Database Schema (Supabase)

### users
- id (uuid, PK)
- email (unique)
- password_hash
- name
- role: super_admin | society_admin | editor | viewer | auditor
- is_active (bool)
- created_by (uuid FK users)
- created_at

### refresh_tokens
- id (uuid, PK)
- user_id (uuid FK users)
- token_hash (text)
- expires_at (timestamp)
- is_revoked (bool)
- created_at
- ip_address

### societies
- id (uuid, PK)
- name
- registration_number
- address
- created_by (uuid FK users)
- is_active (bool)
- created_at

### user_society_access
- id (uuid, PK)
- user_id (uuid FK users)
- society_id (uuid FK societies)
- granted_by (uuid FK users)
- created_at

### entry_headings
- id (uuid, PK)
- society_id (uuid FK societies)
- name (text)
- type: credit | debit
- is_active (bool)
- created_by (uuid FK users)
- created_at

### ledger_entries
- id (uuid, PK)
- society_id (uuid FK societies)
- heading_id (uuid FK entry_headings)
- sub_heading (text)
- amount (numeric)
- type: credit | debit
- entry_date (date) — can be backdated
- bill_url (text, nullable)
- notes (text, nullable)
- created_by (uuid FK users)
- updated_by (uuid FK users)
- created_at
- updated_at
- is_deleted (bool, soft delete)

## Security
- Passwords: bcrypt (rounds: 12)
- JWT: RS256 or HS256 with strong secret
- Refresh tokens: hashed (SHA-256) before DB storage
- Rate limiting: express-rate-limit on all routes
- CORS: whitelist frontend domains only
- Input validation: Zod on backend, React Hook Form + Zod on frontend
- Button throttling: debounce + loading state on all submit buttons
- SQL injection: Supabase client uses parameterized queries
- XSS: Content Security Policy headers via helmet.js
