# Color Buddy — Setup Instructions

## 1. Install dependencies (run once)
Open Terminal, navigate to this folder, then run:
```
npm install
```

## 2. Test locally
```
npm run dev
```
Open http://localhost:3000 — the app should load.

## 3. Push to GitHub

### Create the repo on GitHub first:
1. Go to https://github.com/new
2. Name it: `color-buddy`
3. Set it to **Public** (required for free Vercel)
4. Do NOT initialize with README (we already have one)
5. Click **Create repository**

### Then run these commands in Terminal from this folder:
```bash
git init
git add .
git commit -m "Initial commit: Color Buddy coloring page generator"
git branch -M main
git remote add origin https://github.com/ilyarivkin8/color-buddy.git
git push -u origin main
```

## 4. Deploy to Vercel

1. Go to https://vercel.com/new
2. Click **Import Git Repository** → select `color-buddy`
3. In **Environment Variables**, add:
   - Key: `GOOGLE_AI_API_KEY`
   - Value: (your Google AI Studio API key)
4. Click **Deploy**

Vercel will give you a public URL like `https://color-buddy-xyz.vercel.app`

## Notes
- `.env.local` is gitignored — your API key is never pushed to GitHub
- The Vercel environment variable is set separately in step 4
