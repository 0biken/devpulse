# DevPulse

A modern developer feed that pulls live data from multiple sources (Hacker News, DEV.to, GitHub, Currents API, and Google Gemini) into a single, beautiful dashboard.

## Features
- **Live Data:** Fetches top stories, jobs, trending repositories, and news.
- **AI Learn Tips:** Uses Google Gemini to generate quick, actionable developer tips.
- **Session Caching:** Minimizes API calls when switching tabs.
- **Premium UI:** Built with React 18, Tailwind CSS v4, and Tabler Icons.
- **Keyboard Shortcuts:** Navigate smoothly using J/K to scroll or Shift+H/L to switch tabs.

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   VITE_CURRENTS_API_KEY=your_key_here
   VITE_GEMINI_API_KEY=your_key_here
   ```

3. **Run Locally:**
   ```bash
   npm run dev
   ```

## Tech Stack
- React 18 + Vite
- Tailwind CSS v4
- Vercel (for Deployment)
