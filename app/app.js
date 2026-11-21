/* Leonida Platinum Log — tracker logic.
   Plain script, no modules, no network beyond the guide's own data file.
   Progress shape in localStorage:
     { earned: { "12": true }, counts: { "15": 37 }, shield: bool, hideDone: bool } */
(function () {
  'use strict';

  var STORE_KEY = 'leonida-platinum-log-v2c';
  var catalogue = null;      // parsed trophies.json
  var openGuides = {};       // trophy id -> true while its guide panel is open
  var activeView = 'checklist';

  var els = {};
  function grab(id) { return document.getElementById(id); }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return {
          earned: parsed.earned || {},
          counts: parsed.counts || {},
          shield: !!parsed.shield,
          hideDone: !!parsed.hideDone
        };
      }
    } catch (err) { /* a corrupt save should never break the guide */ }
    return { earned: {}, counts: {}, shield: false, hideDone: false };
  }
  var state = loadState();

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (err) { /* private mode etc. */ }
  }
  function announce(message) { els.statusLine.textContent = message; }

  function isEarned(trophy) { return !!state.earned[String(trophy.id)]; }
  function countOf(trophy) { return Number(state.counts[String(trophy.id)] || 0); }
  function isStory(trophy) { return trophy.kind.indexOf('story') !== -1; }
  function isHiddenByShield(trophy) {
    return state.shield && isStory(trophy) && !isEarned(trophy);
  }
  function displayName(trophy) {
    return isHiddenByShield(trophy) ? 'Hidden story trophy #' + trophy.id : trophy.name;
  }
  function displayDesc(trophy) {
    return isHiddenByShield(trophy)
      ? 'Spoiler shield is on: this story trophy reveals itself once you earn it, or when you switch the shield off.'
      : trophy.description;
  }
  function missableLabel(flag) {
    if (flag === 'risk') return 'At risk';
    if (flag === 'possible') return 'Possibly missable';
    if (flag === 'unconfirmed') return 'Unconfirmed';
    return '';
  }
  function fmtMoney(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function fmtCount(trophy, n) {
    return trophy.count.label.indexOf('$') !== -1 ? fmtMoney(n) : String(n);
  }

  function badge(text, cls) {
    var span = document.createElement('span');
    span.className = 'badge ' + cls;
    span.textContent = text;
    return span;
  }

  function buildCounter(trophy) {
    var wrap = document.createElement('div');
    var current = countOf(trophy);
    var total = trophy.count.total;

    var box = document.createElement('div');
    box.className = 'counter-box';
    var label = document.createElement('span');
    label.textContent = 'Tracker — ' + trophy.count.label + ':';
    var minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease count for ' + trophy.name);
    var input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = String(total);
    input.value = String(current);
    input.setAttribute('aria-label', 'Current count for ' + trophy.name);
    var plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase count for ' + trophy.name);
    var ofTotal = document.createElement('span');
    ofTotal.textContent = 'of ' + fmtCount(trophy, total);

    function apply(next) {
      var clamped = Math.max(0, Math.min(total, Math.floor(Number(next) || 0)));
      state.counts[String(trophy.id)] = clamped;
      if (clamped >= total && !isEarned(trophy)) {
        state.earned[String(trophy.id)] = true;
        announce(trophy.name + ': counter complete — trophy marked as earned.');
      }
      persist();
      renderAll(false);
    }
    minus.addEventListener('click', function () { apply(countOf(trophy) - 1); });
    plus.addEventListener('click', function () { apply(countOf(trophy) + 1); });
    input.addEventListener('change', function () { apply(input.value); });

    box.appendChild(label); box.appendChild(minus); box.appendChild(input);
    box.appendChild(plus); box.appendChild(ofTotal);
    wrap.appendChild(box);

    var bar = document.createElement('div');
    bar.className = 'counter-bar';
    var fill = document.createElement('i');
    fill.style.width = (total ? Math.round((current / total) * 100) : 0) + '%';
    bar.appendChild(fill);
    wrap.appendChild(bar);
    return wrap;
  }

  function buildGuidePanel(trophy) {
    var panel = document.createElement('div');
    panel.className = 'guide-panel';

    var guidePara = document.createElement('p');
    guidePara.textContent = isHiddenByShield(trophy)
      ? 'Guide hidden by the spoiler shield until this trophy is earned.'
      : trophy.guide;
    panel.appendChild(guidePara);

    if (trophy.missableDetail) {
      var missPara = document.createElement('p');
      var strong = document.createElement('strong');
      strong.textContent = missableLabel(trophy.missable) + ' — when it can be missed: ';
      missPara.appendChild(strong);
      missPara.appendChild(document.createTextNode(trophy.missableDetail));
      panel.appendChild(missPara);
    }

    if (trophy.dispute) {
      var box = document.createElement('div');
      box.className = 'dispute';
      var heading = document.createElement('h4');
      heading.textContent = 'Guides disagree — both versions';
      box.appendChild(heading);
      var lineA = document.createElement('p');
      lineA.textContent = 'Version one: ' + trophy.dispute.a;
      var lineB = document.createElement('p');
      lineB.textContent = 'Version two: ' + trophy.dispute.b;
      var lineCall = document.createElement('p');
      var callStrong = document.createElement('strong');
      callStrong.textContent = "This log's call: ";
      lineCall.appendChild(callStrong);
      lineCall.appendChild(document.createTextNode(trophy.dispute.call));
      box.appendChild(lineA); box.appendChild(lineB); box.appendChild(lineCall);
      panel.appendChild(box);
    }

    var src = document.createElement('p');
    src.className = 'sources-line';
    src.textContent = 'Sources: ' + trophy.sources.join(' · ');
    panel.appendChild(src);
    return panel;
  }

  function buildCard(trophy, opts) {
    var card = document.createElement('article');
    card.className = 'trophy-card' + (isEarned(trophy) ? ' is-earned' : '') +
      (openGuides[trophy.id] ? ' is-open' : '');

    var head = document.createElement('div');
    head.className = 'trophy-head';
    var tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.checked = isEarned(trophy);
    tick.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
    tick.addEventListener('change', function () {
      if (tick.checked) { state.earned[String(trophy.id)] = true; }
      else { delete state.earned[String(trophy.id)]; }
      persist();
      renderAll(false);
      announce(trophy.name + (tick.checked ? ' marked as earned.' : ' marked as not earned.'));
    });
    var titleWrap = document.createElement('div');
    var nameEl = document.createElement('h3');
    nameEl.className = 'trophy-name';
    nameEl.textContent = displayName(trophy);
    var descEl = document.createElement('p');
    descEl.className = 'trophy-desc';
    descEl.textContent = displayDesc(trophy);
    titleWrap.appendChild(nameEl); titleWrap.appendChild(descEl);
    head.appendChild(tick); head.appendChild(titleWrap);
    card.appendChild(head);

    var badges = document.createElement('div');
    badges.appendChild(badge(trophy.grade, trophy.grade));
    trophy.kind.forEach(function (k) { badges.appendChild(badge(k, 'kind')); });
    badges.appendChild(badge('Stage ' + trophy.stage, 'kind'));
    if (trophy.missable) badges.appendChild(badge(missableLabel(trophy.missable), trophy.missable));
    card.appendChild(badges);

    if (trophy.count) card.appendChild(buildCounter(trophy));

    if (!opts || !opts.noGuide) {
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'guide-toggle';
      var isOpen = !!openGuides[trophy.id];
      toggle.textContent = isOpen ? 'Hide guide' : 'Read the guide';
      toggle.addEventListener('click', function () {
        openGuides[trophy.id] = !openGuides[trophy.id];
        renderAll(false);
      });
      card.appendChild(toggle);
      if (isOpen) card.appendChild(buildGuidePanel(trophy));
    }
    return card;
  }

  function currentFilters() {
    return {
      query: els.searchBox.value.trim().toLowerCase(),
      kind: els.kindFilter.value,
      grade: els.gradeFilter.value
    };
  }
  function passesFilters(trophy, f) {
    if (f.grade !== 'all' && trophy.grade !== f.grade) return false;
    if (f.kind === 'missable') {
      if (!trophy.missable) return false;
    } else if (f.kind !== 'all' && trophy.kind.indexOf(f.kind) === -1) return false;
    if (state.hideDone && isEarned(trophy)) return false;
    if (f.query) {
      var haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide + ' ' +
        trophy.kind.join(' ') + ' stage ' + trophy.stage).toLowerCase();
      if (haystack.indexOf(f.query) === -1) return false;
    }
    return true;
  }

  function renderChecklist() {
    var f = currentFilters();
    var list = catalogue.trophies.filter(function (t) { return passesFilters(t, f); });
    els.cardGrid.textContent = '';
    list.forEach(function (t) { els.cardGrid.appendChild(buildCard(t, {})); });
    els.resultCount.textContent = 'Showing ' + list.length + ' of ' + catalogue.trophies.length + ' trophies.';
    els.emptyNote.hidden = list.length !== 0;
  }

  function renderRoadmap() {
    els.roadmapList.textContent = '';
    catalogue.stages.forEach(function (stage) {
      var block = document.createElement('div');
      block.className = 'stage-block';
      var heading = document.createElement('h3');
      heading.textContent = 'Stage ' + stage.n + ' — ' + stage.title;
      var note = document.createElement('p');
      note.className = 'muted';
      note.textContent = stage.note;
      block.appendChild(heading); block.appendChild(note);
      var items = catalogue.trophies.filter(function (t) { return t.stage === stage.n; });
      var done = items.filter(isEarned).length;
      var prog = document.createElement('p');
      prog.textContent = done + ' of ' + items.length + ' trophies in this stage are earned.';
      block.appendChild(prog);
      var ul = document.createElement('ul');
      ul.className = 'stage-list';
      items.forEach(function (t) {
        var li = document.createElement('li');
        var tick = document.createElement('input');
        tick.type = 'checkbox';
        tick.checked = isEarned(t);
        tick.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
        tick.addEventListener('change', function () {
          if (tick.checked) { state.earned[String(t.id)] = true; }
          else { delete state.earned[String(t.id)]; }
          persist(); renderAll(false);
        });
        li.appendChild(tick);
        li.appendChild(document.createTextNode(' ' + displayName(t) + ' (' + t.grade + ')'));
        ul.appendChild(li);
      });
      block.appendChild(ul);
      els.roadmapList.appendChild(block);
    });
  }

  function renderMissables() {
    els.missableList.textContent = '';
    var flagged = catalogue.trophies.filter(function (t) { return !!t.missable; });
    flagged.forEach(function (t) { els.missableList.appendChild(buildCard(t, {})); });
  }

  function renderSources() {
    var totalPages = catalogue.sourceList.reduce(function (sum, s) { return sum + s.pages; }, 0);
    els.sourceSummary.textContent = catalogue.sourceList.length + ' guide sites, ' + totalPages +
      ' pages read for this log. Each trophy below and in the checklist cites the sources behind its own guide.';
    els.sourceList.textContent = '';
    catalogue.sourceList.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s.site + ' — ' + s.page + ' (' + s.pages + (s.pages === 1 ? ' page' : ' pages') + ')';
      els.sourceList.appendChild(li);
    });
  }

  function renderProgress() {
    var total = catalogue.trophies.length;
    var done = catalogue.trophies.filter(isEarned).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    els.progressText.textContent = done + ' of ' + total + ' earned';
    els.progressPct.textContent = pct + '%';
    els.progressRing.style.background =
      'conic-gradient(var(--teal) ' + (pct * 3.6) + 'deg, #eadfce 0deg)';
    var byGrade = ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
      var all = catalogue.trophies.filter(function (t) { return t.grade === g; }).length;
      var got = catalogue.trophies.filter(function (t) { return t.grade === g && isEarned(t); }).length;
      return g + ' ' + got + '/' + all;
    });
    els.gradeText.textContent = byGrade.join(' · ');
  }

  function renderAll(keepView) {
    if (!catalogue) return;
    renderProgress();
    renderChecklist();
    renderRoadmap();
    renderMissables();
    renderSources();
    if (!keepView) showView(activeView);
  }

  function showView(name) {
    activeView = name;
    ['checklist', 'roadmap', 'missables', 'sources'].forEach(function (v) {
      grab('view-' + v).hidden = v !== name;
    });
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-view') === name);
    });
    els.toolbar.style.display = name === 'checklist' ? '' : 'none';
  }

  function exportProgress() {
    var payload = {
      app: 'leonida-platinum-log',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: state.earned,
      counts: state.counts,
      shield: state.shield,
      hideDone: state.hideDone
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'leonida-platinum-log-progress.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 400);
    announce('Progress exported as leonida-platinum-log-progress.json.');
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || !parsed.earned) {
          announce('That file does not look like an exported progress file.');
          return;
        }
        state = {
          earned: parsed.earned || {},
          counts: parsed.counts || {},
          shield: !!parsed.shield,
          hideDone: !!parsed.hideDone
        };
        els.spoilerToggle.checked = state.shield;
        els.hideDoneToggle.checked = state.hideDone;
        persist();
        renderAll(false);
        announce('Progress imported.');
      } catch (err) {
        announce('Import failed: the file could not be read as JSON.');
      }
    };
    reader.readAsText(file);
  }

  function wire() {
    els.searchBox = grab('searchBox');
    els.kindFilter = grab('kindFilter');
    els.gradeFilter = grab('gradeFilter');
    els.spoilerToggle = grab('spoilerToggle');
    els.hideDoneToggle = grab('hideDoneToggle');
    els.cardGrid = grab('cardGrid');
    els.resultCount = grab('resultCount');
    els.emptyNote = grab('emptyNote');
    els.roadmapList = grab('roadmapList');
    els.missableList = grab('missableList');
    els.sourceList = grab('sourceList');
    els.sourceSummary = grab('sourceSummary');
    els.progressText = grab('progressText');
    els.progressPct = grab('progressPct');
    els.progressRing = grab('progressRing');
    els.gradeText = grab('gradeText');
    els.statusLine = grab('statusLine');
    els.toolbar = grab('toolbar');

    els.spoilerToggle.checked = state.shield;
    els.hideDoneToggle.checked = state.hideDone;

    els.searchBox.addEventListener('input', renderChecklist);
    els.kindFilter.addEventListener('change', renderChecklist);
    els.gradeFilter.addEventListener('change', renderChecklist);
    els.spoilerToggle.addEventListener('change', function () {
      state.shield = els.spoilerToggle.checked;
      persist(); renderAll(false);
      announce(state.shield ? 'Spoiler shield on: unearned story trophies are hidden.' : 'Spoiler shield off.');
    });
    els.hideDoneToggle.addEventListener('change', function () {
      state.hideDone = els.hideDoneToggle.checked;
      persist(); renderChecklist();
    });
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { showView(tab.getAttribute('data-view')); });
    });
    grab('exportBtn').addEventListener('click', exportProgress);
    grab('importFile').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    grab('resetBtn').addEventListener('click', function () {
      state = { earned: {}, counts: {}, shield: state.shield, hideDone: false };
      els.hideDoneToggle.checked = false;
      persist(); renderAll(false);
      announce('Progress reset: all ticks and counters cleared.');
    });

    // Screenshot / deep-link helper: ?view=roadmap, ?kind=..., ?grade=..., ?shield=1, ?open=<id>, ?earned=1,8,15
    var params = new URLSearchParams(window.location.search);
    if (params.get('shield') === '1') {
      state.shield = true; els.spoilerToggle.checked = true;
    }
    if (params.get('kind')) els.kindFilter.value = params.get('kind');
    if (params.get('grade')) els.gradeFilter.value = params.get('grade');
    if (params.get('q')) els.searchBox.value = params.get('q');
    if (params.get('open')) {
      params.get('open').split(',').forEach(function (id) {
        if (id.trim()) openGuides[id.trim()] = true;
      });
    }
    if (params.get('earned')) {
      params.get('earned').split(',').forEach(function (id) {
        if (id.trim()) state.earned[id.trim()] = true;
      });
    }
    if (params.get('counts')) {
      params.get('counts').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length === 2) state.counts[bits[0]] = Number(bits[1]) || 0;
      });
    }
    renderAll(true);
    showView(params.get('view') || 'checklist');
  }

  fetch('data/trophies.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      catalogue = data;
      wire();
    })
    .catch(function () {
      document.body.insertAdjacentHTML('beforeend',
        '<p style="padding:20px">The guide data (data/trophies.json) could not be loaded. Serve the app folder over HTTP, for example with node serve.ts.</p>');
    });
})();
