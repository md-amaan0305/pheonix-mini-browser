'use strict';

(function(){
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');

  function toUrlOrGoogle(q){
    const s = (q||'').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[\w-]+(\.[\w-]+)+.*$/i.test(s)) return 'https://' + s;
    return 'https://www.google.com/search?q=' + encodeURIComponent(s);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = toUrlOrGoogle(input.value);
    if (url) window.location.href = url;
  });

  // little focus animation kick-in
  setTimeout(() => input && input.focus(), 200);
})();
