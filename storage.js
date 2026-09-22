// Simon Dashboard — Structured Log Storage
// Key format: simon::{log}::{type}::{date}
// Logs: flow, distractions, ratios, wellbeing

const SimonStorage = (() => {
  const LS_PREFIX = 'simon';
  const today = () => new Date().toISOString().slice(0, 10);

  function key(log, type, date) {
    return `${LS_PREFIX}::${log}::${type}::${date}`;
  }

  function write(log, type, value) {
    localStorage.setItem(key(log, type, today()), JSON.stringify(value));
  }

  function read(log, type, date) {
    const v = localStorage.getItem(key(log, type, date || today()));
    return v ? JSON.parse(v) : null;
  }

  function readAll(log, type) {
    const results = [];
    const prefix = `${LS_PREFIX}::${log}::${type}::`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const date = k.slice(prefix.length);
        results.push({ date, value: JSON.parse(localStorage.getItem(k)) });
      }
    }
    return results.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  }

  function readRange(log, type, startDate, endDate) {
    return readAll(log, type).filter(e => e.date >= startDate && e.date <= endDate);
  }

  // ── Aggregation helpers ────────────────────────────────────
  // Skip missing days — averages are over days-with-data, not calendar days.

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // ── Period boundaries (fixed schedule, skip empty periods) ─
  // Weeks anchored on Saturday, months on 1st, quarters on quarter-start, years on Jan 1.
  // A period "registers" only if >=1 day has data in it.

  function lastSaturday() {
    const d = new Date();
    const day = d.getDay(); // 0=Sun .. 6=Sat
    const offset = (day + 1) % 7; // days since last Sat
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  }

  function periodWeek() {
    const sat = lastSaturday();
    const end = new Date(sat);
    end.setDate(end.getDate() + 6);
    return { start: sat, end: end.toISOString().slice(0, 10) };
  }

  function periodPrevWeek() {
    const sat = lastSaturday();
    const start = new Date(sat);
    start.setDate(start.getDate() - 7);
    const end = new Date(sat);
    end.setDate(end.getDate() - 1);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  function periodMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: today() };
  }

  function periodPrevMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  function periodQuarter() {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    return { start: start.toISOString().slice(0, 10), end: today() };
  }

  function periodYear() {
    const now = new Date();
    return { start: now.getFullYear() + '-01-01', end: today() };
  }

  function sumPeriod(log, type, period) {
    const entries = readRange(log, type, period.start, period.end);
    if (!entries.length) return null; // null = no data = period doesn't register
    return entries.reduce((s, e) => s + (e.value || 0), 0);
  }

  function avgPeriod(log, type, period) {
    const entries = readRange(log, type, period.start, period.end);
    if (!entries.length) return null;
    return entries.reduce((s, e) => s + (e.value || 0), 0) / entries.length;
  }

  function latestN(log, type, n) {
    return readAll(log, type).slice(-n);
  }

  // ── Streaks ────────────────────────────────────────────────
  function streak(log, type) {
    const entries = readAll(log, type);
    if (!entries.length) return 0;
    const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (dates.includes(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  // ── Distractions (list data) ───────────────────────────────
  function logDistraction(name, mins, time) {
    const list = read('distractions', 'list') || [];
    list.push({ n: name, m: mins, t: time });
    write('distractions', 'list', list);
  }

  function getDistractions() {
    return read('distractions', 'list') || [];
  }

  function removeDistraction(idx) {
    const list = read('distractions', 'list') || [];
    const removed = list.splice(idx, 1)[0];
    write('distractions', 'list', list);
    return removed;
  }

  // ── Sessions (individual work/break lengths) ───────────────
  function logSession(type, durationSecs, completed) {
    // type: 'work' | 'break'
    // completed: true = finished naturally, false = stopped early
    const list = read('flow', 'sessions_log') || [];
    list.push({ t: type, s: durationSecs, c: completed, ts: new Date().toISOString() });
    write('flow', 'sessions_log', list);
  }

  function getSessions() {
    return read('flow', 'sessions_log') || [];
  }

  // ── Migration from old localStorage keys ───────────────────
  function migrate() {
    if (localStorage.getItem('simon::migrated')) return;

    const todayStr = today();
    function migrateKey(oldKey, log, type) {
      const v = localStorage.getItem(oldKey);
      if (v !== null) {
        const parsed = JSON.parse(v);
        // If it's a per-day key with a date suffix
        const dateMatch = oldKey.match(/:(\d{4}-\d{2}-\d{2})$/);
        if (dateMatch) {
          const date = dateMatch[1];
          const k = key(log, type, date);
          if (localStorage.getItem(k) === null) {
            localStorage.setItem(k, JSON.stringify(parsed));
          }
        } else {
          // No date — write to today
          const k = key(log, type, todayStr);
          if (localStorage.getItem(k) === null) {
            localStorage.setItem(k, JSON.stringify(parsed));
          }
        }
      }
    }

    // Flow
    migrateKey('simon_work_mins:' + todayStr, 'flow', 'work');
    migrateKey('simon_break_mins:' + todayStr, 'flow', 'break');
    migrateKey('simon_avoid_mins:' + todayStr, 'flow', 'avoid');
    migrateKey('simon_sessions:' + todayStr, 'flow', 'sessions');

    // KPIs
    migrateKey('simon_kpi_flow:' + todayStr, 'wellbeing', 'bibleStudy');
    migrateKey('simon_kpi_avoid:' + todayStr, 'flow', 'avoid');
    migrateKey('simon_kpi_bible:' + todayStr, 'wellbeing', 'bible');

    // Soothe
    migrateKey('simon_soothe:' + todayStr, 'wellbeing', 'soothe');

    // Review draft
    const draft = localStorage.getItem('simon_review_draft:' + todayStr);
    if (draft) {
      const d = JSON.parse(draft);
      if (d.ns) write('wellbeing', 'ns', parseInt(d.ns));
      if (d.rating) write('wellbeing', 'rating', parseInt(d.rating));
    }

    // Filed reviews
    const reviews = localStorage.getItem('simon_filed_reviews');
    if (reviews) {
      const r = JSON.parse(reviews);
      for (const rev of r) {
        if (rev.ns) write('wellbeing', 'ns', parseInt(rev.ns));
        if (rev.rating) write('wellbeing', 'rating', parseInt(rev.rating));
        if (rev.soothe != null) write('wellbeing', 'soothe', parseInt(rev.soothe));
      }
    }

    localStorage.setItem('simon::migrated', '1');
  }

  // ── Debug ──────────────────────────────────────────────────
  function dump() {
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('simon::')) {
        entries.push({ key: k, value: JSON.parse(localStorage.getItem(k)) });
      }
    }
    return entries;
  }

  return {
    write, read, readAll, readRange,
    periodWeek, periodPrevWeek, periodMonth, periodPrevMonth,
    periodQuarter, periodYear,
    sumPeriod, avgPeriod,
    latestN, streak,
    logDistraction, getDistractions, removeDistraction,
    logSession, getSessions,
    migrate, dump, today, key
  };
})();
