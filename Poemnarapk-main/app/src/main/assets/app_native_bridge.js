/**
 * ============================================================
 * app_native_bridge.js - 原生壳交互桥（返回 / 全屏键盘 / 本地通知）
 * ------------------------------------------------------------
 * 职责：
 *  1) 提供 window.__storyNativeBack()，供 Android 壳的返回键与
 *     “左右边缘划动”手势调用，按「浮层 → 设置二级 → 应用窗口」
 *     的顺序逐级回退，避免手势/返回键一拍就把 APK 退掉；
 *  2) StoryBack 返回栈，新页面可用 StoryBack.push(fn) 注册自己的返回逻辑；
 *  3) 原生壳视口守卫：归零安全区留白（去掉顶部白条）、键盘/手势后复位整页位移；
 *  4) StoryNotify 本地通知助手（Android 13+ 运行时权限 / 通知设置页）。
 * ============================================================
 */
(function () {
  "use strict";

  if (window.__storyNativeBridgeReady) return;
  window.__storyNativeBridgeReady = true;

  // ---------- 1. 应用窗口栈：后打开的先关闭 ----------
  var appStack = [];

  function recordOpen(app) {
    if (typeof app !== "string" || !app) return;
    var idx = appStack.indexOf(app);
    if (idx >= 0) appStack.splice(idx, 1);
    appStack.push(app);
  }

  function recordClose(app) {
    var idx = appStack.indexOf(app);
    if (idx >= 0) appStack.splice(idx, 1);
  }

  function hookAppNavigation() {
    if (typeof window.openApp === "function" && !window.openApp.__storyHooked) {
      var prevOpen = window.openApp;
      var wrappedOpen = function (app) {
        recordOpen(app);
        return prevOpen.apply(this, arguments);
      };
      wrappedOpen.__storyHooked = true;
      window.openApp = wrappedOpen;
    }
    if (typeof window.closeApp === "function" && !window.closeApp.__storyHooked) {
      var prevClose = window.closeApp;
      var wrappedClose = function (app) {
        recordClose(app);
        var result = prevClose.apply(this, arguments);
        // 关窗后立刻复位整页位移：WebView 被 scrollIntoView / 输入法顶起后
        // 文档滚动量会残留，表现为「桌面一片空白、Dock 跑到屏幕上方」。
        resetViewportSoon();
        return result;
      };
      wrappedClose.__storyHooked = true;
      window.closeApp = wrappedClose;
    }
  }

  hookAppNavigation();

  // ---------- 2. 浮层（弹窗 / 详情面板 / 抽屉）识别与关闭 ----------
  var OVERLAY_SELECTOR = [
    ".modal-overlay",
    ".chat-details-overlay",
    ".chat-dialog-overlay",
    ".me-sub-overlay",
    ".forum-drawer-overlay"
  ].join(",");

  // 已知浮层 → 业务内的关闭函数（存在则优先调用，最贴近“上一页”语义）
  var KNOWN_CLOSERS = {
    "chat-details-panel": "closeChatDetails",
    "chat-dialog-panel": "closeChatDialog"
  };

  function isShown(el) {
    if (!el) return false;
    if (el.getClientRects().length === 0) return false;
    var cs = window.getComputedStyle(el);
    if (!cs) return false;
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    if (parseFloat(cs.opacity) === 0) return false;
    // 本项目浮层多用 pointer-events / transform 隐藏，这里一并排除
    if (cs.pointerEvents === "none") return false;
    var r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    var vw = window.innerWidth || 0;
    var vh = window.innerHeight || 0;
    if (r.right <= 1 || r.left >= vw - 1 || r.bottom <= 1 || r.top >= vh - 1) return false;
    return true;
  }

  function zIndexOf(el) {
    var z = parseInt(window.getComputedStyle(el).zIndex, 10);
    return isNaN(z) ? 0 : z;
  }

  function topmostOverlay() {
    var list = document.querySelectorAll(OVERLAY_SELECTOR);
    var best = null;
    var bestZ = -1;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!isShown(el)) continue;
      var z = zIndexOf(el);
      if (z >= bestZ) {
        best = el;
        bestZ = z;
      }
    }
    return best;
  }

  function closeOverlay(el) {
    var fnName = KNOWN_CLOSERS[el.id];
    if (fnName && typeof window[fnName] === "function") {
      try { window[fnName](); } catch (e) { console.warn("[storyBridge] closer failed:", e); }
      if (!isShown(el)) return true;
    }
    // 浮层自带的关闭按钮
    var btn = el.querySelector('[onclick*="lose"], [onclick*="ancel"], .close-btn, .modal-close, [data-close]');
    if (btn) {
      try { btn.click(); } catch (e) { }
      if (!isShown(el)) return true;
    }
    // 模拟点击遮罩自身（多数浮层把“点遮罩关闭”绑在容器上）
    try { el.click(); } catch (e) { }
    if (!isShown(el)) return true;
    // 最后兜底：派发 Esc
    try {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
    } catch (e) { }
    return !isShown(el);
  }

  // ---------- 3. 返回栈 + 统一返回入口 ----------
  var backHandlers = [];

  var StoryBack = {
    /** 注册一个返回处理器：返回 false 表示“我不管”，处理器会被弹出；其余视为已处理 */
    push: function (fn) {
      if (typeof fn === "function") backHandlers.push(fn);
    },
    pop: function () {
      return backHandlers.pop();
    },
    clear: function () {
      backHandlers.length = 0;
    },
    size: function () {
      return backHandlers.length;
    }
  };
  window.StoryBack = StoryBack;

  function closeSettingsSubPage() {
    var lv1 = document.getElementById("settings-lv1");
    if (!lv1) return false;
    if (lv1.style.display === "none") {
      if (typeof window.closeSettingsLv2 === "function") {
        window.closeSettingsLv2();
        return true;
      }
    }
    return false;
  }

  function closeTopApp() {
    hookAppNavigation();
    while (appStack.length) {
      var appId = appStack.pop();
      if (typeof window.closeApp === "function") {
        try { window.closeApp(appId); } catch (e) { console.warn("[storyBridge] closeApp failed:", e); }
      }
      var win = document.getElementById("win-" + appId);
      if (win && win.classList.contains("active")) win.classList.remove("active");
      return true;
    }
    // 兜底：窗口是外部直接调 Router 打开的，按 DOM 中最后一个 active 回收
    var actives = document.querySelectorAll(".app-window.active");
    if (actives.length) {
      var last = actives[actives.length - 1];
      var id = (last.id || "").replace(/^win-/, "");
      if (id && typeof window.closeApp === "function") {
        try { window.closeApp(id); } catch (e) { }
      }
      last.classList.remove("active");
      return true;
    }
    return false;
  }

  /**
   * 原生返回入口：返回字符串 "handled" 表示已自行回退，"unhandled" 表示已到最外层。
   */
  window.__storyNativeBack = function () {
    try {
      // 1) 业务自注册返回栈（LIFO，命中即消费掉该处理器）
      while (backHandlers.length) {
        var fn = backHandlers[backHandlers.length - 1];
        var handled = false;
        try { handled = fn() !== false; } catch (e) { handled = false; }
        if (handled) {
          backHandlers.pop();
          return "handled";
        }
        backHandlers.pop();
      }
      // 2) 浮层：弹窗 / 详情 / 抽屉
      var overlay = topmostOverlay();
      if (overlay && closeOverlay(overlay)) return "handled";
      // 3) 设置二级面板 → 回到设置一级
      if (closeSettingsSubPage()) return "handled";
      // 4) 桌面应用窗口：后打开的先关闭
      if (closeTopApp()) return "handled";
      return "unhandled";
    } catch (err) {
      console.warn("[storyBridge] nativeBack error:", err);
      return "unhandled";
    }
  };

  // ---------- 4. 原生壳视口守卫：归零安全区留白、复位键盘/手势留下的整页位移 ----------
  function isNativeShell() {
    return !!(window.AndroidMCP && typeof window.AndroidMCP === "object");
  }

  function resetPageOffset() {
    // 本项目的页面全部是「定高 + overflow:hidden」布局，文档自身不该滚动。
    // 键盘、系统栏切换、手势返回都可能残留文档级滚动量，表现就是「整页被顶起来」。
    try {
      var se = document.scrollingElement || document.documentElement;
      if (se && se.scrollTop) se.scrollTop = 0;
      if (se && se.scrollLeft) se.scrollLeft = 0;
      if (document.body && document.body.scrollTop) document.body.scrollTop = 0;
      if (window.pageYOffset || window.scrollY) window.scrollTo(0, 0);
    } catch (e) { }
  }

  /**
   * 关窗 / 手势结束后复位视口：立即一次 + 过渡动画结束后再兜一次
   * （应用窗口滑出动画 350ms，期间 WebView 仍可能被系统推来推去）
   */
  function resetViewportSoon() {
    resetPageOffset();
    window.setTimeout(resetPageOffset, 60);
    window.setTimeout(resetPageOffset, 420);
  }
  window.StoryResetViewport = resetPageOffset;

  /**
   * 找最近的「可滚动祖先容器」。
   */
  function findScrollableAncestor(el) {
    var node = el && el.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      var cs = window.getComputedStyle(node);
      var oy = cs ? cs.overflowY : "";
      if ((oy === "auto" || oy === "scroll" || oy === "overlay") &&
          node.scrollHeight - node.clientHeight > 2) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  /**
   * 容器内滚动：el.scrollIntoView() 的安全替代品。
   * scrollIntoView 会连带滚动**所有祖先元素，包括文档本身**；本项目页面全是
   * 「固定高度 + 内部容器滚动」，文档一旦被滚走，body 的 overflow:hidden 又让
   * 用户拖不回来 —— 表现就是整页被顶起、桌面一片空白、Dock 跑到屏幕上方。
   * 这里只滚动最近的滚动容器，绝不惊动文档。
   * @param {Element} el
   * @param {{container?: Element, block?: string, smooth?: boolean}} [opts]
   *        block: "start" | "center" | "end"，默认 center
   * @return {boolean} 是否找到了可滚动容器
   */
  window.storyScrollToElement = function (el, opts) {
    if (!el) return false;
    opts = opts || {};
    var box = opts.container || findScrollableAncestor(el);
    if (!box) return false;
    var boxRect = box.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var block = opts.block || "center";
    var top = elRect.top - boxRect.top + box.scrollTop;
    if (block === "end") top = top + elRect.height - box.clientHeight;
    else if (block === "center") top = top - (box.clientHeight - elRect.height) / 2;
    var max = Math.max(0, box.scrollHeight - box.clientHeight);
    top = Math.max(0, Math.min(top, max));
    try {
      if (opts.smooth !== false && typeof box.scrollTo === "function") {
        box.scrollTo({ top: top, behavior: "smooth" });
      } else {
        box.scrollTop = top;
      }
    } catch (e) {
      box.scrollTop = top;
    }
    return true;
  };

  /**
   * 文档级滚动守卫（关键修复）：
   * overflow:hidden 只禁止「用户手势滚动」，程序滚动（scrollIntoView、输入框
   * 自动上移、输入法 / 系统栏把页面顶起来）依旧会改文档滚动量，而一旦被顶起来
   * 就再也回不去。这里在 scroll 事件的捕获阶段立刻把文档滚动量归零。
   */
  function installDocumentScrollGuard() {
    var scheduled = false;
    function repair() {
      scheduled = false;
      resetPageOffset();
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      if (typeof Promise === "function") Promise.resolve().then(repair);
      else window.setTimeout(repair, 0);
    }
    function isDocTarget(t) {
      return !t || t === window || t === document ||
        t === document.documentElement || t === document.body ||
        t === document.scrollingElement;
    }
    function onScroll(e) {
      if (!isDocTarget(e && e.target)) return;
      var se = document.scrollingElement || document.documentElement;
      if ((se && (se.scrollTop || se.scrollLeft)) ||
          window.pageYOffset || window.scrollY) {
        schedule();
      }
    }
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("scroll", onScroll, true);
    // 手势 / 触摸 / 失焦结束后再兜一层（输入法收起、手势返回都会留下滚动量）
    document.addEventListener("pointerup", schedule, true);
    document.addEventListener("touchend", schedule, true);
    document.addEventListener("focusout", schedule, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("scroll", function () {
        if ((window.pageYOffset || window.scrollY) !== 0) schedule();
      });
    }
  }

  function setupNativeViewport() {
    var html = document.documentElement;
    if (!html || !isNativeShell()) return; // 浏览器 / PWA 保留安全区留白
    // 壳层已隐藏状态栏与导航栏，安全区留白只会变成顶部白条、把应用底栏顶高，
    // 这里打上标记，交给 style.css 里的 html.story-native-shell 规则统一归零。
    html.classList.add("story-native-shell");
    resetPageOffset();

    // 键盘弹出会临时压缩视口：进入输入态前记下桌面滚动位置，键盘收起后原样还回去
    var desktopScrollBeforeInput = null;
    document.addEventListener("focusin", function () {
      var d = document.getElementById("desktop");
      desktopScrollBeforeInput = d ? (d.scrollTop || 0) : null;
    }, true);

    var settleTimer = null;
    function settle(delay, restoreDesktop) {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () {
        settleTimer = null;
        resetPageOffset();
        if (restoreDesktop && desktopScrollBeforeInput !== null) {
          var d = document.getElementById("desktop");
          if (d && (d.scrollTop || 0) !== desktopScrollBeforeInput) {
            d.scrollTop = desktopScrollBeforeInput;
          }
          desktopScrollBeforeInput = null;
        }
      }, delay);
    }

    document.addEventListener("focusout", function () { settle(260, true); }, true);
    window.addEventListener("resize", function () { settle(160, false); });
    window.addEventListener("orientationchange", function () { settle(240, false); });
  }

  // ---------- 5. 本地通知助手 ----------
  var nativeNotifyAvailable = function () {
    return !!(window.AndroidMCP && typeof window.AndroidMCP.showSystemNotification === "function");
  };

  window.StoryNotify = {
    _onNativeResult: null,
    available: nativeNotifyAvailable,
    has: function () {
      try {
        if (window.AndroidMCP && typeof window.AndroidMCP.hasNotificationPermission === "function") {
          return !!window.AndroidMCP.hasNotificationPermission();
        }
      } catch (e) { }
      return false;
    },
    /** 申请本地通知权限：原生环境走 Android 13+ 运行时授权，网页环境走 Web Notification */
    request: function (onResult) {
      if (!nativeNotifyAvailable()) {
        if (typeof Notification !== "undefined" && typeof Notification.requestPermission === "function") {
          try {
            Notification.requestPermission().then(function (p) {
              if (typeof onResult === "function") onResult(p === "granted");
            });
          } catch (e) { }
        }
        return;
      }
      this._onNativeResult = function (granted) {
        if (typeof onResult === "function") onResult(!!granted);
      };
      try {
        if (window.AndroidMCP && typeof window.AndroidMCP.requestNotificationPermission === "function") {
          window.AndroidMCP.requestNotificationPermission();
        }
      } catch (e) {
        console.warn("[storyBridge] request notification failed:", e);
      }
    },
    /** 打开本应用的通知设置页（用户手动关过通知时引导开启） */
    openSettings: function () {
      try {
        if (window.AndroidMCP && typeof window.AndroidMCP.openNotificationSettings === "function") {
          window.AndroidMCP.openNotificationSettings();
        }
      } catch (e) { }
    },
    /** 发一条本地通知 */
    notify: function (title, body) {
      if (nativeNotifyAvailable()) {
        try {
          window.AndroidMCP.showSystemNotification(title || "叙事诗", body || "");
          return true;
        } catch (e) { }
      }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(title || "叙事诗", { body: body || "" });
          return true;
        } catch (e) { }
      }
      return false;
    }
  };

  // ---------- 6. 启动钩子 ----------
  function boot() {
    hookAppNavigation();
    installDocumentScrollGuard();
    setupNativeViewport();
    console.log("[storyBridge] ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
