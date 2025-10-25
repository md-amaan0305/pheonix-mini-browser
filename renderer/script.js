'use strict';

// Helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Local animated home page (file://.../renderer/home/index.html)
const defaultHome = new URL('./home/index.html', window.location.href).toString();
function getSelectedEngine(){
  return sessionStorage.getItem('mb:engine') || null;
}
function setSelectedEngine(engine){
  sessionStorage.setItem('mb:engine', engine);
}
function getHomeUrl(){
  const engine = getSelectedEngine() || 'google';
  const u = new URL(defaultHome);
  u.searchParams.set('engine', engine);
  return u.toString();
}
const appName = 'Pheonix Browser';

const state = {
  tabs: [], // { id, title, url, webview }
  activeId: null
};

// Theme handling
function getTheme(){
  return localStorage.getItem('mb:theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}
function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mb:theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon){
    // Simple icon swap: filled circle for dark, hollow for light
    icon.innerHTML = theme === 'dark'
      ? '<path d="M12 4a8 8 0 018 8 8 8 0 11-8-8z" fill="currentColor"/>'
      : '<path d="M12 3a9 9 0 100 18 9 9 0 010-18z" fill="none" stroke="currentColor" stroke-width="2"/>';
  }
}
function toggleTheme(){ setTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

function toUrl(input){
  const trimmed = input.trim();
  if (!trimmed) return defaultHome;
  // If it looks like a URL with protocol
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If it looks like a domain
  if (/^[\w-]+(\.[\w-]+)+.*$/i.test(trimmed)) return 'https://' + trimmed;
  // Otherwise, treat as search query
  const q = encodeURIComponent(trimmed);
  return `https://www.google.com/search?q=${q}`;
}

function saveBookmarks(list){ localStorage.setItem('mb:bookmarks', JSON.stringify(list)); }
function loadBookmarks(){ try{ return JSON.parse(localStorage.getItem('mb:bookmarks')||'[]'); }catch{ return []; } }
function isBookmarked(url){ return loadBookmarks().some(b => b.url === url); }
function toggleBookmark(current){
  const list = loadBookmarks();
  const idx = list.findIndex(b => b.url === current.url);
  if (idx >= 0){ list.splice(idx,1); } else { list.push({ title: current.title || current.url, url: current.url }); }
  saveBookmarks(list); renderBookmarks(); updateBookmarkIcon();
}

function renderBookmarks(){
  const list = loadBookmarks();
  const ul = $('#bookmarksList');
  ul.innerHTML = '';
  list.forEach(b => {
    const li = document.createElement('li');
    li.className = 'bookmark-item';
    li.innerHTML = `<div class="title">${escapeHtml(b.title)}</div><div class="url">${escapeHtml(b.url)}</div>`;
    li.addEventListener('click', () => navigateActive(b.url));
    ul.appendChild(li);
  });
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function updateBookmarkIcon(){
  const star = $('#starIcon');
  const current = getActiveTab();
  if (!current) return;
  const on = isBookmarked(current.url);
  star.style.color = on ? '#ffd166' : '#99a3ad';
}

function setLoading(active){
  const bar = $('#loadingBar');
  if (active){
    bar.style.opacity = '1';
    bar.style.width = '8%';
    // Simulated progress
    let w = 8;
    bar._timer && clearInterval(bar._timer);
    bar._timer = setInterval(() => {
      w = Math.min(w + Math.random()*10, 90);
      bar.style.width = w + '%';
    }, 150);
  } else {
    bar._timer && clearInterval(bar._timer);
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; bar.style.width = '0%'; }, 250);
  }
}

function createTab(url){
  const id = 't' + Math.random().toString(36).slice(2);

  const webview = document.createElement('webview');
  webview.setAttribute('src', url || getHomeUrl());
  webview.setAttribute('partition', 'persist:main');
  webview.setAttribute('allowpopups', '');
  webview.addEventListener('did-start-loading', () => setLoading(true));
  webview.addEventListener('did-stop-loading', () => setLoading(false));
  webview.addEventListener('did-fail-load', () => setLoading(false));
  webview.addEventListener('page-title-updated', (e) => updateTabTitle(id, e.title));
  webview.addEventListener('did-navigate-in-page', (e) => updateAddressAndTitle(id, e.url));
  webview.addEventListener('did-navigate', (e) => updateAddressAndTitle(id, e.url));

  $('#webviews').appendChild(webview);

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = `
    <span class="tab-title">New Tab</span>
    <span class="tab-close" title="Close">
      <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </span>
  `;
  tabEl.addEventListener('click', (e) => {
    if ((e.target.closest && e.target.closest('.tab-close'))){
      closeTab(id);
      e.stopPropagation();
    } else {
      setActiveTab(id);
    }
  });
  $('#tabsContainer').appendChild(tabEl);

  const tab = { id, title: 'New Tab', url: url || defaultHome, webview };
  state.tabs.push(tab);
  setActiveTab(id);

  return id;
}

function updateTabTitle(id, title){
  const tab = state.tabs.find(t => t.id === id);
  if (!tab) return;
  tab.title = title || 'New Tab';
  const el = $(`.tab[data-id="${id}"] .tab-title`);
  if (el) el.textContent = tab.title;
  if (state.activeId === id){
    document.title = `${tab.title} - ${appName}`;
  }
}

