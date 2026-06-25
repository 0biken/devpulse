# DevPulse — API Integration Guide

**Version:** 1.0  
**Last updated:** June 2026  
**Scope:** All external data sources used in DevPulse V1

---

## Overview

DevPulse fetches from six data sources. Five are free public APIs requiring no backend. One (Gemini) requires a free API key stored in environment variables.

| Tab | Source | Auth | Rate Limit | CORS |
|-----|--------|------|------------|------|
| HN | HN Firebase API | None | None documented | ✅ Yes |
| DEV.to | DEV.to REST API | None (read-only) | 10 req/10s | ✅ Yes |
| GitHub | GitHub Search API | None (60 req/hr) | 60/hr unauthenticated | ✅ Yes |
| Jobs | HN Firebase API | None | None documented | ✅ Yes |
| News | Currents API | Free API key | 600/day free | ✅ Yes |
| Learn | Google Gemini API | Free API key | 15 req/min free | ✅ Yes |

---

## 1. Hacker News — Firebase API

### Base URL
```
https://hacker-news.firebaseio.com/v0
```

### Endpoints used

#### Top stories (list of IDs)
```
GET /topstories.json
```
Returns an array of up to 500 item IDs sorted by rank.

```json
[40123456, 40123321, 40122987, ...]
```

#### Fetch individual item
```
GET /item/{id}.json
```

**Response shape:**
```json
{
  "id": 40123456,
  "type": "story",
  "title": "Show HN: I built a compiler in a weekend",
  "url": "https://example.com/post",
  "score": 847,
  "by": "username",
  "time": 1719273600,
  "descendants": 312
}
```

**Field notes:**
- `time` is a Unix timestamp — convert with `new Date(item.time * 1000)`
- `url` may be absent for Ask HN / Show HN — fall back to `https://news.ycombinator.com/item?id={id}`
- `descendants` = comment count, may be 0 or absent
- `type` values: `story`, `ask`, `show`, `job`, `poll`

### Implementation pattern

```javascript
async function fetchHN() {
  // Step 1: get top story IDs
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = await res.json();

  // Step 2: fetch top 12 in parallel
  const stories = await Promise.all(
    ids.slice(0, 12).map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(r => r.json())
    )
  );

  // Step 3: map to card shape
  return stories.filter(s => s && s.title).map(s => ({
    title: s.title,
    url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
    badge: s.type === 'ask' ? 'Ask HN' : s.type === 'show' ? 'Show HN' : 'HN',
    stat: `▲ ${s.score || 0}`,
    meta: [
      `${s.descendants || 0} comments`,
      timeAgo(new Date(s.time * 1000).toISOString()),
      s.by,
    ],
  }));
}
```

### Gotchas
- Fetching 12 items = 13 HTTP requests (1 list + 12 items). Keep slice ≤ 15 to avoid slowness.
- No CORS issues — Firebase endpoint is fully open.
- No rate limits documented but don't hammer it — cache per session.

---

## 2. HN Jobs Feed

Same Firebase API, different endpoint.

### Endpoint
```
GET https://hacker-news.firebaseio.com/v0/jobstories.json
```

Returns IDs of job postings (not the monthly "Who's Hiring" thread — these are direct YC job posts).

### Implementation

