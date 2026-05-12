# L.UZ Digital Menu Board

A production-ready digital menu board web application built with React, Vite, Framer Motion, Tailwind CSS, and Supabase.

## Prerequisites

- Node.js (v18+)
- npm
- Supabase Project

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supabase Database Setup**
   Run the SQL code found in `supabase_setup.sql` in your Supabase project's SQL editor. This creates the necessary tables (`products` and `tv_settings`) and enables Realtime.

3. **Supabase Storage Setup**
   Create a new public storage bucket named `product-images` in your Supabase dashboard and add a policy to allow public access.

4. **Environment Variables**
   Rename `.env.example` to `.env` and fill in your Supabase details:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_PASSWORD=your_secure_password
   ```

## Running the Application

Start the development server:
```bash
npm run dev
```

### URLs
- **Main Home:** `http://localhost:5173/`
- **TV Screens:** `http://localhost:5173/tv/1` (replace 1 with 2 or 3)
- **Admin Panel:** `http://localhost:5173/admin` (Default password is set in `.env`)

## Features
- **Realtime Updates:** The TV screens automatically update whenever prices or items change in the admin panel.
- **Premium Animations:** Smooth, staggered, Framer Motion transitions (fade, slide, floating).
- **Responsive:** Designed primarily for 1920x1080 resolution TV screens.
