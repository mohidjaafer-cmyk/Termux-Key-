// -------- إعداد المصادر ----------
const FEEDS_EN = [
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://www.wired.com/feed/rss",
  "https://www.engadget.com/rss.xml"
];
const FEEDS_CRYPTO = [
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cointelegraph.com/rss"
];
const FEEDS_AR = [
  "https://www.alarabiya.net/ar/technology/rss.xml",
  "https://www.masrawy.com/rss/sections/tech.xml",
  "https://www.youm7.com/rss/section/53"
];

const CORS_PROXY = url => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

const newsList = document.getElementById('news-list');
const loadingEl = document.getElementById('loading');
const langSelect = document.getElementById('lang-select');
const refreshBtn = document.getElementById('refresh');
const loadMoreBtn = document.getElementById('load-more');

let articles = [];
let shown = 10;

function formatDate(d){
  if(!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch(e) { return d; }
}

async function fetchFeed(url){
  try {
    const res = await fetch(CORS_PROXY(url));
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const items = Array.from(xml.querySelectorAll("item")).map(it=>{
      return {
        title: it.querySelector("title")?.textContent?.trim() || "بدون عنوان",
        link: it.querySelector("link")?.textContent?.trim() || "#",
        pubDate: it.querySelector("pubDate")?.textContent || "",
        source: xml.querySelector("channel > title")?.textContent || url
      };
    });
    return items;
  } catch(err){
    console.warn("خطأ في جلب الخلاصة:", url, err);
    return [];
  }
}

async function loadFeedsList(list){
  const promises = list.map(u => fetchFeed(u));
  const results = await Promise.all(promises);
  return results.flat();
}

async function loadNews(){
  loadingEl.style.display = 'flex';
  newsList.style.display = 'none';
  articles = [];
  const mode = langSelect.value;
  try {
    if(mode === 'all'){
      articles = await loadFeedsList([...FEEDS_EN,...FEEDS_AR,...FEEDS_CRYPTO]);
    } else if(mode === 'ar'){
      articles = await loadFeedsList(FEEDS_AR);
    } else if(mode === 'en'){
      articles = await loadFeedsList(FEEDS_EN);
    } else if(mode === 'crypto'){
      articles = await loadFeedsList(FEEDS_CRYPTO);
    }
  } catch(e){ console.error(e); }

  articles.sort((a,b)=> new Date(b.pubDate||0) - new Date(a.pubDate||0));
  shown = Math.min(10, articles.length);
  renderArticles();
  loadingEl.style.display = 'none';
  newsList.style.display = 'grid';
}

function renderArticles(){
  newsList.innerHTML = '';
  const slice = articles.slice(0, shown);
  slice.forEach(item=>{
    const li = document.createElement('li');
    li.className = 'news-item';
    li.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                    <span class="meta">${item.source} • ${formatDate(item.pubDate)}</span>`;
    newsList.appendChild(li);
  });
  loadMoreBtn.style.display = (shown < articles.length) ? 'inline-block' : 'none';
}

loadMoreBtn.addEventListener('click', ()=>{
  shown += 10;
  renderArticles();
});

refreshBtn.addEventListener('click', loadNews);
langSelect.addEventListener('change', loadNews);

document.getElementById('subscribe-form').addEventListener('submit', e=>{
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  if(email){
    document.getElementById('subscribe-message').innerText = 'شكراً! تم إضافة بريدك (تجريبي).';
    document.getElementById('email').value = '';
  }
});

document.getElementById('year').innerText = new Date().getFullYear();
document.addEventListener('DOMContentLoaded', ()=>loadNews());