```javascript
async function fetchJobs() {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json');
  const ids = await res.json();

  const jobs = await Promise.all(
    ids.slice(0, 12).map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(r => r.json())
    )
  );

  return jobs.filter(j => j && j.title).map(j => ({
    title: j.title,
    url: j.url || `https://news.ycombinator.com/item?id=${j.id}`,
    badge: 'YC Job',
    stat: timeAgo(new Date(j.time * 1000).toISOString()),
    meta: [j.by],
  }));
}
```

### Notes
- Job posts don't have `score` or `descendants` — don't try to render them
- `url` usually present for job posts (company careers page)
- Volume is lower than top stories — 20–40 active listings typically

---

## 3. DEV.to REST API

### Base URL
```
https://dev.to/api
```

No API key required for read-only endpoints. No `Authorization` header needed.

### Endpoint used

#### Top articles
```
GET /articles?top=7&per_page=12
```

**Query params:**
| Param | Value | Description |
|-------|-------|-------------|
| `top` | `1`–`365` | Articles from last N days, sorted by reactions |
| `per_page` | `1`–`30` | Number of results |
| `tag` | `javascript` | Filter by tag (optional) |
| `username` | `user` | Filter by author (optional) |

**Response shape (array):**
```json
[
  {
    "id": 1234567,
    "title": "10 TypeScript patterns you should know",
    "url": "https://dev.to/user/10-typescript-patterns",
    "published_at": "2026-06-20T10:00:00.000Z",
    "positive_reactions_count": 847,
    "reading_time_minutes": 6,
    "tag_list": ["typescript", "javascript", "webdev"],
    "user": {
      "name": "Jane Dev",
      "username": "janedev"
    }
  }
]
```

### Implementation

```javascript
async function fetchDevTo() {
  const res = await fetch('https://dev.to/api/articles?top=7&per_page=12');
  const data = await res.json();

  return data.map(a => ({
    title: a.title,
    url: a.url,
    badge: a.tag_list?.[0] || 'DEV',
    stat: `♥ ${a.positive_reactions_count || 0}`,
    meta: [
      timeAgo(a.published_at),
      a.user?.name || 'author',
      `${a.reading_time_minutes || 1} min read`,
    ],
    tags: a.tag_list?.slice(0, 4) || [],
  }));
}
```

### Tag-based fetching (for personalisation — V2)

```javascript
// Fetch by specific tags
const tags = ['javascript', 'python', 'devops'];
const results = await Promise.all(
  tags.map(tag =>
    fetch(`https://dev.to/api/articles?tag=${tag}&per_page=4&top=3`)
      .then(r => r.json())
  )
);
const merged = results.flat().sort((a, b) => b.positive_reactions_count - a.positive_reactions_count);
```

### Rate limits
- 10 requests per 10 seconds unauthenticated
- Well within limits for a single-user feed
- Cache per session to avoid hitting limits on rapid tab switches

---

## 4. GitHub Search API

### Base URL
```
https://api.github.com/search/repositories
```

No API key required. Unauthenticated limit is 10 search requests per minute, 60 requests per hour.

### Endpoint

```
GET /search/repositories?q={query}&sort=stars&order=desc&per_page=12
```

### Query strings used in DevPulse

DevPulse rotates between queries to keep the feed varied:

```javascript
const queries = [
  'stars:>1000 pushed:>2026-01-01',        // active popular repos
  'language:typescript stars:>500',          // TypeScript repos
  'topic:ai stars:>200',                     // AI-related repos
  'language:rust stars:>300 pushed:>2026-01-01', // Rust
  'topic:developer-tools stars:>100',        // devtools
];
```

**Response shape:**
```json
{
  "total_count": 48291,
  "items": [
    {
      "id": 123456789,
      "full_name": "owner/repo-name",
      "html_url": "https://github.com/owner/repo-name",
      "description": "A fast, modern tool for...",
      "stargazers_count": 12400,
      "forks_count": 892,
      "language": "TypeScript",
      "pushed_at": "2026-06-24T14:32:00Z",
      "topics": ["typescript", "cli", "developer-tools"],
      "license": { "spdx_id": "MIT" }
    }
  ]
}
```

### Implementation

```javascript
async function fetchGitHub() {
  const queries = [
    'stars:>1000 pushed:>2026-01-01',
    'language:typescript stars:>500',
    'topic:ai stars:>200',
  ];
  const q = queries[Math.floor(Math.random() * queries.length)];

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=12`
  );
  const data = await res.json();

  return (data.items || []).map(r => ({
    title: r.full_name,
    url: r.html_url,
    badge: r.language || 'GitHub',
    stat: `★ ${(r.stargazers_count || 0).toLocaleString()}`,
    meta: [
      r.license?.spdx_id || 'no license',
      timeAgo(r.pushed_at),
      `${(r.forks_count || 0).toLocaleString()} forks`,
    ],
    tags: (r.topics || []).slice(0, 4),
  }));
}
```

### Rate limit handling

```javascript
async function fetchGitHub() {
  const res = await fetch(`https://api.github.com/search/repositories?...`);

  // Check rate limit headers
  const remaining = res.headers.get('X-RateLimit-Remaining');
  const resetAt = res.headers.get('X-RateLimit-Reset');

  if (res.status === 403 || remaining === '0') {
    const resetTime = new Date(resetAt * 1000).toLocaleTimeString();
    throw new Error(`GitHub rate limit hit. Resets at ${resetTime}`);
  }

  const data = await res.json();
  return data.items || [];
}
```

### Notes
- `description` field is available but not used in V1 cards — good candidate for expanded preview
- `pushed_at` is the last commit date — better than `updated_at` for "activity" signal
- Authenticated requests raise limit to 30 searches/min — add a GitHub token in V2 if needed

---

## 5. Currents API — Tech News

### Sign up
Free tier at: `https://currentsapi.services`  
Register → get API key → 600 requests/day free.

### Base URL
```
https://api.currentsapi.services/v1
```

### Endpoint used

```
GET /latest-news?language=en&category=technology&apiKey={KEY}
```

**Query params:**
| Param | Description |
|-------|-------------|
| `language` | `en` |
| `category` | `technology`, `science`, `programming` |
| `keywords` | Comma-separated: `"developer,programming,open source"` |
| `page_size` | Max 200 |
| `apiKey` | Your free key |

**Response shape:**
```json
{
  "status": "ok",
  "news": [
    {
      "id": "abc-123",
      "title": "New version of Node.js drops with...",
      "url": "https://source.com/article",
      "author": "Jane Smith",
      "published": "2026-06-25 10:30:00 +0000",
      "category": ["technology", "programming"],
      "image": "https://source.com/image.jpg"
    }
  ]
}
```

### Implementation

