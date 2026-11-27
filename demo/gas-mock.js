/*
 * gas-mock.js — simulasi minimal Google Apps Script di browser.
 * Kode .gs dijalankan apa adanya; SpreadsheetApp diganti spreadsheet di memori
 * (diisi dari window.DEMO_DATA dan disimpan di localStorage).
 */
(function () {
  const KEY = 'gasmock:' + (window.DEMO_KEY || location.pathname);
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch (e) { store = null; }
  if (!store) store = JSON.parse(JSON.stringify(window.DEMO_DATA || {}));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

  const colToNum = (s) => s.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const width = (rows) => rows.reduce((m, r) => Math.max(m, r.length), 0);

  function Range(sheet, r, c, nr, nc) {
    const rows = () => store[sheet];
    const chain = new Proxy({}, { get: (t, p) => (p in api ? api[p] : () => api) });
    const api = {
      getValues() {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const src = rows()[r - 1 + i] || [];
          const line = [];
          for (let j = 0; j < nc; j++) line.push(src[c - 1 + j] === undefined || src[c - 1 + j] === null ? '' : src[c - 1 + j]);
          out.push(line);
        }
        return out;
      },
      getDisplayValues() { return api.getValues().map(r => r.map(v => String(v))); },
      setValue(v) { return api.setValues(Array.from({ length: nr }, () => Array(nc).fill(v))); },
      setValues(vals) {
        for (let i = 0; i < vals.length; i++) {
          const idx = r - 1 + i;
          while (rows().length <= idx) rows().push([]);
          for (let j = 0; j < vals[i].length; j++) rows()[idx][c - 1 + j] = vals[i][j] instanceof Date ? vals[i][j].toISOString().slice(0, 10) : vals[i][j];
        }
        save(); return chain;
      },
    };
    return chain;
  }

  function Sheet(name) {
    const rows = () => store[name];
    const self = {
      getName: () => name,
      getLastRow: () => rows().length,
      getLastColumn: () => width(rows()),
      getDataRange: () => Range(name, 1, 1, rows().length, Math.max(1, width(rows()))),
      getRange(a, b, c, d) {
        if (typeof a === 'string') {
          const m = a.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
          const c1 = colToNum(m[1]), r1 = +m[2], c2 = m[3] ? colToNum(m[3]) : c1, r2 = m[4] ? +m[4] : r1;
          return Range(name, r1, c1, r2 - r1 + 1, c2 - c1 + 1);
        }
        return Range(name, a, b, c || 1, d || 1);
      },
      appendRow(arr) { rows().push(arr.map(v => (v instanceof Date ? v.toISOString().slice(0, 10) : v))); save(); return self; },
      deleteRow(i) { rows().splice(i - 1, 1); save(); return self; },
      insertColumnAfter(i) { rows().forEach(r => r.splice(i, 0, '')); save(); return self; },
      setFrozenRows() { return self; },
    };
    return self;
  }

  const ss = {
    getSheetByName: (n) => (store[n] ? Sheet(n) : null),
    insertSheet: (n) => { store[n] = []; save(); return Sheet(n); },
  };

  const pad = (n) => String(n).padStart(2, '0');
  window.SpreadsheetApp = { getActiveSpreadsheet: () => ss };
  window.Session = { getScriptTimeZone: () => 'Asia/Jakarta' };
  window.Utilities = {
    formatDate(d, tz, fmt) {
      d = new Date(d);
      return fmt.replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate()))
        .replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes())).replace('ss', pad(d.getSeconds()));
    },
  };
  window.ScriptApp = { getService: () => ({ getUrl: () => (window.DEMO_BASE_URL || 'index.html') }) };
  window.HtmlService = { XFrameOptionsMode: {} };

  function runner(ok, fail) {
    return new Proxy({}, {
      get(t, prop) {
        if (prop === 'withSuccessHandler') return (fn) => runner(fn, fail);
        if (prop === 'withFailureHandler') return (fn) => runner(ok, fn);
        return (...args) => setTimeout(() => {
          try {
            const fn = window[prop];
            if (typeof fn !== 'function') throw new Error('Fungsi server tidak ditemukan: ' + prop);
            const res = fn(...JSON.parse(JSON.stringify(args)));
            ok && ok(JSON.parse(JSON.stringify(res === undefined ? null : res)));
          } catch (e) { console.error(e); fail && fail(e); }
        }, 150);
      },
    });
  }
  window.google = { script: { run: runner(null, null) } };
  window.resetDemo = () => { localStorage.removeItem(KEY); location.reload(); };
})();
