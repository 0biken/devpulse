const generateMockData = (tabId) => {
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `${tabId}-${i}`,
    title: `Mock ${tabId.toUpperCase()} Title ${i + 1}`,
    url: `https://example.com/${tabId}/${i}`,
    badge: tabId,
    stat: tabId === 'github' ? `★ ${Math.floor(Math.random() * 10000)}` : `▲ ${Math.floor(Math.random() * 500)}`,
    meta: ['100 comments', '2h ago', 'user123'],
    tags: [tabId, 'mock', 'data']
  }));
};

export async function fetchTab(tabId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockData(tabId));
    }, 600); // simulate network delay
  });
}
