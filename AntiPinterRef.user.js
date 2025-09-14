// ==UserScript==
// @name         AntiPinterRef
// @namespace    https://lycanld.github.io
// @version      1.0.1
// @description  Prevent Pinterest auto-refresh/reset by faking activity & blocking reload triggers
// @author       LycanLD
// @icon         https://github.com/LycanLD/AntiPinterRef/blob/master/docs/1024.png?raw=true
// @match        *://*.pinterest.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = {
    intervalMs: 20_000,
    tinyScrollPx: 10,
    jitter: true,
    verbose: false
  };

  function log(...args) {
    if (CONFIG.verbose) console.log('[AntiPinterRef]', ...args);
  }

function injectCredits() {
  if (document.getElementById('antipinterref-credits')) return;

  const overlay = document.createElement('div');
  overlay.id = 'antipinterref-credits';
  overlay.innerHTML = `
    <div class="apr-overlay">
      <div class="apr-card">
        <button class="apr-close" id="apr-close" aria-label="Close">&times;</button>
        <h2>✨ AntiPinterRef v1.0 Public</h2>
        <p>
          Tampermonkey/Violentmonkey script to prevent Pinterest’s
          auto-refresh <em>“feature”</em>.
        </p>
        <p><strong>Author:</strong>
           <a href="https://github.com/LycanLD/" target="_blank">LycanLD</a>
        </p>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .apr-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 999999;
      animation: apr-fadein 0.2s ease-out;
    }
    @keyframes apr-fadein {
      from { opacity: 0; } to { opacity: 1; }
    }
    .apr-card {
      background: #fff; color: #111;
      padding: 24px 32px;
      border-radius: 16px;
      max-width: 420px; text-align: center;
      font-family: system-ui, sans-serif;
      box-shadow: 0 8px 28px rgba(0,0,0,0.25);
      position: relative;
      animation: apr-popin 0.25s cubic-bezier(.18,.89,.32,1.28);
    }
    @keyframes apr-popin {
      from { transform: scale(0.9); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .apr-card h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    .apr-card p {
      margin: 8px 0;
      line-height: 1.4;
    }
    .apr-card a {
      color: #e60023;
      text-decoration: none;
      font-weight: 600;
    }
    .apr-card a:hover {
      text-decoration: underline;
    }
    .apr-close {
      position: absolute;
      top: 10px; right: 10px;
      border: none;
      background: none;
      font-size: 22px;
      cursor: pointer;
      color: #666;
    }
    .apr-close:hover {
      color: #e60023;
    }
  `;

  document.body.appendChild(overlay);
  document.head.appendChild(style);

  overlay.querySelector('#apr-close').onclick = () => overlay.remove();
}


  // -------------------------------------------------------------------------
  // Sidebar Button
  // -------------------------------------------------------------------------
  function addSidebarButton() {
    const sidebar = document.querySelector('div.Jea.KS5.b8T.jzS.zI7');
    if (!sidebar || document.getElementById('apr-sidebar-btn')) return;

    // Clone an existing button (like Messages) for styling
    const templateBtn = sidebar.querySelector('button.yfm') || sidebar.querySelector('a.nrl');
    if (!templateBtn) return;

    const newWrapper = document.createElement('div');
    newWrapper.className = "zI7"; // match structure

    const btn = templateBtn.cloneNode(true);
    btn.id = 'apr-sidebar-btn';
    btn.setAttribute('aria-label', 'AntiPinterRef');
    btn.removeAttribute('href'); // in case we cloned an <a>
    btn.type = 'button';

    // Replace the icon with your PNG
    const iconWrapper = btn.querySelector('.SPw');
    if (iconWrapper) {
      iconWrapper.innerHTML = `
        <img
          src="https://github.com/LycanLD/AntiPinterRef/blob/master/docs/1024.png?raw=true"
          alt="AntiPinterRef"
          style="width:24px;height:24px;object-fit:contain;"
        />
      `;
    }

    // Hook up click → credits overlay
    btn.onclick = injectCredits;

    newWrapper.appendChild(btn);
    sidebar.appendChild(newWrapper);

    log('Sidebar button injected');
  }


  // Keep trying until sidebar loads
  const navInterval = setInterval(() => {
    const sidebar = document.querySelector('div.Jea.KS5.b8T.jzS.zI7');
    if (sidebar) {
      clearInterval(navInterval);
      addSidebarButton();
    }
  }, 1000);

  // -------------------------------------------------------------------------
  // Fake User Activity
  // -------------------------------------------------------------------------
  function dispatchMouseMove(x, y) {
    const evt = new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y });
    document.dispatchEvent(evt);
  }

  function dispatchKey() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift', bubbles: true }));
  }

  function nudgeScroll() {
    const y = window.scrollY || 0;
    const dx = CONFIG.jitter ? (Math.random() * 4 - 2) : 0;
    const dy = CONFIG.tinyScrollPx + (CONFIG.jitter ? Math.random() * 4 : 0);
    window.scrollTo(window.scrollX + dx, y + dy);
    setTimeout(() => window.scrollTo(window.scrollX, y), 150);
  }

  function simulateActivity() {
    const rx = (window.innerWidth / 2) + (CONFIG.jitter ? Math.random() * 40 - 20 : 0);
    const ry = (window.innerHeight / 2) + (CONFIG.jitter ? Math.random() * 40 - 20 : 0);
    dispatchMouseMove(rx, ry);
    dispatchKey();
    nudgeScroll();
    log('simulated activity');
  }

  // -------------------------------------------------------------------------
  // Block Pinterest reload triggers
  // -------------------------------------------------------------------------
  try {
    const originalReload = location.reload.bind(location);
    Object.defineProperty(location, 'reload', {
      configurable: true,
      value: function spoofReload() {
        console.warn('[AntiPinterRef] blocked location.reload()');
        originalReload();
      }
    });
  } catch (_) {}

  Object.defineProperty(window, 'onbeforeunload', {
    configurable: true,
    get() { return null; },
    set() { log('blocked onbeforeunload'); }
  });

  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        const text = node.innerText || '';
        if (/new pins|see new ideas|refresh feed|fresh ideas/i.test(text)) {
          log('removing Pinterest auto-refresh banner', text.slice(0, 50));
          try { node.remove(); } catch { node.style.display = 'none'; }
        }
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    simulateActivity();
    setInterval(simulateActivity, CONFIG.intervalMs);
  });

})();
