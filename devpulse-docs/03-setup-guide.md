# DevPulse — Setup & Deployment Guide

**Version:** 1.0  
**Last updated:** June 2026  
**Scope:** Local development setup, environment variables, and Vercel deployment

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | Any | `git --version` |

---

## 1. Repo Setup

```bash
# Create the project
npm create vite@latest devpulse -- --template react
cd devpulse

# Install dependencies
npm install

# Install Tabler icons (used for tab icons)
npm install @tabler/icons-react
```

### Folder structure after setup

```bash
devpulse/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/   # create manually
│   ├── hooks/        # create manually
│   ├── api/          # create manually
│   ├── utils/        # create manually
│   └── constants/    # create manually
├── public/
├── .env.local        # you create this — see §2
├── .env.example      # commit this
├── vite.config.js
└── package.json
```

Create the directories:

```bash
mkdir -p src/components src/hooks src/api src/utils src/constants
```

---

## 2. Environment Variables

### Keys you need

| Variable | Source | Free? |
|----------|--------|-------|
| `VITE_CURRENTS_API_KEY` | currentsapi.services | ✅ Yes |
| `VITE_GEMINI_API_KEY` | aistudio.google.com | ✅ Yes |

HN, DEV.to, and GitHub Search require no API keys.

### Get your keys

**Currents API (Tech News tab)**
1. Go to [https://currentsapi.services](https://currentsapi.services)
2. Click "Sign Up" — free, no credit card
3. Dashboard → copy your API key
4. Free tier: 600 requests/day

**Gemini API (Learn tab)**
1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google
3. Click "Get API Key" → "Create API Key"
4. Free tier: 15 req/min, 1,500 req/day, $0

### Create `.env.local`

```bash
# .env.local — never commit this file
VITE_CURRENTS_API_KEY=your_currents_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

### Create `.env.example` (commit this)

```bash
# .env.example — copy to .env.local and fill in your keys
VITE_CURRENTS_API_KEY=
VITE_GEMINI_API_KEY=
```

### Add `.env.local` to `.gitignore`

```bash
echo ".env.local" >> .gitignore
```

### Accessing keys in code

```javascript
// Vite exposes VITE_ prefixed vars to the client
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CURRENTS_KEY = import.meta.env.VITE_CURRENTS_API_KEY;

// Guard against missing keys
if (!GEMINI_KEY) {
  console.warn('[DevPulse] VITE_GEMINI_API_KEY not set — Learn tab will be disabled');
}
```

---

## 3. Running Locally

```bash
# Start dev server
npm run dev
```

App runs at `http://localhost:5173`

### Verify each API is working

Open the browser console and check for errors as you click each tab. Expected first-load behaviour:

| Tab | First load | Expected |
|-----|-----------|---------|
| HN | ~800ms | 12 stories from Firebase |
| DEV.to | ~600ms | 12 articles |
| GitHub | ~500ms | 12 repos |
| Jobs | ~900ms | 10–15 job listings |
| News | ~700ms | 12 tech news items |
| Learn | ~2–4s | 5 AI-generated tips |

If a tab fails, check:
1. Is the API key set correctly in `.env.local`?
2. Is there a CORS error in the console? (Should not happen with these APIs)
3. Is the API down? Check their status page.

---

## 4. Build for Production

```bash
# Build
npm run build

# Preview the production build locally
npm run preview
```

Production build outputs to `/dist`. Check bundle size:

```bash
npm run build 2>&1 | grep "dist/"
```

Target: main bundle under 200KB gzipped.

---

## 5. Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: your account
# - Link to existing project: N
# - Project name: devpulse
# - Directory: ./
# - Build command: npm run build
# - Output dir: dist
```

### Option B — Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click Deploy

### Setting environment variables on Vercel

After deploying:

1. Vercel Dashboard → your project → Settings → Environment Variables
2. Add:
   - `VITE_CURRENTS_API_KEY` → your key → All environments
   - `VITE_GEMINI_API_KEY` → your key → All environments
3. Redeploy: Deployments → three dots → Redeploy

> **Important:** Vercel exposes `VITE_` prefixed variables to the client bundle at build time. They are visible in the browser — this is acceptable for free-tier keys with rate limits. For paid keys, proxy through a Vercel serverless function instead (V2 concern).

---

## 6. Custom Domain

```bash
# Add domain via CLI
vercel domains add devpulse.dev

# Or via dashboard: Settings → Domains → Add
```

Recommended: register `devpulse.dev` — available as of June 2026.

DNS setup (if using external registrar):
- Add a CNAME record: `www` → `cname.vercel-dns.com`
- Add an A record: `@` → `76.76.21.21`

---

## 7. Vercel Serverless Function (Optional — for rate-limited APIs)

If you hit Product Hunt's 100 req/day limit or need to hide API keys from the client bundle, add a serverless proxy:

```
devpulse/
└── api/
    └── news.js    ← Vercel function
```

```javascript
// api/news.js
export default async function handler(req, res) {
  const key = process.env.CURRENTS_API_KEY; // server-side only, no VITE_ prefix
  const response = await fetch(
    `https://api.currentsapi.services/v1/latest-news?language=en&category=technology&apiKey=${key}`
  );
  const data = await response.json();
  res.status(200).json(data);
}
```

Client calls `/api/news` instead of Currents directly. Key never leaves the server.

For V1, this is optional — the client-side approach works fine.

---

## 8. `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor from app code
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

---

## 9. `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.jsx",
    "clean": "rm -rf dist node_modules/.vite"
  }
}
```

---

## 10. Google AdSense (Placeholder)

Add the AdSense script to `index.html` once your account is approved. For now, mark the slot with a placeholder div so the layout is ready.

```html
<!-- index.html -->
<head>
  <!-- Add after AdSense approval:
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
  -->