function updateAddressAndTitle(id, url){
  const tab = state.tabs.find(t => t.id === id);
  if (!tab) return;
  tab.url = url;
  if (state.activeId === id){
    const isHome = (url||'').startsWith(defaultHome);
    $('#addressBar').value = isHome ? '' : url;
    updateBookmarkIcon();
    const t = state.tabs.find(t => t.id === id);
    document.title = `${(t && t.title) || 'New Tab'} - ${appName}`;
  }
}

function setActiveTab(id){
  if (state.activeId === id) return;
  state.activeId = id;
  $$('.tab').forEach(el => el.classList.toggle('active', el.dataset.id === id));
  $$('#webviews webview').forEach((wv, i) => {
    const show = state.tabs[i] && state.tabs[i].id === id;
    wv.classList.toggle('active', !!show);
    wv.style.pointerEvents = show ? 'auto' : 'none';
  });
  const tab = getActiveTab();
  if (tab){
    const isHome = (tab.url||'').startsWith(defaultHome);
    $('#addressBar').value = isHome ? '' : tab.url;
    updateBookmarkIcon();
  }
}

function getActiveTab(){ return state.tabs.find(t => t.id === state.activeId); }

function closeTab(id){
  const idx = state.tabs.findIndex(t => t.id === id);
  if (idx === -1) return;

  // Remove elements
  const tabEl = $(`.tab[data-id="${id}"]`);
  tabEl && tabEl.remove();
  const wv = state.tabs[idx].webview;
  if (wv) wv.remove();

  state.tabs.splice(idx,1);

  if (state.tabs.length === 0){
    createTab(getHomeUrl());
  } else {
    const next = state.tabs[Math.max(0, idx - 1)];
    setActiveTab(next.id);
  }
}

function navigateActive(raw){
  const tab = getActiveTab();
  if (!tab) return;
  const url = toUrl(raw);
  tab.webview.loadURL(url);
}

function goBack(){ const t = getActiveTab(); if (t && t.webview.canGoBack()) t.webview.goBack(); }
function goForward(){ const t = getActiveTab(); if (t && t.webview.canGoForward()) t.webview.goForward(); }
function reload(){ const t = getActiveTab(); if (t) t.webview.reload(); }

function bindUI(){
  $('#btnNewTab').addEventListener('click', () => createTab(getHomeUrl()));
  $('#btnBack').addEventListener('click', goBack);
  $('#btnForward').addEventListener('click', goForward);
  $('#btnReload').addEventListener('click', reload);
  $('#btnGoogle').addEventListener('click', () => navigateActive('https://www.google.com'));
  const themeBtn = $('#btnTheme');
  if (themeBtn){ themeBtn.addEventListener('click', toggleTheme); }

  const address = $('#addressBar');
  address.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateActive(address.value);
  });

  const btnBookmark = $('#btnBookmark');
  btnBookmark.addEventListener('click', () => {
    const current = getActiveTab();
    if (current) toggleBookmark({ url: current.url, title: current.title });
  });

  // Toggle bookmarks panel on right-click of star (or Shift+click)
  btnBookmark.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    $('#bookmarksPanel').classList.toggle('hidden');
  });
  btnBookmark.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.shiftKey) { // middle click or shift
      $('#bookmarksPanel').classList.toggle('hidden');
    }
  });

  $('#btnClearBookmarks').addEventListener('click', () => {
    saveBookmarks([]); renderBookmarks(); updateBookmarkIcon();
  });

  // Hide bookmarks panel when clicking outside
  document.addEventListener('click', (e) => {
    const panel = $('#bookmarksPanel');
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== $('#btnBookmark')){
      panel.classList.add('hidden');
    }
  });

  // Keyboard shortcuts fallback (works when webview isn't focused)
  window.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 't'){ e.preventDefault(); createTab(defaultHome); }
    if (ctrl && e.key.toLowerCase() === 'w'){ e.preventDefault(); closeTab(state.activeId); }
  });

  // IPC from main menu (reliable even when webview focused)
  const api = window.electronAPI || {};
  api.onNewTab && api.onNewTab(() => createTab(getHomeUrl()));
  api.onCloseTab && api.onCloseTab(() => closeTab(state.activeId));
  api.onNavBack && api.onNavBack(goBack);
  api.onNavForward && api.onNavForward(goForward);
  api.onNavReload && api.onNavReload(reload);
  api.onFocusAddress && api.onFocusAddress(() => { $('#addressBar').focus(); $('#addressBar').select(); });
}

function showEnginePickerThenStart(){
  const overlay = document.getElementById('engineOverlay');
  const pick = (engine) => {
    setSelectedEngine(engine);
    overlay.classList.add('hidden');
    // Small deferred open for fade effect
    setTimeout(() => {
      createTab(getHomeUrl());
    }, 120);
  };

  overlay.classList.remove('hidden');
  $$('.engine-btn', overlay).forEach(btn => btn.addEventListener('click', () => pick(btn.dataset.engine)));
}

function boot(){
  bindUI();
  renderBookmarks();
  // Apply saved theme
  setTheme(getTheme());
  const engine = getSelectedEngine();
  if (engine){
    createTab(getHomeUrl());
  } else {
    showEnginePickerThenStart();
  }
  document.title = `New Tab - ${appName}`;
}

document.addEventListener('DOMContentLoaded', boot);