```javascript
async function fetchNews() {
  const apiKey = import.meta.env.VITE_CURRENTS_API_KEY;
  const url = `https://api.currentsapi.services/v1/latest-news?language=en&category=technology&keywords=developer,programming&apiKey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  return (data.news || []).slice(0, 12).map(n => ({
    title: n.title,
    url: n.url,
    badge: n.category?.[0] || 'Tech',
    stat: timeAgo(n.published),
    meta: [n.author || 'source'],
    tags: n.category?.slice(0, 3) || [],
  }));
}
```

### Fallback if Currents API is down

Fall back to DEV.to with `tag=news`:

```javascript
async function fetchNewsWithFallback() {
  try {
    return await fetchCurrentsNews();
  } catch (e) {
    console.warn('Currents API failed, falling back to DEV.to news tag');
    const res = await fetch('https://dev.to/api/articles?tag=news&per_page=10&top=1');
    const data = await res.json();
    return data.map(a => ({
      title: a.title,
      url: a.url,
      badge: 'Tech News',
      stat: `♥ ${a.positive_reactions_count || 0}`,
      meta: [timeAgo(a.published_at), a.user?.name],
      tags: a.tag_list?.slice(0, 3) || [],
    }));
  }
}
```

---

## 6. Google Gemini API — Learn Tab

### Sign up
Free at: `https://aistudio.google.com`  
Create project → Get API key → No billing required for free tier.

### Free tier limits (as of June 2026)
- Model: `gemini-1.5-flash`
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day
- **Cost: $0**

### Base URL
```
https://generativelanguage.googleapis.com/v1beta
```

### Endpoint

```
POST /models/gemini-1.5-flash:generateContent?key={API_KEY}
```

**Request body:**
```json
{
  "contents": [
    {
      "parts": [
        { "text": "Your prompt here" }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 200
  },
  "systemInstruction": {
    "parts": [{ "text": "Your system prompt here" }]
  }
}
```

**Response shape:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "The generated tip text here..." }
        ]
      }
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 45,
    "candidatesTokenCount": 120
  }
}
```

### Implementation

```javascript
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

const TIP_TOPICS = [
  'Give one useful, lesser-known JavaScript array method with a short code example.',
  'Share one powerful Git trick most developers overlook. Show the exact command.',
  'Explain one CSS trick that solves a common layout problem with code.',
  'Name one terminal command that saves daily development time and explain it.',
  'Share one TypeScript pattern that makes code significantly safer with an example.',
  'Give one useful SQL query pattern developers often miss.',
  'Explain one useful Linux/bash shortcut for developers.',
  'Share one useful VS Code shortcut or feature most devs have never used.',
  'Give one Python tip that makes code cleaner or faster with an example.',
  'Explain one React pattern that prevents common bugs.',
];

async function callGemini(prompt) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
      systemInstruction: {
        parts: [{
          text: 'You are a senior developer sharing one concise, practical tip. Start directly with the tip. No preamble, no "Sure!", no "Great question!". Max 3 sentences. Include a short inline code snippet if relevant. Plain text only — no markdown headers.'
        }]
      }
    })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function fetchLearn() {
  // Pick 5 random topics per session
  const picks = TIP_TOPICS
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  const tips = await Promise.all(picks.map(async (prompt) => {
    const text = await callGemini(prompt);
    return {
      title: prompt.replace(/^(Give|Share|Explain|Name) one /i, '').replace(/\.$/, '').slice(0, 65) + '...',
      url: null,
      badge: 'TIL',
      stat: '2 min',
      meta: ['Gemini · AI generated'],
      preview: text,
      tags: ['devtips'],
    };
  }));

  return tips;
}
```

### Caching strategy — avoid burning free quota

```javascript
const LEARN_CACHE_KEY = 'devpulse_learn_cache';
const LEARN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchLearnWithCache() {
  const raw = localStorage.getItem(LEARN_CACHE_KEY);
  if (raw) {
    const { items, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < LEARN_CACHE_TTL) {
      return items; // serve from cache
    }
  }
  const items = await fetchLearn();
  localStorage.setItem(LEARN_CACHE_KEY, JSON.stringify({ items, timestamp: Date.now() }));
  return items;
}
```

---

## Shared Utilities

### `timeAgo(dateStr)`

```javascript
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
```

### Error boundary per tab

```javascript
async function safeFetch(fetcher, tabId) {
  try {
    return await fetcher();
  } catch (err) {
    console.error(`[DevPulse] ${tabId} fetch failed:`, err.message);
    return { error: err.message, items: [] };
  }
}
```

### Stale-while-revalidate caching

```javascript
const SESSION_CACHE = {};
const SESSION_TIMESTAMPS = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchWithCache(tabId, fetcher) {
  const now = Date.now();
  const cached = SESSION_CACHE[tabId];
  const age = now - (SESSION_TIMESTAMPS[tabId] || 0);

  if (cached && age < CACHE_TTL) {
    // Serve cached, refresh in background if > 5 min old
    if (age > 5 * 60 * 1000) {
      fetcher().then(fresh => {
        SESSION_CACHE[tabId] = fresh;
        SESSION_TIMESTAMPS[tabId] = Date.now();
      }).catch(() => {});
    }
    return cached;
  }

  const fresh = await fetcher();
  SESSION_CACHE[tabId] = fresh;
  SESSION_TIMESTAMPS[tabId] = now;
  return fresh;
}
```