</head>
```

```jsx
// In your feed layout — ad slot placeholder
function AdSlot({ id }) {
  return (
    <div
      id={id}
      className="dp-ad-slot"
      style={{ minHeight: 90, background: 'var(--dp-bg)', border: '1px dashed var(--dp-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* AdSense ad renders here after approval */}
      <span style={{ fontSize: 11, color: 'var(--dp-hint)' }}>ad</span>
    </div>
  );
}
```

AdSense eligibility checklist before applying:
- Site is live on a custom domain (not `.vercel.app`)
- Has real, original content (the feed qualifies)
- Has a Privacy Policy page (required)
- Has been live for at least a few weeks with some traffic
- Minimum traffic: no official threshold, but 50+ daily users recommended

---

## 11. Local Development Tips

### Clear localStorage during testing

```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Inspect cache state

```javascript
// Check what's cached
Object.keys(localStorage).filter(k => k.startsWith('dp_'));
```

### Simulate API failure

```javascript
// Temporarily override fetch to test error states
const _fetch = window.fetch;
window.fetch = (url, ...args) => {
  if (url.includes('hacker-news')) return Promise.reject(new Error('Simulated HN failure'));
  return _fetch(url, ...args);
};
```

### Test keyboard shortcuts

Focus the feed (click anywhere on the page first), then:
- `J` / `K` to scroll cards
- `Shift+H` / `Shift+L` to switch tabs
- `?` to open keyboard help

---

## 12. Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `VITE_GEMINI_API_KEY is not defined` | Missing `.env.local` | Create `.env.local` with your key |
| Currents API returning 401 | Wrong API key | Re-copy from currentsapi.services dashboard |
| GitHub returns 403 | Rate limit hit (60/hr) | Wait 1 hour or add GitHub token |
| Learn tab loads forever | Gemini quota exceeded | Wait until next day (1,500/day limit) |
| Ticker not scrolling | JS error in ticker init | Check console, likely a DOM timing issue — add `requestAnimationFrame` delay |
| Cards not marked as seen | localStorage blocked | Check browser settings — private mode blocks localStorage |
