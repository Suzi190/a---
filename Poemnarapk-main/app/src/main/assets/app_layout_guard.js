/**
 * 布局自愈守卫（StoryLayoutGuard）
 * ============================================================
 * 背景
 * ------------------------------------------------------------
 * 本项目的全部页面都是「定高 + 内部容器滚动」布局：
 *     #phone-container（铺满视口）
 *        ├─ #desktop（flex:1，图标网格）
 *        ├─ #app-window-container（绝对定位的应用窗口层）
 *        ├─ #desktop-page-indicator
 *        └─ #dock（贴底）
 * 只要其中任何一环被写坏，真机上的症状是同一套：
 *     · Dock 跑到屏幕上方，下方露大片壁纸 / 空白
 *     · 桌面图标被压成只剩文字标签
 *     · 整页被顶起来，用户怎么拖都拖不回去
 *
 * 已知的两类成因：
 *   1) 文档级滚动（scrollIntoView / 输入框自动上移 / 输入法顶起）——
 *      style.css 的 html/body{overflow:hidden} 只挡用户手势，挡不住程序滚动，
 *      而程序滚动一旦发生就不会自己复位；
 *   2) 内联样式污染 —— 键盘处理、应用窗口（快穿局这类带底部输入框的页面）
 *      反复进出时往 #desktop / #dock / #phone-container 上写的高度、flex、
 *      transform、margin 没有还原，越进出越歪。
 *
 * 本文件只做最后一道「自检 + 自愈」：
 *   · 把文档级滚动量、html/body 上残留的 translate 归零；
 *   · 校验 #phone-container 是否与视口等大、Dock 是否贴底；
 *     不健康才动手，健康时一个样式都不写（幂等，无副作用）；
 *   · 在 窗口尺寸变化 / 方向切换 / 前后台切换 / 输入框失焦 / 开关应用 之后各跑一次，
 *     键盘收起这种「异步恢复」也能兜住。
 *
 * 真机上再复现时，控制台会打印 [StoryLayoutGuard] 记录，
 * 最近 20 条同时存在 localStorage['story-layout-guard-log']，可直接拷出来定位。
 * ============================================================
 */
