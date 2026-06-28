import { timeAgo } from '../utils/timeAgo';

// Generate mock Tech Tips
const generateTechTips = () => {
  const tips = [
    "Use CSS 'content-visibility: auto' to skip rendering off-screen elements and boost performance.",
    "In React, wrap expensive functional component calculations in 'useMemo' to prevent unnecessary recalculations.",
    "Git Tip: Use 'git commit --amend' to fix the last commit message instead of creating a new one.",
    "When using Tailwind CSS, use '@apply' sparingly to keep your utility-first approach scalable.",
    "Vite tip: Add 'splitVendorChunkPlugin()' to separate vendor dependencies and improve caching.",
    "JavaScript Tip: Use 'Promise.allSettled' instead of 'Promise.all' when you don't want one rejection to fail everything.",
    "Use 'console.table()' to format an array of objects into a clean, readable table in your browser devtools.",
    "Accessibility: Always provide 'alt' attributes for images, even if empty (alt=\"\"), to help screen readers."
  ];

  return tips.map((tip, i) => ({
    id: `tip-${i}`,
    title: tip,
    badge: 'Tech Tip',
    stat: '💡',
    meta: ['Gemini AI'],
    tags: ['tip', 'productivity', 'learning']
  }));
};

async function fetchHN() {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  if (!res.ok) throw new Error('Failed to fetch Hacker News');
  const ids = await res.json();
  const top = ids.slice(0, 12);
  const stories = await Promise.all(
    top.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
  );
  return stories.filter(s => s && s.title).map(s => ({
    id: `hn-${s.id}`,
    title: s.title,
    url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
    badge: s.type === 'ask' ? 'Ask HN' : s.type === 'show' ? 'Show HN' : 'HN',
    stat: `▲ ${s.score || 0}`,
    meta: [`${s.descendants || 0} comments`, timeAgo(new Date(s.time * 1000).toISOString()), s.by],
    tags: []
  }));
}

async function fetchDevTo() {
  const res = await fetch('https://dev.to/api/articles?top=7&per_page=12');
  if (!res.ok) throw new Error('Failed to fetch DEV.to');
  const data = await res.json();
  return data.map(a => ({
    id: `devto-${a.id}`,
    title: a.title,
    url: a.url,
    badge: a.tag_list?.[0] || 'DEV',
    stat: `♥ ${a.positive_reactions_count || 0}`,
    meta: [timeAgo(a.published_at), a.user?.name || 'author', `${a.reading_time_minutes || 1} min read`],
    tags: a.tag_list?.slice(0, 4) || []
  }));
}

async function fetchGitHub() {
  const queries = [
    'stars:>1000 pushed:>2026-01-01',
    'language:typescript stars:>500',
    'topic:ai stars:>200',
    'language:rust stars:>300 pushed:>2026-01-01',
    'topic:developer-tools stars:>100'
  ];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=12`);
  if (!res.ok) {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    if (remaining === '0') throw new Error('GitHub rate limit hit. Try again later.');
    throw new Error('Failed to fetch GitHub');
  }
  const data = await res.json();
  return (data.items || []).map(r => ({
    id: `gh-${r.id}`,
    title: r.full_name,
    description: r.description,
    url: r.html_url,
    badge: r.language || 'GitHub',
    stat: `★ ${(r.stargazers_count || 0).toLocaleString()}`,
    meta: [r.license?.spdx_id || 'no license', timeAgo(r.pushed_at), `${(r.forks_count || 0).toLocaleString()} forks`],
    tags: (r.topics || []).slice(0, 4)
  }));
}

async function fetchJobs() {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json');
  if (!res.ok) throw new Error('Failed to fetch Jobs');
  const ids = await res.json();
  const top = ids.slice(0, 12);
  const jobs = await Promise.all(
    top.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
  );
  return jobs.filter(j => j && j.title).map(j => ({
    id: `job-${j.id}`,
    title: j.title,
    url: j.url || `https://news.ycombinator.com/item?id=${j.id}`,
    badge: 'YC Job',
    stat: timeAgo(new Date(j.time * 1000).toISOString()),
    meta: [j.by],
    tags: []
  }));
}

export async function fetchTab(tabId) {
  try {
    switch (tabId) {
      case 'hn': return await fetchHN();
      case 'devto': return await fetchDevTo();
      case 'github': return await fetchGitHub();
      case 'jobs': return await fetchJobs();
      case 'techtips':
        // Return hardcoded tips until Gemini API is connected
        return await new Promise(resolve => setTimeout(() => resolve(generateTechTips()), 400));
      default:
        throw new Error(`Unknown tab ID: ${tabId}`);
    }
  } catch (error) {
    console.error(`[DevPulse] Error fetching ${tabId}:`, error);
    throw error;
  }
}
