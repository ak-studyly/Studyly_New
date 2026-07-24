# Studyly v3 — PDF Materials Platform

A clean, no-auth peer-to-peer study material sharing platform.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Postgres + Storage)
- **Tailwind CSS**
- **Vercel** (hosting)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase project
Go to [supabase.com](https://supabase.com) → New project.

Copy your credentials into `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the database schema
Go to **Supabase → SQL Editor**, paste and run `supabase/schema.sql`.

### 4. Create storage bucket
Go to **Supabase → Storage → New bucket**:
- Name: `materials`
- Public: **OFF**
- Max file size: **10MB**
- Allowed MIME types: `application/pdf`

Then go to **SQL Editor** and run:
```sql
create policy "Anyone can upload PDFs"
  on storage.objects for insert
  with check (bucket_id = 'materials');

create policy "Anyone can read materials"
  on storage.objects for select
  using (bucket_id = 'materials');
```

### 5. Approve your college
After adding a college via the homepage, go to **Supabase → Table Editor → colleges** and set `approved = true` for your college.

### 6. Approve uploaded materials
After a student uploads, go to **Supabase → Table Editor → materials** and set `approved = true` to make it visible.

### 7. Run locally
```bash
npm run dev
```

---

## Deployment (Vercel)
1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## How it works

### For students (no login needed)
1. Visit homepage → select college, branch, year (remembered in browser)
2. Browse materials filtered to their class
3. Filter by subject or material type
4. Upvote helpful materials (one vote per browser)
5. Open PDFs directly in browser

### For you (admin)
- Approve colleges: Supabase → Table Editor → colleges → set `approved = true`
- Approve materials: Supabase → Table Editor → materials → set `approved = true`
- The approval step is your quality/safety gate

### Upload flow
1. Student selects college, branch, year, subject, title, type
2. Selects a PDF (max 10MB, PDF only — validated client + server side)
3. PDF uploads to Supabase Storage
4. Record inserted with `approved = false`
5. You review and approve in Supabase dashboard

### Upvoting
- Each browser gets a unique voter key stored in localStorage
- The `upvote_material` SQL function prevents double voting atomically
- Materials sorted by upvotes descending

---

## Project structure
```
src/
├── app/
│   ├── page.tsx              # Homepage with class selector
│   ├── materials/
│   │   ├── page.tsx          # Server component — fetches data
│   │   └── MaterialsClient.tsx # Browse + upvote UI
│   └── upload/
│       └── page.tsx          # PDF upload form
├── components/
│   ├── layout/
│   │   └── Navbar.tsx
│   └── ui/
│       └── AddCollegeModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

## Security notes
- **PDF only**: validated on client (MIME type + extension) and Supabase Storage (allowed MIME types setting)
- **Manual approval**: nothing goes live without your review — this is your main defence
- **No accounts**: no passwords to leak, no personal data stored
- **Supabase RLS**: policies ensure only approved content is publicly readable
- **Future**: add VirusTotal API scan on upload for automated malware detection
