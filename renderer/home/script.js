'use strict';

(function(){
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  const scene = document.querySelector('.scene');

  const params = new URLSearchParams(window.location.search);
  const engine = (params.get('engine') || 'google').toLowerCase();
  const engines = {
    google: { base: 'https://www.google.com/search', param: 'q', placeholder: 'Search Google or type a URL' },
    bing: { base: 'https://www.bing.com/search', param: 'q', placeholder: 'Search Bing or type a URL' },
    duckduckgo: { base: 'https://duckduckgo.com/', param: 'q', placeholder: 'Search DuckDuckGo or type a URL' },
    brave: { base: 'https://search.brave.com/search', param: 'q', placeholder: 'Search Brave or type a URL' },
    yahoo: { base: 'https://search.yahoo.com/search', param: 'p', placeholder: 'Search Yahoo or type a URL' },
    startpage: { base: 'https://www.startpage.com/sp/search', param: 'query', placeholder: 'Search Startpage or type a URL' }
  };
  const cfg = engines[engine] || engines.google;
  if (input) input.placeholder = cfg.placeholder;

  function toUrlOrEngine(q){
    const s = (q||'').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[\w-]+(\.[\w-]+)+.*$/i.test(s)) return 'https://' + s;
    const u = new URL(cfg.base);
    u.searchParams.set(cfg.param, s);
    return u.toString();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = toUrlOrEngine(input.value);
    if (url) window.location.href = url;
  });

  // little focus animation kick-in
  setTimeout(() => {
    input && input.focus();
    scene && scene.classList.add('ready');
  }, 150);
})();
