// ==UserScript==
// @name         AntiPinterRef
// @namespace    https://lycanld.github.io
// @version      1.0
// @description  Prevent Pinterest auto-refresh/reset by faking activity & blocking reload triggers
// @author       LycanLD
// @icon         https://github.com/LycanLD/LeUnBrIck/tree/main/docs/1024.png
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

// -------------------------------------------------------------------------
// Branding / Credits Overlay
// -------------------------------------------------------------------------
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

    // Replace the SVG inside
    const svgWrapper = btn.querySelector('.SPw');
    if (svgWrapper) {
      svgWrapper.innerHTML = `
        <svg
          class="gUZ U9O Uvi"
          height="24"
          width="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 5.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.41.34-.75.75-.75s.75.34.75.75v1.5c0
                   1.52-1.23 2.75-2.75 2.75s-2.75-1.23-2.75-2.75V2.75c0-.41.34-.75.75-.75s.75.34.75.75v1.5c0
                   .69.56 1.25 1.25 1.25zM6.47 4.47c.29.29.29.77 0 1.06L5.06 7.94c-.29.29-.77.29-1.06 0s-.29-.77
                   0-1.06l1.41-1.41a.75.75 0 0 1 1.06 0zm11.06 0a.75.75 0 0 1 1.06 0l1.41 1.41c.29.29.29.77 0
                   1.06s-.77.29-1.06 0L16.47 5.53a.75.75 0 0 1 0-1.06zM19.5 10H22c.41 0 .75.34.75.75s-.34.75-.75.75h-2.5c-.41
                   0-.75-.34-.75-.75s.34-.75.75-.75zM2 11.5h2.5c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H2c-.41
                   0-.75.34-.75.75s.34.75.75.75zm17.03 5.47c-.29-.29-.29-.77 0-1.06l1.41-1.41c.29-.29.77-.29 1.06
                   0s.29.77 0 1.06l-1.41 1.41a.75.75 0 0 1-1.06 0zM4.94 16.97a.75.75 0 0 1-1.06
                   0L2.47 15.56c-.29-.29-.29-.77 0-1.06s.77-.29 1.06 0l1.41 1.41c.29.29.29.77 0 1.06zM11.25
                   18.25v1.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-1.5c0-1.52 1.23-2.75 2.75-2.75s2.75 1.23
                   2.75 2.75v1.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-1.5c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25 1.25z"/>
        </svg>
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
