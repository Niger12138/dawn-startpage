(function(){
  'use strict';

  var LS = {
    sites:'startpage.sites.v3',
    todo:'startpage.todo.v3',
    note:'startpage.note.v3',
    city:'startpage.city.v3',
    theme:'startpage.theme.v3'
  };
  function load(key, fallback){
    try{
      var s = window.localStorage.getItem(key);
      if (s === null) return fallback;
      var v = JSON.parse(s);
      return (v === null || v === undefined) ? fallback : v;
    }catch(e){ return fallback; }
  }
  function save(key, val){
    try{ window.localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  /* 站点图标 → CSS 类名 */
  var ICONKEYS = {
    'zhihu.com':'i-zhihu',
    'weibo.com':'i-weibo',
    'bilibili.com':'i-bilibili',
    'xiaohongshu.com':'i-xiaohongshu',
    'douban.com':'i-douban',
    'taobao.com':'i-taobao',
    'jd.com':'i-jd',
    'feishu.cn':'i-feishu',
    'github.com':'i-github',
    'music.163.com':'i-music163',
    'juejin.cn':'i-juejin',
    'sspai.com':'i-sspai'
  };

  function hostOf(u){
    var m = String(u || '').match(/^(?:https?:\/\/)?([^\/?#:]+)/i);
    if (!m) return '';
    return m[1].toLowerCase().replace(/^www\./, '');
  }
  function iconKeyOf(u){
    var h = hostOf(u);
    if (!h) return '';
    if (ICONKEYS[h]) return ICONKEYS[h];
    var parts = h.split('.');
    while (parts.length > 2){
      parts.shift();
      var k = parts.join('.');
      if (ICONKEYS[k]) return ICONKEYS[k];
    }
    return '';
  }

  function toRgb(hex){
    var h = String(hex || '').replace('#','');
    if (h.length === 3) h = h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = '3B62F6';
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function shade(hex, f){
    var r = toRgb(hex);
    var o = r.map(function(v){ return Math.max(0, Math.min(255, Math.round(v * f))); });
    return 'rgb(' + o[0] + ',' + o[1] + ',' + o[2] + ')';
  }
  function lighten(hex, f){
    var r = toRgb(hex);
    var o = r.map(function(v){ return Math.max(0, Math.min(255, Math.round(v + (255 - v) * f))); });
    return 'rgb(' + o[0] + ',' + o[1] + ',' + o[2] + ')';
  }

  var DEFAULTS = [
    {n:'知乎',   u:'https://www.zhihu.com'},
    {n:'微博',   u:'https://weibo.com'},
    {n:'B站',    u:'https://www.bilibili.com'},
    {n:'小红书', u:'https://www.xiaohongshu.com'},
    {n:'豆瓣',   u:'https://www.douban.com'},
    {n:'淘宝',   u:'https://www.taobao.com'},
    {n:'京东',   u:'https://www.jd.com'},
    {n:'飞书',   u:'https://www.feishu.cn'},
    {n:'GitHub', u:'https://github.com'},
    {n:'网易云', u:'https://music.163.com'},
    {n:'掘金',   u:'https://juejin.cn'},
    {n:'少数派', u:'https://sspai.com'}
  ];
  var FALLBACK_COLORS = ['#3B62F6','#2E8B57','#B0722F','#12564E','#8A4FA0','#C4141F','#3A6E8F','#8A6A3B'];

  var sites = load(LS.sites, DEFAULTS.slice());
  if (!Array.isArray(sites) || !sites.length) sites = DEFAULTS.slice();
  var editing = false;

  var grid = document.getElementById('grid');
  var editBtn = document.getElementById('editBtn');
  var addBtn = document.getElementById('addBtn');

  function monoOf(s){
    var nm = String(s.n || '').trim();
    if (!nm) return '·';
    var m = nm.slice(0,1);
    if (/^[a-z]$/.test(m)) m = m.toUpperCase();
    return m;
  }

  function applyIcon(tile, s){
    var key = iconKeyOf(s.u);
    var g = document.createElement('span');
    g.className = 'glyph' + (key ? ' ' + key : '');
    if (!key) g.appendChild(monoNode(s));
    tile.appendChild(g);
  }
  function monoNode(s){
    var m = document.createElement('span');
    m.className = 'mono';
    m.textContent = monoOf(s);
    var c = s.c || FALLBACK_COLORS[0];
    m.style.background = 'rgba(' + toRgb(c).join(',') + ',.16)';
    m.style.color = lighten(c, .2);
    return m;
  }

  function renderSites(){
    grid.innerHTML = '';
    sites.forEach(function(s, i){
      var cell, tile, nm;

      if (editing){
        cell = document.createElement('div');
        cell.className = 'cell';
        tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tile';
        tile.setAttribute('aria-label', '编辑站点：' + s.n);
        applyIcon(tile, s);
        tile.addEventListener('click', function(){ openEditor(i); });
        nm = document.createElement('span');
        nm.className = 'name';
        nm.textContent = s.n;
        cell.appendChild(tile);
        cell.appendChild(nm);
      } else {
        cell = document.createElement('a');
        cell.className = 'cell';
        cell.href = s.u;
        cell.target = '_blank';
        cell.rel = 'noopener noreferrer';
        cell.setAttribute('aria-label', s.n + '（新标签页打开）');

        tile = document.createElement('span');
        tile.className = 'tile';
        tile.setAttribute('aria-hidden', 'true');
        applyIcon(tile, s);

        nm = document.createElement('span');
        nm.className = 'name';
        nm.textContent = s.n;

        cell.appendChild(tile);
        cell.appendChild(nm);
      }
      grid.appendChild(cell);
    });

    if (!sites.length){
      var hint = document.createElement('p');
      hint.className = 'empty-hint';
      hint.textContent = '还没有站点，点「编辑」添加。';
      grid.appendChild(hint);
    }
  }

  /* ---------- 编辑 ---------- */
  var mask = document.getElementById('mask');
  var panelTitle = document.getElementById('panelTitle');
  var fName = document.getElementById('fName');
  var fUrl = document.getElementById('fUrl');
  var fCancel = document.getElementById('fCancel');
  var fSave = document.getElementById('fSave');
  var fDel = document.getElementById('fDel');
  var editIndex = -1;

  function openEditor(i){
    editIndex = (typeof i === 'number') ? i : -1;
    var s = editIndex >= 0 ? sites[editIndex] : {n:'', u:''};
    panelTitle.textContent = editIndex >= 0 ? '编辑站点' : '添加站点';
    fName.value = s.n || '';
    fUrl.value = s.u || '';
    fDel.hidden = !(editIndex >= 0);
    mask.hidden = false;
    window.setTimeout(function(){ fName.focus(); }, 30);
  }
  function closeEditor(){
    mask.hidden = true;
    editIndex = -1;
    editBtn.focus();
  }

  fCancel.addEventListener('click', closeEditor);
  mask.addEventListener('click', function(ev){ if (ev.target === mask) closeEditor(); });
  document.addEventListener('keydown', function(ev){
    if (ev.key === 'Escape' && !mask.hidden) closeEditor();
  });

  fDel.addEventListener('click', function(){
    if (editIndex < 0) return;
    sites.splice(editIndex, 1);
    save(LS.sites, sites);
    renderSites();
    mask.hidden = true;
    editIndex = -1;
    editBtn.focus();
  });

  fName.addEventListener('keydown', function(ev){ if (ev.key === 'Enter'){ ev.preventDefault(); fSave.click(); } });
  fUrl.addEventListener('keydown', function(ev){ if (ev.key === 'Enter'){ ev.preventDefault(); fSave.click(); } });

  fSave.addEventListener('click', function(){
    var name = fName.value.trim().slice(0, 10);
    var url = fUrl.value.trim();
    if (!url){ fUrl.focus(); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
    if (!name) name = hostOf(url).replace(/^www\./, '') || '站点';
    if (editIndex >= 0 && sites[editIndex]){
      sites[editIndex].n = name;
      sites[editIndex].u = url;
      delete sites[editIndex].m;
    } else {
      sites.push({n:name, u:url, c:FALLBACK_COLORS[sites.length % FALLBACK_COLORS.length]});
    }
    save(LS.sites, sites);
    renderSites();
    mask.hidden = true;
    editIndex = -1;
    editBtn.focus();
  });

  editBtn.addEventListener('click', function(){
    editing = !editing;
    editBtn.textContent = editing ? '完成' : '编辑';
    addBtn.hidden = !editing;
    renderSites();
  });
  addBtn.addEventListener('click', function(){ openEditor(-1); });

  /* ---------- 主题 ---------- */
  var THEMES = {dawn:'晨雾', sakura:'樱', night:'夜幕', terminal:'终端'};
  var THEME_COLOR = {dawn:'#EAF0FA', sakura:'#FDF0F0', night:'#080B16', terminal:'#060907'};
  var themeName = document.getElementById('themeName');
  var swButtons = Array.prototype.slice.call(document.querySelectorAll('.sw'));

  function applyTheme(t, persist){
    if (!THEMES[t]) t = 'dawn';
    document.documentElement.setAttribute('data-theme', t);
    themeName.textContent = THEMES[t];
    swButtons.forEach(function(b){
      b.setAttribute('aria-pressed', b.getAttribute('data-theme') === t ? 'true' : 'false');
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[t]);
    if (persist) save(LS.theme, t);
  }
  swButtons.forEach(function(b){
    b.addEventListener('click', function(){ applyTheme(b.getAttribute('data-theme'), true); });
  });

  /* ---------- 时间 ---------- */
  var clockEl = document.getElementById('clock');
  var secEl = document.getElementById('sec');
  var dateEl = document.getElementById('date');
  var WD = ['日','一','二','三','四','五','六'];
  function pad2(n){ return n < 10 ? '0' + n : String(n); }
  function tick(){
    var d = new Date();
    var text = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    if (clockEl.textContent !== text) clockEl.textContent = text;
    var sec = pad2(d.getSeconds());
    if (secEl.textContent !== sec) secEl.textContent = sec;
    dateEl.textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + WD[d.getDay()];
  }
  tick();
  window.setInterval(tick, 1000);

  /* ---------- 天气 ---------- */
  var wIcon = document.getElementById('wIcon');
  var wTemp = document.getElementById('wTemp');
  var wDesc = document.getElementById('wDesc');
  var wRange = document.getElementById('wRange');
  var citySlot = document.getElementById('citySlot');
  var city = load(LS.city, '淮北');
  if (typeof city !== 'string' || !city.trim()) city = '淮北';

  var F = 'fill="currentColor"';
  var WICON = {
    sun:   '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--accent)"><circle cx="12" cy="12" r="4.4" '+F+'/><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6"/></g></svg>',
    partly:'<svg viewBox="0 0 24 24" aria-hidden="true"><g style="color:var(--accent)"><circle cx="15.6" cy="8" r="3" '+F+'/></g><g style="color:var(--ink-2)"><circle cx="8.6" cy="14.2" r="3.3" '+F+'/><circle cx="13" cy="12.8" r="4.1" '+F+'/><circle cx="16.8" cy="15.1" r="2.7" '+F+'/><rect x="5.6" y="14.9" width="12.8" height="3.3" rx="1.6" '+F+'/></g></svg>',
    cloud: '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--ink-2)"><circle cx="8.6" cy="14.2" r="3.3" '+F+'/><circle cx="13" cy="12.8" r="4.1" '+F+'/><circle cx="16.8" cy="15.1" r="2.7" '+F+'/><rect x="5.6" y="14.9" width="12.8" height="3.3" rx="1.6" '+F+'/></svg>',
    rain:  '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--accent)"><circle cx="8.8" cy="11.4" r="3.1" '+F+'/><circle cx="13" cy="10" r="3.9" '+F+'/><circle cx="16.6" cy="12.4" r="2.5" '+F+'/><rect x="5.8" y="12.2" width="12.4" height="3.1" rx="1.5" '+F+'/><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8.6 17.4l-1 2.5M12 17.4l-1 2.5M15.4 17.4l-1 2.5"/></g></svg>',
    snow:  '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--accent)"><circle cx="8.8" cy="11.4" r="3.1" '+F+'/><circle cx="13" cy="10" r="3.9" '+F+'/><circle cx="16.6" cy="12.4" r="2.5" '+F+'/><rect x="5.8" y="12.2" width="12.4" height="3.1" rx="1.5" '+F+'/><g fill="currentColor"><circle cx="8.8" cy="18.4" r="1.05"/><circle cx="12.1" cy="19.8" r="1.05"/><circle cx="15.4" cy="18.4" r="1.05"/></g></svg>',
    mist:  '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--ink-2)"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 9.5h14M4 13h16M6 16.5h12"/></g></svg>'
  };

  function codeInfo(code){
    if (code === 0) return {t:'晴', k:'sun'};
    if (code === 1) return {t:'晴间多云', k:'partly'};
    if (code === 2) return {t:'多云', k:'cloud'};
    if (code === 3) return {t:'阴', k:'cloud'};
    if (code === 45 || code === 48) return {t:'雾', k:'mist'};
    if (code >= 51 && code <= 57) return {t:'毛毛雨', k:'rain'};
    if (code >= 61 && code <= 67) return {t:'雨', k:'rain'};
    if (code >= 71 && code <= 77) return {t:'雪', k:'snow'};
    if (code >= 80 && code <= 82) return {t:'阵雨', k:'rain'};
    if (code === 85 || code === 86) return {t:'阵雪', k:'snow'};
    if (code >= 95) return {t:'雷雨', k:'rain'};
    return {t:'—', k:'cloud'};
  }

  function renderCity(){
    citySlot.innerHTML = '';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'city';
    btn.textContent = city;
    btn.title = '设置城市';
    btn.setAttribute('aria-label', '设置城市，当前为' + city);
    btn.addEventListener('click', editCity);
    citySlot.appendChild(btn);
  }
  function editCity(){
    citySlot.innerHTML = '';
    var inp = document.createElement('input');
    inp.className = 'city-input';
    inp.type = 'text';
    inp.value = city;
    inp.maxLength = 16;
    inp.setAttribute('aria-label', '城市名');
    inp.placeholder = '城市名';
    citySlot.appendChild(inp);
    inp.focus();
    inp.select();

    var settled = false;
    function finish(accept){
      if (settled) return;
      settled = true;
      var v = inp.value.trim();
      if (accept && v){ city = v.slice(0, 16); save(LS.city, city); }
      renderCity();
      loadWeather();
    }
    inp.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter'){ ev.preventDefault(); finish(true); }
      else if (ev.key === 'Escape'){ ev.preventDefault(); finish(false); }
    });
    inp.addEventListener('blur', function(){ finish(true); });
  }

  function weatherFail(msg){
    wTemp.textContent = '—';
    wIcon.innerHTML = WICON.cloud;
    wDesc.textContent = msg;
    wRange.textContent = '';
  }

  function loadWeather(){
    renderCity();
    wDesc.textContent = '读取天气…';
    wRange.textContent = '';
    if (typeof window.fetch !== 'function'){ weatherFail('不支持联网天气'); return; }

    var geoUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(city) + '&count=1&language=zh&format=json';

    window.fetch(geoUrl).then(function(r){
      if (!r.ok) throw new Error('geo');
      return r.json();
    }).then(function(g){
      if (!g || !g.results || !g.results.length) throw new Error('nocity');
      var place = g.results[0];
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude +
        '&longitude=' + place.longitude +
        '&current=temperature_2m,weather_code' +
        '&daily=temperature_2m_max,temperature_2m_min' +
        '&timezone=auto&forecast_days=1';
      return window.fetch(url).then(function(r2){
        if (!r2.ok) throw new Error('forecast');
        return r2.json();
      }).then(function(w){
        var cur = w && w.current;
        var daily = w && w.daily;
        if (!cur || typeof cur.temperature_2m !== 'number') throw new Error('nodata');
        var info = codeInfo(cur.weather_code);
        wTemp.textContent = Math.round(cur.temperature_2m) + '°';
        wIcon.innerHTML = WICON[info.k] || WICON.cloud;
        wDesc.textContent = info.t;
        var hi = '', lo = '';
        if (daily && daily.temperature_2m_max && daily.temperature_2m_min){
          hi = Math.round(daily.temperature_2m_max[0]);
          lo = Math.round(daily.temperature_2m_min[0]);
        }
        wRange.textContent = (hi !== '' && lo !== '') ? ('· 高' + hi + '° 低' + lo + '°') : '';
      });
    }).catch(function(){ weatherFail('天气暂不可用'); });
  }

  /* ---------- 待办 ---------- */
  var todos = load(LS.todo, []);
  if (!Array.isArray(todos)) todos = [];
  var todoForm = document.getElementById('todoForm');
  var todoInput = document.getElementById('todoInput');
  var todoList = document.getElementById('todoList');
  var todoCount = document.getElementById('todoCount');

  function renderTodos(){
    todoList.innerHTML = '';
    if (!todos.length){
      var li0 = document.createElement('li');
      li0.className = 'empty';
      li0.textContent = '还没有待办';
      todoList.appendChild(li0);
    }
    todos.forEach(function(t, i){
      var li = document.createElement('li');
      li.className = 'todo-item' + (t.done ? ' done' : '');

      var chk = document.createElement('button');
      chk.type = 'button';
      chk.className = 'chk';
      chk.setAttribute('aria-pressed', t.done ? 'true' : 'false');
      chk.setAttribute('aria-label', (t.done ? '标记为未完成：' : '标记完成：') + t.text);
      chk.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.4l3.1 3.1L13 4.6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

      var txt = document.createElement('span');
      txt.className = 'todo-text';
      txt.textContent = t.text;

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'todo-del';
      del.setAttribute('aria-label', '删除：' + t.text);
      del.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 2.2l7.6 7.6M9.8 2.2l-7.6 7.6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

      li.appendChild(chk); li.appendChild(txt); li.appendChild(del);

      li.addEventListener('click', function(ev){
        if (ev.target.closest('.todo-del')) return;
        todos[i].done = !todos[i].done;
        save(LS.todo, todos);
        renderTodos();
      });
      del.addEventListener('click', function(ev){
        ev.stopPropagation();
        todos.splice(i, 1);
        save(LS.todo, todos);
        renderTodos();
      });

      todoList.appendChild(li);
    });
    var done = todos.filter(function(t){ return t.done; }).length;
    todoCount.textContent = todos.length ? (done + ' / ' + todos.length) : '';
  }

  todoForm.addEventListener('submit', function(ev){
    ev.preventDefault();
    var v = todoInput.value.trim();
    if (!v){ todoInput.focus(); return; }
    todos.push({text: v.slice(0, 60), done: false});
    save(LS.todo, todos);
    todoInput.value = '';
    renderTodos();
  });

  /* ---------- 便签 ---------- */
  var note = document.getElementById('note');
  var noteHint = document.getElementById('noteHint');
  var savedNote = load(LS.note, '');
  note.value = typeof savedNote === 'string' ? savedNote : '';
  var noteTimer = null, hintTimer = null;
  note.addEventListener('input', function(){
    if (noteTimer) window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(function(){
      save(LS.note, note.value);
      noteHint.textContent = '已保存';
      if (hintTimer) window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(function(){ noteHint.textContent = ''; }, 1600);
    }, 450);
  });

  /* ---------- 搜索 ---------- */
  var ENGINES = [
    {label:'必应', mark:'必', url:'https://www.bing.com/search?q='},
    {label:'百度', mark:'度', url:'https://www.baidu.com/s?wd='},
    {label:'Google', mark:'G', url:'https://www.google.com/search?q='}
  ];
  var eIdx = 0;
  var form = document.getElementById('find');
  var input = document.getElementById('q');
  var sw = document.getElementById('switch');
  var nameEl = document.getElementById('stampName');

  function paintEngine(){
    var e = ENGINES[eIdx];
    sw.textContent = e.mark;
    nameEl.textContent = e.label;
    sw.setAttribute('aria-label', '切换搜索引擎，当前为' + e.label);
    sw.title = '当前：' + e.label + '，点击切换';
  }
  sw.addEventListener('click', function(){
    eIdx = (eIdx + 1) % ENGINES.length;
    paintEngine();
    sw.classList.add('turn');
    window.setTimeout(function(){ sw.classList.remove('turn'); }, 520);
    input.focus();
  });

  function looksLikeUrl(s){
    if (!s || /\s/.test(s)) return false;
    if (/^(https?:\/\/|www\.)/i.test(s)) return true;
    if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?([\/?#]\S*)?$/.test(s)) return true;
    if (/^localhost(:\d+)?([\/?#]\S*)?$/i.test(s)) return true;
    return /^([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i.test(s);
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var raw = input.value.trim();
    if (!raw){ input.focus(); return; }
    if (looksLikeUrl(raw)){
      window.location.href = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw.replace(/^\/+/, '');
    } else {
      window.location.href = ENGINES[eIdx].url + encodeURIComponent(raw);
    }
  });

  /* ---------- 启动 ---------- */
  applyTheme(document.documentElement.getAttribute('data-theme') || 'dawn', false);
  renderSites();
  renderTodos();
  paintEngine();
  loadWeather();
})();