(function () {
  "use strict";

  var LOG_KEY = "story-layout-guard-log";
  // 键盘收起 / 转屏 / 窗口动画都是「异步 + 多次重排」，多打几次才稳
  var PROBE_DELAYS = [0, 60, 240, 520, 1200];
  var pendingTimers = [];

  function viewportHeight() {
    return window.innerHeight || document.documentElement.clientHeight || 0;
  }

  function record(entry) {
    try {
      var log = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      if (!Array.isArray(log)) log = [];
      log.push({ t: new Date().toISOString(), d: entry });
      while (log.length > 20) log.shift();
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch (e) { /* 存储满了也不能影响布局 */ }
  }

  /** 壳层容器：只允许内容在内部滚动，它们自己永远不该有滚动量 */
  var SHELL_IDS = ["phone-container", "app-window-container"];

  /**
   * 壳层滚动量归零（只动 #phone-container / #app-window-container，不碰应用内部滚动）。
   *
   * 这是「Dock 跑到屏幕上方、下方露出大片壁纸」的直接成因：
   * #phone-container 是 overflow:hidden 的，用户拖不动，但浏览器**程序性滚动**
   * （input.focus() / scrollIntoView() 把输入框挪进可视区）照样能改它的 scrollTop，
   * 而且永远不会自己回到 0。滚动量 701 时，容器内所有子元素（桌面、应用层、Dock）
   * 整体上移 701px —— 元素自身的高度/位置都正常，只有相对视口的位置全错。
   */
  function resetShellScroll() {
    try {
      for (var i = 0; i < SHELL_IDS.length; i++) {
        var box = document.getElementById(SHELL_IDS[i]);
        if (!box) continue;
        if (box.scrollTop) box.scrollTop = 0;
        if (box.scrollLeft) box.scrollLeft = 0;
      }
    } catch (e) { }
  }

  /** 偏移归零：文档滚动 + 壳层滚动 + html/body 上被写进来的 transform */
  function resetDocumentOffset() {
    try {
      var se = document.scrollingElement || document.documentElement;
      if (se && (se.scrollTop || se.scrollLeft)) {
        se.scrollTop = 0;
        se.scrollLeft = 0;
      }
      if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      if (window.pageYOffset || window.scrollY) window.scrollTo(0, 0);
      resetShellScroll();
      var nodes = [document.documentElement, document.body];
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || !el.style) continue;
        var tf = el.style.transform;
        if (tf && tf !== "none") el.style.transform = "";
      }
    } catch (e) { }
  }

  function round(n) {
    return typeof n === "number" ? Math.round(n) : null;
  }

  /** 采集一次几何快照（只读，不写样式） */
  function inspect() {
    var phone = document.getElementById("phone-container");
    var desktop = document.getElementById("desktop");
    var dock = document.getElementById("dock");
    if (!phone || !dock) return null;
    var h = viewportHeight();
    var p = phone.getBoundingClientRect();
    var d = dock.getBoundingClientRect();
    var se = document.scrollingElement || document.documentElement;
    var wrap = document.getElementById("app-window-container");
    return {
      vh: round(h),
      phoneTop: round(p.top),
      phoneH: round(p.height),
      desktopH: desktop ? round(desktop.getBoundingClientRect().height) : null,
      dockTop: round(d.top),
      dockBottom: round(d.bottom),
      docTop: round(se ? se.scrollTop : 0),
      shellScroll: round(phone.scrollTop || 0),
      wrapScroll: round(wrap ? wrap.scrollTop : 0),
      bodyTf: (document.body && document.body.style.transform) || ""
    };
  }

  /** 健康判定：容器铺满视口 + Dock 贴底 + 文档/壳层没有残留偏移 */
  function problemsOf(info) {
    if (!info) return ["dom-missing"];
    var list = [];
    if (Math.abs(info.phoneTop || 0) > 1) list.push("phone.top=" + info.phoneTop);
    if (info.vh && Math.abs((info.phoneH || 0) - info.vh) > 2) list.push("phone.h=" + info.phoneH + "/" + info.vh);
    if (info.vh && (info.dockBottom || 0) < info.vh - 2) list.push("dock.bottom=" + info.dockBottom + "/" + info.vh);
    if (info.docTop) list.push("doc.scrollTop=" + info.docTop);
    if (info.shellScroll) list.push("shell.scrollTop=" + info.shellScroll);
    if (info.wrapScroll) list.push("wrap.scrollTop=" + info.wrapScroll);
    if (info.bodyTf) list.push("body.transform=" + info.bodyTf);
    return list;
  }


  /**
   * 第一刀：只清「内联污染」，把盒模型交回 CSS。
   */
  function clearInlineOverrides() {
    var phone = document.getElementById("phone-container");
    var desktop = document.getElementById("desktop");
    var dock = document.getElementById("dock");
    if (phone) {
      // 定格在视口上：即使文档被滚走、被 translate 起来，也不会带着整页跑
      phone.style.position = "fixed";
      phone.style.top = "0";
      phone.style.left = "0";
      phone.style.bottom = "";
      phone.style.transform = "";
      phone.style.marginTop = "";
      phone.style.height = "";   // 交回 100% / 100vh，跟随 WebView 真实视口
      phone.style.width = "";
      phone.style.display = "flex";
      phone.style.flexDirection = "column";
      phone.style.justifyContent = "space-between";
    }
    if (desktop) {
      desktop.style.flex = "1 1 auto";
      desktop.style.minHeight = "0";
      desktop.style.maxHeight = "none";
      desktop.style.height = "";
      desktop.style.transform = "";
    }
    if (dock) {
      dock.style.flex = "0 0 auto";
      dock.style.marginTop = "auto";
      dock.style.height = "";
      dock.style.transform = "";
      try {
        var pos = window.getComputedStyle(dock).position;
        // 防它被写成 fixed/absolute 后脱离流（脱离流就会和桌面重叠、露出下方空白）。
        // 注意：光把 position 改回来不够 —— 残留的 top/left 在 relative 下依然生效，
        // 视觉上 Dock 会整体下移/上移，所以偏移量必须一起清掉。
        if (pos !== "static" && pos !== "relative") {
          dock.style.position = "relative";
          dock.style.top = "";
          dock.style.left = "";
          dock.style.right = "";
          dock.style.bottom = "";
        }
      } catch (e) { }
    }
  }

  /** 第二刀：还不健康就按当前视口把高度直接钉死（最粗暴但一定生效） */
  function pinToViewport() {
    var phone = document.getElementById("phone-container");
    var h = viewportHeight();
    if (phone && h) phone.style.height = h + "px";
  }

  /**
   * 跑一次自检；健康的话直接返回 null，一个样式都不写。
   * @param {string} reason 触发来源，便于看日志
   */
  function runProbe(reason) {
    if (!document.getElementById("phone-container")) return null;
    var before = inspect();               // 先拍快照，日志里才看得到真实病因
    var problems = problemsOf(before);
    if (!problems.length) return null;    // 健康：一个样式都不写

    resetDocumentOffset();                // 第一刀：文档 / 壳层滚动量归零
    clearInlineOverrides();               // 第二刀：清内联污染
    resetDocumentOffset();
    var after = inspect();
    var left = problemsOf(after);
    if (left.length) {
      pinToViewport();                    // 第三刀：还不健康就按视口把高度钉死
      after = inspect();
      left = problemsOf(after);
    }

    var entry = {
      reason: reason,
      problems: problems,
      before: before,
      after: after,
      left: left
    };
    record(entry);
    try {
      console.warn("[StoryLayoutGuard] 布局异常已自愈 (" + reason + ")，残余项：" + (left.join(",") || "无"), entry);
    } catch (e) { }
    return entry;
  }

  /** 延迟多次自检（同一批触发的重复调用会被合并） */
  function schedule(reason) {
    for (var i = 0; i < pendingTimers.length; i++) window.clearTimeout(pendingTimers[i]);
    pendingTimers.length = 0;
    for (var j = 0; j < PROBE_DELAYS.length; j++) {
      (function (delay) {
        pendingTimers.push(window.setTimeout(function () { runProbe(reason); }, delay));
      })(PROBE_DELAYS[j]);
    }
  }

  function boot() {
    window.addEventListener("resize", function () { schedule("resize"); });
    window.addEventListener("orientationchange", function () { schedule("orientationchange"); });
    window.addEventListener("pageshow", function () { schedule("pageshow"); });
    window.addEventListener("blur", function () { schedule("window-blur"); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) schedule("visible");
    });
    // 输入法收起、应用窗口滑出动画都晚于 focusout，多次探测就是为它们准备的
    document.addEventListener("focusout", function () { schedule("focusout"); }, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () { schedule("visualViewport-resize"); });
    }
    // 输入框获得焦点时，浏览器会把「最近的可滚祖先」滚到可视区，壳层容器也在名单里。
    // 立刻把壳层滚动量抹掉，等于从源头掐掉这条故障路径（不影响应用窗口内部的滚动）。
    document.addEventListener("focusin", function () { resetShellScroll(); }, true);
    // overflow:hidden 的容器被程序性滚动时仍会派发 scroll 事件，这里当场抹平，
    // 避免出现「滚走 → 等下一次探测才回位」的一帧抖动
    document.addEventListener("scroll", function (ev) {
      var t = ev.target;
      if (t && t.id && SHELL_IDS.indexOf(t.id) !== -1) resetShellScroll();
    }, true);
    schedule("boot");
  }

  window.StoryLayoutGuard = {
    /** 安排一批自检（开关应用、退出快穿局等关键节点调用） */
    repair: schedule,
    /** 立刻自检一次（不延迟） */
    repairNow: runProbe,
    /** 只复位文档偏移 */
    resetOffset: resetDocumentOffset,
    /** 只读快照，便于排查 */
    inspect: inspect,
    /** 只判定不自愈：返回异常项数组（空数组＝健康），同时把快照打到控制台 */
    problems: function () {
      var info = inspect();
      var list = problemsOf(info);
      try { console.log("[StoryLayoutGuard] problems:", list, info); } catch (e) { }
      return list;
    },
    /** 读取历史修复记录 */
    log: function () {
      try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch (e) { return []; }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
