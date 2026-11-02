/**
 * app_desktop_presets.js - 系统内置桌面 UI 预设主题库
 * 包含：清透凉夏 (Ins 拟物风) images 文件夹 .jpg 本地路径适配版
 */

window.DESKTOP_PRESETS = {
  clear_cool_summer: {
    name: "清透凉夏 (Ins拟物风)",
    confirmText: "确定要应用【清透凉夏】UI预设吗？这将会更新您的桌面布局、背景壁纸与全局注入样式。",
    // 用于识别「localStorage 里存的是不是本预设的 CSS」，供内置样式自动升级使用
    cssSignature: "/* 清透凉夏 - 桌面微调 */",
    wallpaper: "./images/wallpaper_summer.jpg",
    dockOpacity: "35",
    activeCss: `@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

/* 清透凉夏 - 桌面微调 */
#desktop {
  padding: 16px 14px 14px 14px !important;
}

/* 彻底擦除图标外壳边框与背景，显示纯悬浮 SVG 图标 */
.app-icon .icon-wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  margin-bottom: 2px !important;
}

.app-icon:active .icon-wrapper {
  transform: scale(0.88) !important;
}

/* 莫兰迪低纯度柔和浅色调系 */
.app-icon .icon-wrapper svg {
  width: 38px !important;
  height: 38px !important;
  filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.1)) drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9)) !important;
  mix-blend-mode: normal !important;
  opacity: 1 !important;
  transition: transform 0.2s ease !important;
}

.app-icon[data-app="chat"] .icon-wrapper svg { color: #38bdf8 !important; }       /* 浅冰蓝 */
.app-icon[data-app="forum"] .icon-wrapper svg { color: #34d399 !important; }      /* 柔薄荷 */
.app-icon[data-app="deeptalk"] .icon-wrapper svg { color: #c084fc !important; }   /* 淡紫罗兰 */
.app-icon[data-app="couples"] .icon-wrapper svg { color: #fb7185 !important; }    /* 浅甜莓 */
.app-icon[data-app="reader"] .icon-wrapper svg { color: #fbbf24 !important; }     /* 柔暖琥珀 */
.app-icon[data-app="archive"] .icon-wrapper svg { color: #60a5fa !important; }    /* 浅天蓝 */
.app-icon[data-app="world_book"] .icon-wrapper svg { color: #2dd4bf !important; }/* 浅青绿 */
.app-icon[data-app="music"] .icon-wrapper svg { color: #f472b6 !important; }      /* 樱花粉 */
.app-icon[data-app="shopping"] .icon-wrapper svg { color: #ff6b35 !important; }  /* 淘宝橙 */
.app-icon[data-app="encounter"] .icon-wrapper svg { color: #a78bfa !important; } /* 邂逅紫 */
.app-icon[data-app="settings"] .icon-wrapper svg { color: #64748b !important; }  /* 烟灰钛 */

.app-icon span {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #334155 !important;
  letter-spacing: 0.3px !important;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.9) !important;
}

/* Dock 栏：水晶玻璃卡片 */
.dock-container {
  background-color: rgba(255, 255, 255, 0.38) !important;
  backdrop-filter: blur(25px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(25px) saturate(200%) !important;
  border-radius: 32px !important;
  border: 1.5px solid rgba(255, 255, 255, 0.75) !important;
  box-shadow: 0 12px 32px rgba(148, 163, 184, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.9) !important;
}`,
    widgets: {
      // 1. 第一页顶层 4x3：等长错落 5 竖条 + 花体字时钟 (预置 ./images/widget_top_photo.jpg)
      widget_clear_summer_top: {
        id: "widget_clear_summer_top",
        name: "清透凉夏·花体时钟与等长错落拼图",
        widthSpan: 4,
        heightSpan: 3,
        html: `<div id="cs-top-widget" style="width:100%; height:100%; box-sizing:border-box; padding:2px; background:transparent !important; border:none !important; box-shadow:none !important; display:flex; flex-direction:column; justify-content:space-between; user-select:none; font-family:-apple-system,BlinkMacSystemFont,sans-serif; overflow:visible !important;">
  <!-- 左上角花体艺术字时钟 -->
  <div style="display:flex; justify-content:flex-start; align-items:flex-end; padding-left:2px; height:32px;">
    <div id="cs-top-time" contenteditable="true" style="font-family:'Dancing Script', cursive, sans-serif; font-size:40px; font-weight:700; line-height:0.9; color:#334155; text-shadow:0 2px 8px rgba(255,255,255,0.9); outline:none; cursor:text;">12:00</div>
  </div>

  <!-- 5 个等长纵向错落竖条 -->
  <div id="cs-stagger-container" onclick="document.getElementById('cs-top-file-input').click()" style="width:100%; height:calc(100% - 38px); display:flex; gap:6px; align-items:center; cursor:pointer; margin-top:6px; overflow:visible;" title="点击上传照片">
    <input type="file" id="cs-top-file-input" accept="image/*" style="display:none;">
    <div class="cs-v-bar" style="flex:1; height:100%; transform:translateY(-5px); border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.88); box-shadow:0 6px 14px rgba(15,23,42,0.06); background-image:url('./images/widget_top_photo.jpg'); background-size:500% 100%; background-position:0% 50%;"></div>
    <div class="cs-v-bar" style="flex:1; height:100%; transform:translateY(6px); border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.88); box-shadow:0 6px 14px rgba(15,23,42,0.06); background-image:url('./images/widget_top_photo.jpg'); background-size:500% 100%; background-position:25% 50%;"></div>
    <div class="cs-v-bar" style="flex:1; height:100%; transform:translateY(-2px); border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.88); box-shadow:0 6px 14px rgba(15,23,42,0.06); background-image:url('./images/widget_top_photo.jpg'); background-size:500% 100%; background-position:50% 50%;"></div>
    <div class="cs-v-bar" style="flex:1; height:100%; transform:translateY(7px); border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.88); box-shadow:0 6px 14px rgba(15,23,42,0.06); background-image:url('./images/widget_top_photo.jpg'); background-size:500% 100%; background-position:75% 50%;"></div>
    <div class="cs-v-bar" style="flex:1; height:100%; transform:translateY(-4px); border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.88); box-shadow:0 6px 14px rgba(15,23,42,0.06); background-image:url('./images/widget_top_photo.jpg'); background-size:500% 100%; background-position:100% 50%;"></div>
  </div>
</div>
<script>
(function() {
  const container = document.getElementById("cs-top-widget");
  if (!container) return;

  const savedImg = localStorage.getItem("cs_store_top_img") || "./images/widget_top_photo.jpg";
  const bars = container.querySelectorAll(".cs-v-bar");
  bars.forEach(bar => { bar.style.backgroundImage = "url('" + savedImg + "')"; });

  const savedTime = localStorage.getItem("cs_store_top_time");
  const timeEl = document.getElementById("cs-top-time");
  if (savedTime && timeEl) timeEl.innerText = savedTime;

  function updateTime() {
    if (!timeEl || timeEl === document.activeElement) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    timeEl.innerText = hh + ":" + mm;
  }
  updateTime();
  const timer = setInterval(updateTime, 10000);

  if (timeEl) {
    timeEl.onblur = function() {
      localStorage.setItem("cs_store_top_time", timeEl.innerText.trim());
    };
  }

  function processSquareImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const img = new Image();
      img.onload = function() {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 600, 600);
        callback(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  const fileInput = document.getElementById("cs-top-file-input");
  if (fileInput) {
    fileInput.onchange = function(e) {
      if (e.target.files && e.target.files[0]) {
        processSquareImage(e.target.files[0], function(croppedUrl) {
          bars.forEach(bar => { bar.style.backgroundImage = "url('" + croppedUrl + "')"; });
          localStorage.setItem("cs_store_top_img", croppedUrl);
        });
      }
    };
  }

  const obs = new MutationObserver(() => {
    if (!document.contains(container)) {
      clearInterval(timer);
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
</script>`
      },

      // 2. 第一页中部 2x3：拍立得组件 (预置 ./images/widget_polaroid_photo.jpg)
      //    高度由 2 行加到 3 行：原先照片区太扁，加高后竖构图更像真实拍立得，位置（槽位 12）与列宽不变
      widget_clear_summer_polaroid: {
        id: "widget_clear_summer_polaroid",
        name: "清透凉夏·拍立得组件",
        widthSpan: 2,
        heightSpan: 3,
        html: `<div id="cs-polaroid-widget" style="width:100%; height:100%; box-sizing:border-box; padding:8px 8px 10px 8px; border-radius:18px; background:rgba(255,255,255,0.75); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1.5px solid rgba(255,255,255,0.9); box-shadow:0 10px 25px rgba(0,0,0,0.06); display:flex; flex-direction:column; align-items:center; transform:rotate(-1deg); user-select:none; font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <input type="file" id="cs-pol-file-input" accept="image/*" style="display:none;">
  <div id="cs-pol-photo" onclick="document.getElementById('cs-pol-file-input').click()" style="width:100%; flex:1; border-radius:12px; overflow:hidden; background:#f0f9ff; background-image:url('./images/widget_polaroid_photo.jpg'); background-size:cover; background-position:center; cursor:pointer; border:1px solid rgba(0,0,0,0.04);"></div>
  <div id="cs-pol-caption" contenteditable="true" style="margin-top:6px; font-family:'Dancing Script', cursive, sans-serif; font-size:13px; font-weight:700; color:#334155; text-align:center; outline:none; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:text;">Summer Memory</div>
</div>
<script>
(function() {
  const container = document.getElementById("cs-polaroid-widget");
  if (!container) return;

  const savedImg = localStorage.getItem("cs_store_pol_img") || "./images/widget_polaroid_photo.jpg";
  const photoDiv = document.getElementById("cs-pol-photo");
  if (photoDiv) photoDiv.style.backgroundImage = "url('" + savedImg + "')";
  
  const savedCap = localStorage.getItem("cs_store_pol_cap");
  const capEl = document.getElementById("cs-pol-caption");
  if (savedCap && capEl) capEl.innerText = savedCap;

  if (capEl) {
    capEl.onblur = function() {
      localStorage.setItem("cs_store_pol_cap", capEl.innerText.trim());
    };
  }

  const fileInput = document.getElementById("cs-pol-file-input");
  if (fileInput && photoDiv) {
    fileInput.onchange = function(e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const img = new Image();
          img.onload = function() {
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            const canvas = document.createElement("canvas");
            canvas.width = 500;
            canvas.height = 500;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 500, 500);
            const cropped = canvas.toDataURL("image/jpeg", 0.88);
            photoDiv.style.backgroundImage = "url('" + cropped + "')";
            localStorage.setItem("cs_store_pol_img", cropped);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    };
  }
})();
</script>`
      },

      // 3. 第二页第 1-3 排 4x3：iOS 短信伪对话组件 (预置 ./images/avatar_char1.jpg 与 ./images/avatar_char2.jpg)
      widget_clear_summer_dialogue: {
        id: "widget_clear_summer_dialogue",
        name: "清透凉夏·iOS短信风伪对话组件",
        widthSpan: 4,
        heightSpan: 3,
        html: `<div id="cs-dialogue-widget" style="width:100%; height:100%; box-sizing:border-box; padding:2px 4px; background:transparent !important; border:none !important; box-shadow:none !important; display:flex; flex-direction:column; justify-content:space-between; user-select:none; font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <input type="file" id="cs-dlg-file-1" accept="image/*" style="display:none;">
  <input type="file" id="cs-dlg-file-2" accept="image/*" style="display:none;">
  
  <!-- 上半部分：头像 1 + 3 行长短错落左对齐 iOS 磨砂气泡 -->
  <div style="display:flex; flex-direction:column; align-items:flex-start; gap:4px; width:100%;">
    <div id="cs-dlg-avatar-1" onclick="document.getElementById('cs-dlg-file-1').click()" style="width:48px; height:48px; border-radius:50%; background:#bae6fd; background-image:url('./images/avatar_char1.jpg'); background-size:cover; border:3px solid rgba(255,255,255,0.88); backdrop-filter:blur(10px); box-shadow:0 6px 16px rgba(15,23,42,0.1); flex-shrink:0; cursor:pointer; margin-left:2px; margin-bottom:2px;" title="点击换头像"></div>
    
    <div id="cs-dlg-t1-1" contenteditable="true" style="padding:7px 13px; border-radius:18px; background:rgba(255,255,255,0.72); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1.5px solid rgba(255,255,255,0.92); box-shadow:0 4px 14px rgba(15,23,42,0.06); font-size:12px; font-weight:600; color:#1e293b; outline:none; cursor:text; max-width:72%; text-align:left;">
      "今天的天空像冰汽水一样。"
    </div>
    <div id="cs-dlg-t1-2" contenteditable="true" style="padding:7px 13px; border-radius:18px; background:rgba(255,255,255,0.72); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1.5px solid rgba(255,255,255,0.92); box-shadow:0 4px 14px rgba(15,23,42,0.06); font-size:12px; font-weight:600; color:#1e293b; outline:none; cursor:text; max-width:88%; text-align:left;">
      "想和你去风平浪静的海滩走走。"
    </div>
    <div id="cs-dlg-t1-3" contenteditable="true" style="padding:7px 13px; border-radius:18px; background:rgba(255,255,255,0.72); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1.5px solid rgba(255,255,255,0.92); box-shadow:0 4px 14px rgba(15,23,42,0.06); font-size:12px; font-weight:600; color:#1e293b; outline:none; cursor:text; max-width:55%; text-align:left;">
      "记得带上相机。"
    </div>
  </div>

  <!-- 下半部分：2 行长短错落右对齐 iOS 磨砂气泡 + 头像 2 -->
  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; width:100%; margin-top:4px;">
    <div id="cs-dlg-t2-1" contenteditable="true" style="padding:7px 13px; border-radius:18px; background:rgba(224,242,254,0.82); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1.5px solid rgba(255,255,255,0.92); box-shadow:0 4px 14px rgba(15,23,42,0.06); font-size:12px; font-weight:600; color:#0369a1; outline:none; cursor:text; max-width:68%; text-align:right;">
      "好啊，那晚饭后就出发。"
    </div>
    <div id="cs-dlg-t2-2" contenteditable="true" style="padding:7px 13px; border-radius:18px; background:rgba(224,242,254,0.82); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1.5px solid rgba(255,255,255,0.92); box-shadow:0 4px 14px rgba(15,23,42,0.06); font-size:12px; font-weight:600; color:#0369a1; outline:none; cursor:text; max-width:85%; text-align:right;">
      "刚好可以赶上看落日余晖。"
    </div>

    <div id="cs-dlg-avatar-2" onclick="document.getElementById('cs-dlg-file-2').click()" style="width:48px; height:48px; border-radius:50%; background:#fef08a; background-image:url('./images/avatar_char2.jpg'); background-size:cover; border:3px solid rgba(255,255,255,0.88); backdrop-filter:blur(10px); box-shadow:0 6px 16px rgba(15,23,42,0.1); flex-shrink:0; cursor:pointer; margin-right:2px; margin-top:2px;" title="点击换头像"></div>
  </div>
</div>
<script>
(function() {
  const container = document.getElementById("cs-dialogue-widget");
  if (!container) return;

  const avt1 = document.getElementById("cs-dlg-avatar-1");
  const avt2 = document.getElementById("cs-dlg-avatar-2");
  
  const t1_1 = document.getElementById("cs-dlg-t1-1");
  const t1_2 = document.getElementById("cs-dlg-t1-2");
  const t1_3 = document.getElementById("cs-dlg-t1-3");
  
  const t2_1 = document.getElementById("cs-dlg-t2-1");
  const t2_2 = document.getElementById("cs-dlg-t2-2");

  const sAvt1 = localStorage.getItem("cs_store_dlg_avt1") || "./images/avatar_char1.jpg";
  if (avt1) avt1.style.backgroundImage = "url('" + sAvt1 + "')";
  
  const sAvt2 = localStorage.getItem("cs_store_dlg_avt2") || "./images/avatar_char2.jpg";
  if (avt2) avt2.style.backgroundImage = "url('" + sAvt2 + "')";

  const sT1_1 = localStorage.getItem("cs_store_dlg_t1_1"); if (sT1_1 && t1_1) t1_1.innerText = sT1_1;
  const sT1_2 = localStorage.getItem("cs_store_dlg_t1_2"); if (sT1_2 && t1_2) t1_2.innerText = sT1_2;
  const sT1_3 = localStorage.getItem("cs_store_dlg_t1_3"); if (sT1_3 && t1_3) t1_3.innerText = sT1_3;

  const sT2_1 = localStorage.getItem("cs_store_dlg_t2_1"); if (sT2_1 && t2_1) t2_1.innerText = sT2_1;
  const sT2_2 = localStorage.getItem("cs_store_dlg_t2_2"); if (sT2_2 && t2_2) t2_2.innerText = sT2_2;

  if (t1_1) t1_1.onblur = function() { localStorage.setItem("cs_store_dlg_t1_1", t1_1.innerText.trim()); };
  if (t1_2) t1_2.onblur = function() { localStorage.setItem("cs_store_dlg_t1_2", t1_2.innerText.trim()); };
  if (t1_3) t1_3.onblur = function() { localStorage.setItem("cs_store_dlg_t1_3", t1_3.innerText.trim()); };

  if (t2_1) t2_1.onblur = function() { localStorage.setItem("cs_store_dlg_t2_1", t2_1.innerText.trim()); };
  if (t2_2) t2_2.onblur = function() { localStorage.setItem("cs_store_dlg_t2_2", t2_2.innerText.trim()); };

  function bindSquareFile(fileId, avatarId, storeKey) {
    const fileEl = document.getElementById(fileId);
    const avtEl = document.getElementById(avatarId);
    if (fileEl && avtEl) {
      fileEl.onchange = function(e) {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
              const size = Math.min(img.width, img.height);
              const sx = (img.width - size) / 2;
              const sy = (img.height - size) / 2;
              const canvas = document.createElement("canvas");
              canvas.width = 300;
              canvas.height = 300;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, sx, sy, size, size, 0, 0, 300, 300);
              const cropped = canvas.toDataURL("image/jpeg", 0.88);
              avtEl.style.backgroundImage = "url('" + cropped + "')";
              localStorage.setItem(storeKey, cropped);
            };
            img.src = evt.target.result;
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      };
    }
  }
  bindSquareFile("cs-dlg-file-1", "cs-dlg-avatar-1", "cs_store_dlg_avt1");
  bindSquareFile("cs-dlg-file-2", "cs-dlg-avatar-2", "cs_store_dlg_avt2");
})();
</script>`
      },

      // 4. 第二页第 5 排 4x1：无背景悬空细长播放进度条组件 (纯 SVG，无文字 Emoji)
      widget_clear_summer_music: {
        id: "widget_clear_summer_music",
        name: "清透凉夏·悬空音乐播放器",
        widthSpan: 4,
        heightSpan: 1,
        html: `<div id="cs-music-widget" style="width:100%; height:100%; box-sizing:border-box; padding:0 8px; background:transparent !important; border:none !important; box-shadow:none !important; display:flex; flex-direction:column; justify-content:center; gap:8px; user-select:none;">
  <!-- 细长进度条 -->
  <div style="width:100%; height:4px; background:rgba(255,255,255,0.45); border-radius:2px; position:relative; cursor:pointer;" onclick="var p=event.offsetX/this.clientWidth*100; document.getElementById('cs-m-progress').style.width=p+'%'; localStorage.setItem('cs_store_m_prog', p);">
    <div id="cs-m-progress" style="width:42%; height:100%; background:#38bdf8; border-radius:2px; position:relative; box-shadow:0 0 8px rgba(56,189,248,0.5);">
      <div style="position:absolute; right:-4px; top:-3px; width:10px; height:10px; border-radius:50%; background:#ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.18);"></div>
    </div>
  </div>

  <!-- 控制按键行 (和谐冰蓝与哑光灰钛色，纯 SVG) -->
  <div style="display:flex; justify-content:space-around; align-items:center; padding:0 12px;">
    <!-- 循环模式 -->
    <div id="cs-m-mode" onclick="this.classList.toggle('active');" style="color:#64748b; cursor:pointer;" title="播放模式">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 4px rgba(255,255,255,0.8));"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    </div>
    <!-- 上一曲 -->
    <div onclick="var p=document.getElementById('cs-m-progress'); p.style.width='0%';" style="color:#334155; cursor:pointer;" title="上一曲">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="filter:drop-shadow(0 2px 4px rgba(255,255,255,0.8));"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
    </div>
    <!-- 播放/暂停 -->
    <div id="cs-m-playbtn" onclick="var svg=this.querySelector('svg'); if(this.dataset.playing==='1'){this.dataset.playing='0'; svg.innerHTML='<path d=\\'M8 5v14l11-7z\\'/>';}else{this.dataset.playing='1'; svg.innerHTML='<path d=\\'M6 19h4V5H6v14zm8-14v14h4V5h-4z\\'/>';}" data-playing="0" style="color:#38bdf8; cursor:pointer;" title="播放/暂停">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" style="filter:drop-shadow(0 2px 6px rgba(56,189,248,0.3));"><path d="M8 5v14l11-7z"/></svg>
    </div>
    <!-- 下一曲 -->
    <div onclick="var p=document.getElementById('cs-m-progress'); p.style.width='75%';" style="color:#334155; cursor:pointer;" title="下一曲">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="filter:drop-shadow(0 2px 4px rgba(255,255,255,0.8));"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
    </div>
    <!-- 红心收藏 -->
    <div id="cs-m-heart" onclick="var path=this.querySelector('path'); if(this.dataset.liked==='1'){this.dataset.liked='0'; this.style.color='#64748b'; path.setAttribute('fill','none'); localStorage.setItem('cs_store_m_liked','0');}else{this.dataset.liked='1'; this.style.color='#fb7185'; path.setAttribute('fill','currentColor'); localStorage.setItem('cs_store_m_liked','1');}" data-liked="0" style="color:#64748b; cursor:pointer;" title="收藏">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 4px rgba(255,255,255,0.8));"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    </div>
  </div>
</div>
<script>
(function() {
  const container = document.getElementById("cs-music-widget");
  if (!container) return;
  const sProg = localStorage.getItem("cs_store_m_prog");
  const pBar = document.getElementById("cs-m-progress");
  if (sProg && pBar) pBar.style.width = sProg + "%";

  const sLiked = localStorage.getItem("cs_store_m_liked");
  const heart = document.getElementById("cs-m-heart");
  if (sLiked === "1" && heart) {
    heart.dataset.liked = "1";
    heart.style.color = "#fb7185";
    const path = heart.querySelector("path");
    if (path) path.setAttribute("fill", "currentColor");
  }
})();
</script>`
      }
    },

    // 绑定小部件落地槽位（每页 28 格：4 列 × 7 行）
    placedDesktop: {
      "0": "widget_clear_summer_top",
      "12": "widget_clear_summer_polaroid",
      "28": "widget_clear_summer_dialogue",
      "44": "widget_clear_summer_music"
    },

    // 桌面两页网格排版映射（每页 4 列 × 7 行 = 28 格）
    // 规则：chat / world_book / archive 只放 dock 栏，不占主页面格子
    // 注意 widget 物理覆盖范围（cols=4）：
    //   widget_clear_summer_top: 4x3 在槽位0，覆盖 0-11
    //   widget_clear_summer_polaroid: 2x3 在槽位12，覆盖 12,13,16,17,20,21
    //   因此第一页可用 app 槽位为：14,15,18,19，以及 22-27
    //   widget_clear_summer_dialogue: 4x3 在槽位28，覆盖 28-39
    //   widget_clear_summer_music: 4x1 在槽位44，覆盖 44-47
    //   因此第二页可用 app 槽位为：40-43（第5排被播放器组件占用）
    desktopLayout: [
      // === 第一页 (0~27) === 槽位 14,15,18,19 可用（20,21 已被 2x3 拍立得覆盖）
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
      null, null, "encounter", "deeptalk",
      null, null, "reader", "forum",
      null, null, null, null,
      null, null, null, null,

      // === 第二页 (28~55) === 槽位 40-43 可用（44-47 被播放器组件占用）
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
      "couples", "music", "shopping", "quicktravel",
      null, null, null, null,
      null, null, null, null,
      null, null, null, null
    ],

    // 底部 Dock 栏排布
    dockLayout: ["settings", "chat", "archive", "world_book"]
  },

  // ============================================================
  // 静谧蓝玻璃 (blue_glass_calm)
  // 一屏到底的玻璃时光卡桌面：4 列 × 7 行 = 28 格 / 页
  //   · 槽位 0 放置 4×5 玻璃组件（头像 / 时间 / 照片 / 日历 / 圆点 / 文案），物理覆盖 0-19
  //   · 槽位 20-27 放置 8 个 App，正好两排铺满第 6、7 行
  // ============================================================
  blue_glass_calm: {
    name: "静谧蓝玻璃 (时间与日历)",
    confirmText: "确定要应用【静谧蓝玻璃】UI预设吗？这将会更新您的桌面布局、背景壁纸与全局注入样式。",
    // 用于识别「localStorage 里存的是不是本预设的 CSS」，供内置样式自动升级使用
    cssSignature: "/* ===== 静谧蓝玻璃 - 桌面微调 ===== */",
    // 蓝白渐变 + 柔和光斑壁纸：内联 SVG dataURL，自包含、不依赖额外图片资源
    wallpaper: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1560" preserveAspectRatio="xMidYMid slice">' +
        '<defs>' +
          '<linearGradient id="bgp-g1" x1="0" y1="0" x2="0.35" y2="1">' +
            '<stop offset="0" stop-color="#eef8ff"/>' +
            '<stop offset="0.42" stop-color="#d6edff"/>' +
            '<stop offset="1" stop-color="#c2e3fb"/>' +
          '</linearGradient>' +
          '<radialGradient id="bgp-g2" cx="0.24" cy="0.16" r="0.62">' +
            '<stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>' +
            '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<radialGradient id="bgp-g3" cx="0.82" cy="0.74" r="0.58">' +
            '<stop offset="0" stop-color="#8ec9f7" stop-opacity="0.5"/>' +
            '<stop offset="1" stop-color="#8ec9f7" stop-opacity="0"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<rect width="720" height="1560" fill="url(#bgp-g1)"/>' +
        '<rect width="720" height="1560" fill="url(#bgp-g2)"/>' +
        '<rect width="720" height="1560" fill="url(#bgp-g3)"/>' +
        '<circle cx="118" cy="320" r="74" fill="#ffffff" opacity="0.34"/>' +
        '<circle cx="596" cy="962" r="112" fill="#ffffff" opacity="0.2"/>' +
        '<circle cx="352" cy="1330" r="150" fill="#ffffff" opacity="0.16"/>' +
      '</svg>'
    ),
    dockOpacity: "30",
    activeCss: `/* ===== 静谧蓝玻璃 - 桌面微调 ===== */
#desktop {
  padding: 12px 14px 8px 14px !important;
}

/* 组件槽位与容器：大圆角玻璃外框，与组件内部 22px 圆角对齐 */
#desktop-grid > .desktop-slot.has-widget,
#desktop-grid > .desktop-slot.has-widget .desktop-widget-container {
  border-radius: 22px !important;
}

/* App 图标：圆形无色磨砂玻璃圆盘 + 中性灰细线图标（开源 Lucide 图标集） */
.app-icon .icon-wrapper {
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.26) 52%, rgba(255, 255, 255, 0.18) 100%) !important;
  background-color: rgba(255, 255, 255, 0.30) !important;
  border: 1px solid rgba(255, 255, 255, 0.70) !important;
  border-radius: 50% !important;
  box-shadow: 0 0 0 0.5px rgba(15, 23, 42, 0.07), 0 10px 24px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.90), inset 0 -1px 0 rgba(15, 23, 42, 0.05) !important;
  backdrop-filter: blur(18px) saturate(120%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(120%) !important;
  color: #4f5b69 !important;
  overflow: hidden !important;
}
/* 桌面：圆形圆盘上限 52px（原 58px 方盘偏大），窄屏按槽位高度自动收缩，绝不撑破 4×7 网格。
   选择器故意带两层 id，优先级高于 app_desktop.js 注入的默认方盘尺寸，避免被反盖 */
#desktop #desktop-grid .app-icon .icon-wrapper {
  width: auto !important;
  height: clamp(0px, calc(100% - 20px), 52px) !important;
  max-width: 100% !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: 50% !important;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.26) 52%, rgba(255, 255, 255, 0.18) 100%) !important;
  background-color: rgba(255, 255, 255, 0.30) !important;
}
/* Dock：4 个圆盘统一 50px，比桌面略小一圈更精致 */
#dock-grid .app-icon .icon-wrapper {
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.22) 100%) !important;
  background-color: rgba(255, 255, 255, 0.26) !important;
}
/* 图标线稿：内缩留白加大（视觉更小巧），统一中性石墨灰 —— 无色，不描蓝紫 */
.app-icon .icon-wrapper svg {
  color: #4f5b69 !important;
  stroke: currentColor !important;
  filter: none !important;
}
/* 桌面/Dock 的 svg 尺寸需要压过 app_desktop.js 里的 padding:15% 默认值 */
#desktop #desktop-grid .app-icon .icon-wrapper svg,
#dock-grid .app-icon .icon-wrapper svg {
  width: 100% !important;
  height: 100% !important;
  padding: 22% !important;
  box-sizing: border-box !important;
}
/* 自定义图片图标一并裁成圆形，与线稿图标保持同一形状语言 */
.app-icon .icon-wrapper .custom-icon-img {
  border-radius: 50% !important;
}
.app-icon span {
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px !important;
  color: #3f4855 !important;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85) !important;
}

/* Dock 栏：无色磨砂玻璃长条（半透明 + 背景模糊 + 顶部高光边） */
.dock-container {
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.30) 52%, rgba(255, 255, 255, 0.22) 100%) !important;
  background-color: rgba(255, 255, 255, 0.28) !important;
  backdrop-filter: blur(26px) saturate(120%) !important;
  -webkit-backdrop-filter: blur(26px) saturate(120%) !important;
  border: 1px solid rgba(255, 255, 255, 0.66) !important;
  border-radius: 34px !important;
  box-shadow: 0 0 0 0.5px rgba(15, 23, 42, 0.07), 0 16px 34px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.90) !important;
}
.dock-container .icon-wrapper {
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.22) 100%) !important;
  background-color: rgba(255, 255, 255, 0.24) !important;
  border: 1px solid rgba(255, 255, 255, 0.70) !important;
  border-radius: 50% !important;
  box-shadow: 0 0 0 0.5px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}

/* 翻页指示器 */
#desktop-page-indicator .page-dot {
  background-color: rgba(138, 142, 148, 0.38) !important;
}
#desktop-page-indicator .page-dot.active {
  background-color: rgba(96, 100, 106, 0.85) !important;
}
`,
    widgets: {
      // 4×5 玻璃时光卡：头像 + 时间 / 照片 + 日历 / 圆点装饰 + 可编辑文案
      widget_blue_glass_hero: {
        id: "widget_blue_glass_hero",
        name: "静谧蓝玻璃·时光卡",
        widthSpan: 4,
        heightSpan: 5,
        html: `<style>
#bg-hero, #bg-hero * { box-sizing: border-box; }
#bg-hero .bg-day { display: flex; align-items: center; justify-content: center; line-height: 1; }
#bg-hero .bg-day > b {
  display: flex; align-items: center; justify-content: center;
  width: min(100%, 1.75em); aspect-ratio: 1 / 1;
  border-radius: 50%; font-weight: 500;
}
#bg-hero .bg-day.is-today > b {
  background: rgba(96, 96, 96, 0.92);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
}
/* 顶部条 / 照片卡 / 日历卡：统一无色磨砂玻璃（半透明 + 背景模糊 + 顶部高光边） */
#bg-hero #bg-topbar, #bg-hero #bg-photo, #bg-hero #bg-cal {
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.22) 55%, rgba(255, 255, 255, 0.14) 100%);
  backdrop-filter: blur(14px) saturate(115%);
  -webkit-backdrop-filter: blur(14px) saturate(115%);
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow: 0 0 0 0.5px rgba(15, 23, 42, 0.06), 0 8px 20px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.80);
}
/* 顶部条不再做「第二个白条」：外层卡片已经是玻璃，内层再叠一层白底只会像状态栏白带。
   头像 + 时间直接浮在玻璃上，靠头像的磨砂圆盘提供层次。 */
#bg-hero #bg-topbar {
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
/* 中部两卡：占位层撑出高度，内层绝对定位放两张等宽卡片（左右各一） */
#bg-hero #bg-mid { width: 100%; position: relative; }
/* 中部高度占位：按宽度百分比推导卡片高度。
   73% ≈ 卡片宽度(≈组件的 1/2) × 1.5 → 每张卡正好是 2×3（宽:高 = 2:3），竖版拍立得观感；
   原先 62% 只有 1:1.27，卡片显得太扁。 */
#bg-hero .bg-mid-spacer { width: 100%; padding-top: 73%; }
#bg-hero #bg-mid-grid {
  position: absolute; inset: 0;
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
/* 5 个圆形图片装饰：默认内置图案，点击可换成本地图片 */
#bg-hero .bg-orb {
  position: relative; overflow: hidden; cursor: pointer;
  width: clamp(44px, 13vw, 56px);
  height: clamp(44px, 13vw, 56px);
  flex: 0 0 auto;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.20) 100%);
  border: 1px solid rgba(255, 255, 255, 0.64);
  box-shadow: 0 0 0 0.5px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.80);
  backdrop-filter: blur(12px) saturate(115%);
  -webkit-backdrop-filter: blur(12px) saturate(115%);
  transition: transform .16s ease;
}
#bg-hero .bg-orb:active { transform: scale(0.94); }
#bg-hero .bg-orb > img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover; display: block;
}
#bg-hero #bg-quote:empty::before { content: "写一句想说的话"; color: rgba(150, 150, 150, 0.62); }
@media (max-height: 700px) {
  #bg-hero { padding: 8px !important; }
  #bg-hero #bg-topbar { padding: 10px 12px !important; }
  #bg-hero #bg-avatar {
    width: clamp(32px, 10.5vw, 42px) !important;
    height: clamp(32px, 10.5vw, 42px) !important;
  }
  #bg-hero .bg-mid-spacer { padding-top: 52%; }
  #bg-hero .bg-orb {
    width: clamp(32px, 10.5vw, 42px) !important;
    height: clamp(32px, 10.5vw, 42px) !important;
  }
  #bg-hero #bg-quote { font-size: clamp(14px, 4.6vw, 19px) !important; }
}
/* 极矮屏（如 4:3 平板 / 分屏）再压一档，保证内容不溢出 */
@media (max-height: 560px) {
  #bg-hero { padding: 6px !important; }
  #bg-hero #bg-topbar { padding: 6px 10px !important; }
  #bg-hero #bg-avatar {
    width: clamp(26px, 8vw, 34px) !important;
    height: clamp(26px, 8vw, 34px) !important;
  }
  #bg-hero #bg-time { font-size: clamp(18px, 6vw, 26px) !important; }
  #bg-hero .bg-mid-spacer { padding-top: 40%; }
  #bg-hero .bg-orb {
    width: clamp(24px, 8vw, 30px) !important;
    height: clamp(24px, 8vw, 30px) !important;
  }
  #bg-hero #bg-quote { font-size: clamp(12px, 3.8vw, 15px) !important; }
  /* 卡片极矮时压缩日历排版，避免底部行被裁 */
  #bg-hero #bg-cal { padding: 4px 5px 3px 5px !important; border-radius: 12px !important; }
  #bg-hero #bg-cal-month { font-size: 11px !important; }
  #bg-hero #bg-cal-year { font-size: 8px !important; }
  #bg-hero #bg-cal-week,
  #bg-hero #bg-cal-grid { font-size: 7px !important; }
}
</style>
<div id="bg-hero" style="width:100%; height:100%; box-sizing:border-box; padding:12px 12px 12px 12px; display:flex; flex-direction:column; justify-content:space-between; gap:8px; border-radius:22px; background:linear-gradient(155deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.10) 100%); backdrop-filter:blur(26px) saturate(118%); -webkit-backdrop-filter:blur(26px) saturate(118%); border:1px solid rgba(255,255,255,0.58); box-shadow:0 0 0 0.5px rgba(15,23,42,0.06), 0 18px 40px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.82); overflow:hidden; position:relative; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; user-select:none; -webkit-user-select:none;">
  <!-- 顶部条：头像 + 大号时间（白色玻璃横条） -->
  <div id="bg-topbar" style="flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:16px 16px; border-radius:18px;">
    <input type="file" id="bg-avatar-input" accept="image/*" style="display:none;">
    <div id="bg-avatar" title="点击更换头像" style="width:clamp(38px,12.8vw,50px); height:clamp(38px,12.8vw,50px); flex:0 0 auto; border-radius:50%; overflow:hidden; background:linear-gradient(155deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.30) 100%); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.80); box-shadow:0 4px 12px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.85); display:flex; align-items:center; justify-content:center; cursor:pointer;">
      <img id="bg-avatar-img" alt="" style="display:none; width:100%; height:100%; object-fit:cover;">
      <svg id="bg-avatar-svg" viewBox="0 0 64 64" style="width:82%; height:82%; display:block;">
        <defs>
          <linearGradient id="bg-av-cap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e4e7ea"/>
            <stop offset="1" stop-color="#b9bec4"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="8" r="4.2" fill="#eef0f2" stroke="#e0e3e6" stroke-width="0.8"/>
        <path d="M14 26c0-9 8-15 18-15s18 6 18 15z" fill="url(#bg-av-cap)"/>
        <rect x="8" y="25" width="48" height="6.5" rx="3.2" fill="#f4f5f6"/>
        <ellipse cx="32" cy="45" rx="16" ry="14" fill="#ffffff"/>
        <path d="M18 37l1.5-7 6.5 4.5z" fill="#ffffff"/>
        <path d="M46 37l-1.5-7-6.5 4.5z" fill="#ffffff"/>
        <circle cx="26" cy="44" r="2.3" fill="#60656b"/>
        <circle cx="38" cy="44" r="2.3" fill="#60656b"/>
        <ellipse cx="20.5" cy="49" rx="3" ry="1.9" fill="#e6e8ea" opacity="0.95"/>
        <ellipse cx="43.5" cy="49" rx="3" ry="1.9" fill="#e6e8ea" opacity="0.95"/>
        <path d="M32 47.5v2.5" stroke="#aeb3b9" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M28.5 50.5c1.6 2.2 5.4 2.2 7 0" stroke="#aeb3b9" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
    <div id="bg-time" style="font-size:clamp(26px,9vw,38px); font-weight:400; letter-spacing:1.5px; line-height:1; color:rgba(74,74,74,0.9); font-variant-numeric:tabular-nums; font-feature-settings:'tnum';">12:55</div>
  </div>

  <!-- 中部：照片卡 2×3 + 日历卡 2×3（padding-top 撑出竖版比例，兼容老 WebView） -->
  <div id="bg-mid" style="flex:0 1 auto; min-height:0; width:100%; overflow:hidden;">
    <div class="bg-mid-spacer" aria-hidden="true"></div>
    <div id="bg-mid-grid">
      <input type="file" id="bg-photo-input" accept="image/*" style="display:none;">
      <div id="bg-photo" title="点击更换照片" style="min-width:0; min-height:0; border-radius:16px; overflow:hidden; background-color:rgba(255,255,255,0.28); background-size:cover; background-position:center; background-repeat:no-repeat; cursor:pointer;"></div>
      <div id="bg-cal" style="min-width:0; min-height:0; border-radius:16px; padding:7px 8px 6px 8px; display:flex; flex-direction:column; overflow:hidden;">
        <div style="flex:0 0 auto; display:flex; align-items:baseline; justify-content:space-between; padding:0 2px 4px 2px;">
          <div id="bg-cal-month" style="font-size:clamp(12px,3.6vw,16px); font-weight:700; color:rgba(58,58,58,0.92);">10 月</div>
          <div id="bg-cal-year" style="font-size:clamp(9px,2.6vw,12px); font-weight:600; color:rgba(118,118,118,0.8);">2026</div>
        </div>
        <div id="bg-cal-week" style="flex:0 0 auto; display:grid; grid-template-columns:repeat(7,1fr); padding:0 1px; font-size:clamp(8px,2.4vw,10px); color:rgba(128,128,128,0.88);"></div>
        <div id="bg-cal-grid" style="flex:1 1 auto; min-height:0; display:grid; grid-template-columns:repeat(7,1fr); grid-auto-rows:1fr; gap:1px; padding:0 1px; font-size:clamp(8px,2.6vw,11px); color:rgba(84,84,84,0.92);"></div>
      </div>
    </div>
  </div>

  <!-- 底部：5 个圆形图片位（默认内置图案，点击可换成本地图片） -->
  <input type="file" id="bg-orb-input" accept="image/*" style="display:none;">
  <div id="bg-dots" style="flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 2px;">
    <div class="bg-orb" data-orb="0" title="点击更换图片">
      <img class="bg-orb-img" alt="" style="display:none;">
      <svg viewBox="0 0 24 24" width="46%" height="46%" fill="none" stroke="#8a8a8a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 8h11v4.5a5.5 5.5 0 0 1-11 0z"/>
        <path d="M16 9h1.8a2.2 2.2 0 0 1 0 4.4H16"/>
        <path d="M8 5.5c0-1 1-1.3 1-2.2M11 5.5c0-1 1-1.3 1-2.2"/>
      </svg>
    </div>
    <div class="bg-orb" data-orb="1" title="点击更换图片">
      <img class="bg-orb-img" alt="" style="display:none;">
      <svg viewBox="0 0 24 24" width="46%" height="46%" fill="none" stroke="#8a8a8a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>
        <path d="M12 6.2l-2-2M12 6.2l2-2M12 17.8l-2 2M12 17.8l2 2"/>
      </svg>
    </div>
    <div class="bg-orb" data-orb="2" title="点击更换图片">
      <img class="bg-orb-img" alt="" style="display:none;">
      <svg viewBox="0 0 24 24" width="46%" height="46%" fill="none" stroke="#8a8a8a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.5 4h9l3 5.5-7.5 10.5L4.5 9.5z"/>
        <path d="M4.5 9.5h15M12 4l-3 5.5 3 10.5 3-10.5L12 4z"/>
      </svg>
    </div>
    <div class="bg-orb" data-orb="3" title="点击更换图片">
      <img class="bg-orb-img" alt="" style="display:none;">
      <svg viewBox="0 0 24 24" width="46%" height="46%" fill="none" stroke="#8a8a8a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 11c0-4 1-6.5 2.2-6.5S13.4 7 13.4 11"/>
        <path d="M15.4 11c-.4-3 .2-5.5 1.4-5.5s1.8 2 1 5"/>
        <circle cx="12" cy="16" r="5"/>
        <path d="M12 17.5v1M10.6 19c.6.7 2.2.7 2.8 0"/>
        <circle cx="10.2" cy="15" r="0.7" fill="#8a8a8a" stroke="none"/>
        <circle cx="13.8" cy="15" r="0.7" fill="#8a8a8a" stroke="none"/>
      </svg>
    </div>
    <div class="bg-orb" data-orb="4" title="点击更换图片">
      <img class="bg-orb-img" alt="" style="display:none;">
      <svg viewBox="0 0 24 24" width="46%" height="46%" fill="none" stroke="#8a8a8a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6"/>
        <path d="M3.5 10.5h17v3.2h-17zM12 10.5v9.5"/>
        <path d="M12 10.5c-3.4 0-4.8-1-4.8-2.6S9.6 6.2 12 10.5zM12 10.5c3.4 0 4.8-1 4.8-2.6S14.4 6.2 12 10.5z"/>
      </svg>
    </div>
  </div>

  <!-- 底部：可编辑的一句话 -->
  <div id="bg-quote" contenteditable="true" spellcheck="false" style="flex:0 0 auto; text-align:center; font-size:clamp(15px,5vw,21px); letter-spacing:2px; line-height:1.5; padding:0 0 2px; color:rgba(90,90,90,0.86); outline:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:text;">나는 너를 좋아해</div>
</div>
<script>
(function () {
  'use strict';
  var root = document.getElementById('bg-hero');
  if (!root) return;

  var PHOTO_KEY = 'bg_glass_photo';
  var AVATAR_KEY = 'bg_glass_avatar';
  var QUOTE_KEY = 'bg_glass_quote';
  var ORB_KEY_PREFIX = 'bg_glass_orb_';
  var ORB_COUNT = 5;
  var DEFAULT_PHOTO = './images/widget_polaroid_photo.jpg';

  var timeEl = document.getElementById('bg-time');
  var photoEl = document.getElementById('bg-photo');
  var avatarBox = document.getElementById('bg-avatar');
  var avatarImg = document.getElementById('bg-avatar-img');
  var avatarSvg = document.getElementById('bg-avatar-svg');
  var quoteEl = document.getElementById('bg-quote');
  var weekEl = document.getElementById('bg-cal-week');
  var gridEl = document.getElementById('bg-cal-grid');
  var monthEl = document.getElementById('bg-cal-month');
  var yearEl = document.getElementById('bg-cal-year');
  var photoInput = document.getElementById('bg-photo-input');
  var avatarInput = document.getElementById('bg-avatar-input');
  var orbInput = document.getElementById('bg-orb-input');
  var orbEls = Array.prototype.slice.call(document.querySelectorAll('#bg-dots .bg-orb'));
  var activeOrb = -1;

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  // ---------- 时间 ----------
  function renderTime() {
    if (!timeEl || timeEl === document.activeElement) return;
    var now = new Date();
    timeEl.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
  }

  // ---------- 月历 ----------
  var WEEK_LABEL = ['日', '一', '二', '三', '四', '五', '六'];
  var lastCalKey = '';

  function buildWeekRow() {
    if (!weekEl || weekEl.childElementCount === 7) return;
    weekEl.innerHTML = '';
    WEEK_LABEL.forEach(function (label) {
      var cell = document.createElement('div');
      cell.style.cssText = 'text-align:center; font-size:clamp(8px,2.4vw,10px); color:rgba(128,128,128,0.88);';
      cell.textContent = label;
      weekEl.appendChild(cell);
    });
  }

  function renderCalendar(force) {
    if (!gridEl || !monthEl || !yearEl) return;
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var today = now.getDate();
    var key = y + '-' + m;
    if (!force && key === lastCalKey) return;
    lastCalKey = key;

    monthEl.textContent = (m + 1) + ' 月';
    yearEl.textContent = String(y);
    buildWeekRow();

    var firstWeekday = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var cells = [];
    var i;
    for (i = 0; i < firstWeekday; i++) cells.push(0);
    for (i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(0);
    if (cells.length > 42) cells = cells.slice(0, 42);

    gridEl.innerHTML = '';
    cells.forEach(function (day) {
      var cell = document.createElement('div');
      cell.className = 'bg-day' + (day === today ? ' is-today' : '');
      var num = document.createElement('b');
      if (day > 0) num.textContent = String(day);
      cell.appendChild(num);
      gridEl.appendChild(cell);
    });
  }

  // ---------- 图片：居中裁方 + 压缩 ----------
  function toSquareDataUrl(file, size, cb) {
    var reader = new FileReader();
    reader.onload = function (evt) {
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.width, img.height);
        var sx = (img.width - side) / 2;
        var sy = (img.height - side) / 2;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        cb(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function applyOrbImage(el, url) {
    var img = el.querySelector('img.bg-orb-img');
    var svg = el.querySelector('svg');
    if (img) { img.src = url; img.style.display = 'block'; }
    if (svg) svg.style.display = 'none';
  }

  function loadStoredContent() {
    var savedPhoto = '';
    try { savedPhoto = localStorage.getItem(PHOTO_KEY) || ''; } catch (e) { savedPhoto = ''; }
    if (photoEl) photoEl.style.backgroundImage = "url('" + (savedPhoto || DEFAULT_PHOTO) + "')";

    var savedAvatar = '';
    try { savedAvatar = localStorage.getItem(AVATAR_KEY) || ''; } catch (e) { savedAvatar = ''; }
    if (savedAvatar && avatarImg && avatarSvg) {
      avatarImg.src = savedAvatar;
      avatarImg.style.display = 'block';
      avatarSvg.style.display = 'none';
    }

    var savedQuote = null;
    try { savedQuote = localStorage.getItem(QUOTE_KEY); } catch (e) { savedQuote = null; }
    if (savedQuote !== null && quoteEl) quoteEl.textContent = savedQuote;

    for (var i = 0; i < ORB_COUNT; i++) {
      var savedOrb = '';
      try { savedOrb = localStorage.getItem(ORB_KEY_PREFIX + i) || ''; } catch (e) { savedOrb = ''; }
      if (savedOrb && orbEls[i]) applyOrbImage(orbEls[i], savedOrb);
    }
  }

  if (photoInput && photoEl) {
    photoEl.addEventListener('click', function () { photoInput.click(); });
    photoInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      toSquareDataUrl(file, 720, function (url) {
        photoEl.style.backgroundImage = "url('" + url + "')";
        try { localStorage.setItem(PHOTO_KEY, url); } catch (err) {}
      });
      photoInput.value = '';
    });
  }

  if (avatarInput && avatarBox) {
    avatarBox.addEventListener('click', function () { avatarInput.click(); });
    avatarInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      toSquareDataUrl(file, 240, function (url) {
        if (avatarImg && avatarSvg) {
          avatarImg.src = url;
          avatarImg.style.display = 'block';
          avatarSvg.style.display = 'none';
        }
        try { localStorage.setItem(AVATAR_KEY, url); } catch (err) {}
      });
      avatarInput.value = '';
    });
  }

  // 5 个圆形图片位：点击换图，localStorage 持久化
  orbEls.forEach(function (el, idx) {
    el.addEventListener('click', function (evt) {
      evt.stopPropagation();
      if (!orbInput) return;
      activeOrb = idx;
      orbInput.click();
    });
  });

  if (orbInput) {
    orbInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file || activeOrb < 0) { orbInput.value = ''; return; }
      var idx = activeOrb;
      toSquareDataUrl(file, 240, function (url) {
        var el = orbEls[idx];
        if (el) applyOrbImage(el, url);
        try { localStorage.setItem(ORB_KEY_PREFIX + idx, url); } catch (err) {}
      });
      orbInput.value = '';
      activeOrb = -1;
    });
  }

  if (quoteEl) {
    quoteEl.addEventListener('blur', function () {
      var text = (quoteEl.textContent || '').replace(/\s+/g, ' ').trim();
      quoteEl.textContent = text;
      try { localStorage.setItem(QUOTE_KEY, text); } catch (err) {}
    });
    quoteEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); quoteEl.blur(); }
    });
  }

  loadStoredContent();
  renderTime();
  renderCalendar(true);

  var timer = setInterval(function () {
    renderTime();
    renderCalendar(false);
  }, 1000);

  // 组件被移除（翻页 / 删除组件）时释放定时器
  var observer = new MutationObserver(function () {
    if (!document.body.contains(root)) {
      clearInterval(timer);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
</script>`
      }
    },

    // 桌面摆放：4×5 玻璃时光卡占槽位 0（物理覆盖 0-19）
    placedDesktop: { "0": "widget_blue_glass_hero" },

    // 单页 28 格：0-19 被组件覆盖，20-27 放置 8 个 App（正好两排铺满第 6、7 行）
    desktopLayout: [
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
      null, null, null, null,
      "encounter", "deeptalk", "reader", "forum",
      "couples", "music", "shopping", "quicktravel"
    ],

    // 底部 Dock 栏排布
    dockLayout: ["chat", "archive", "world_book", "settings"]
  }
};

window.applyBuiltinThemePreset = function(specifiedKey) {
  const select = document.getElementById("beautify-builtin-preset-select");
  const key = specifiedKey || (select ? select.value : "");
  if (!key) {
    if (typeof showToast === "function") showToast("请先选择一个系统内置 UI 预设");
    return;
  }

  const preset = window.DESKTOP_PRESETS[key];
  if (!preset) {
    if (typeof showToast === "function") showToast("未找到对应的预设配置");
    return;
  }

  const executeApply = () => {
    // 1. 设置背景与 Dock 不透明度
    if (preset.wallpaper) {
      localStorage.setItem("beautify-wallpaper", preset.wallpaper);
    }
    if (preset.dockOpacity) {
      localStorage.setItem("beautify-dock-opacity", preset.dockOpacity);
    }

    // 2. 设置全局 CSS
    if (preset.activeCss) {
      localStorage.setItem("beautify-active-css", preset.activeCss);
      // 应用内置预设后标记已是最新样式版本，避免下次启动又被「自动升级」覆盖一遍
      localStorage.setItem("beautify-builtin-css-version", String(BUILTIN_PRESET_CSS_VERSION));
    }

    // 3. 写入内置小部件库
    if (preset.widgets) {
      let existingWidgets = {};
      try { existingWidgets = JSON.parse(localStorage.getItem("beautify-widgets")) || {}; } catch(e) {}
      Object.assign(existingWidgets, preset.widgets);
      localStorage.setItem("beautify-widgets", JSON.stringify(existingWidgets));
      // 刚写入的就是最新尺寸，落标记避免下次启动再跑一遍「内置组件尺寸升级」
      localStorage.setItem(BUILTIN_PRESET_WIDGET_VERSION_KEY, String(BUILTIN_PRESET_WIDGET_VERSION));
    }

    // 4. 设置桌面摆放小部件
    if (preset.placedDesktop) {
      localStorage.setItem("placed-widgets-desktop", JSON.stringify(preset.placedDesktop));
    }

    // 5. 设置桌面与 Dock 排版
    if (preset.desktopLayout) {
      localStorage.setItem("desktop-layout-v3", JSON.stringify(preset.desktopLayout));
      // 预设已按新版分页规格（4 列 × 7 行 = 28 格/页）生成，同步写入迁移标记，
      // 避免随后的 loadDesktopLayout 把它误判为老版每页 20 格数据而重新拆分
      const presetPageSize = typeof DESKTOP_PAGE_SIZE !== "undefined" ? DESKTOP_PAGE_SIZE : 28;
      localStorage.setItem("desktop-grid-page-size", String(presetPageSize));
    }
    if (preset.dockLayout) {
      localStorage.setItem("dock-layout-v3", JSON.stringify(preset.dockLayout));
    }

    if (typeof showToast === "function") {
      showToast(`已成功应用预设: ${preset.name}`);
    }



    // 6. 立即触发全局重绘
    if (typeof window.applyGlobalSettingsOnLoad === "function") window.applyGlobalSettingsOnLoad();
    if (typeof window.loadDesktopLayout === "function") window.loadDesktopLayout();
    if (typeof window.loadBeautifyForm === "function") window.loadBeautifyForm();
  };

  // 使用系统自研卡片 Confirm，彻底弃用原生 confirm 弹窗
  if (typeof showCustomConfirm === "function") {
    showCustomConfirm("应用UI主题预设", preset.confirmText || `确定要应用【${preset.name}】UI预设吗？`, executeApply);
  } else {
    executeApply();
  }
};

window.ensureDefaultDesktopTheme = function() {
  const MARK_KEY = "desktop-default-theme-v1";
  try {
    if (localStorage.getItem(MARK_KEY)) return;

    const hasLayout = !!localStorage.getItem("desktop-layout-v3");
    const hasWidgets = !!localStorage.getItem("placed-widgets-desktop");
    if (hasLayout || hasWidgets) {
      // 老用户：保持原桌面不动，只落一次标记
      localStorage.setItem(MARK_KEY, "skipped");
      return;
    }

    const preset = window.DESKTOP_PRESETS && window.DESKTOP_PRESETS.blue_glass_calm;
    if (!preset) return;

    if (preset.wallpaper) localStorage.setItem("beautify-wallpaper", preset.wallpaper);
    if (preset.dockOpacity) localStorage.setItem("beautify-dock-opacity", preset.dockOpacity);
    if (preset.activeCss) {
      localStorage.setItem("beautify-active-css", preset.activeCss);
      localStorage.setItem("beautify-builtin-css-version", String(BUILTIN_PRESET_CSS_VERSION));
    }

    if (preset.widgets) {
      let existingWidgets = {};
      try { existingWidgets = JSON.parse(localStorage.getItem("beautify-widgets")) || {}; } catch (e) {}
      Object.assign(existingWidgets, preset.widgets);
      localStorage.setItem("beautify-widgets", JSON.stringify(existingWidgets));
      localStorage.setItem(BUILTIN_PRESET_WIDGET_VERSION_KEY, String(BUILTIN_PRESET_WIDGET_VERSION));
    }

    if (preset.placedDesktop) {
      localStorage.setItem("placed-widgets-desktop", JSON.stringify(preset.placedDesktop));
    }
    if (preset.desktopLayout) {
      localStorage.setItem("desktop-layout-v3", JSON.stringify(preset.desktopLayout));
      // 与预设应用保持一致：写入分页规格标记，避免被 20→28 迁移逻辑误判
      const pageSize = typeof DESKTOP_PAGE_SIZE !== "undefined" ? DESKTOP_PAGE_SIZE : 28;
      localStorage.setItem("desktop-grid-page-size", String(pageSize));
    }
    if (preset.dockLayout) {
      localStorage.setItem("dock-layout-v3", JSON.stringify(preset.dockLayout));
    }

    localStorage.setItem(MARK_KEY, "applied");
  } catch (e) {
    console.warn("默认桌面主题装配失败:", e);
  }
};

// ============================================================
// 内置主题 CSS 自动升级
// ------------------------------------------------------------
// 主题 CSS 是「应用预设」时整段拷贝进 localStorage['beautify-active-css'] 的，
// 因此改了 app_desktop_presets.js 里的样式，老用户不重新点一次主题就看不到变化。
// 这里用一个版本号做兜底：只要本地存的是内置预设的 CSS（靠 cssSignature 识别），
// 且版本落后，就在页面注入样式之前自动替换为最新版；
// 用户自己在设置里写的自定义 CSS 不含预设签名，不会被误伤。
// ⚠️ 以后每次修改内置主题样式，都要把 BUILTIN_PRESET_CSS_VERSION +1。
// ============================================================
const BUILTIN_PRESET_CSS_VERSION = 4;
const BUILTIN_PRESET_CSS_VERSION_KEY = "beautify-builtin-css-version";

window.syncBuiltinPresetCss = function() {
  try {
    const saved = parseInt(localStorage.getItem(BUILTIN_PRESET_CSS_VERSION_KEY) || "1", 10);
    if (saved >= BUILTIN_PRESET_CSS_VERSION) return false;

    const current = localStorage.getItem("beautify-active-css") || "";
    let upgradedTo = "";

    if (current) {
      const matchedKey = Object.keys(window.DESKTOP_PRESETS || {}).find(key => {
        const preset = window.DESKTOP_PRESETS[key];
        return preset && preset.cssSignature && preset.activeCss &&
          current.indexOf(preset.cssSignature) !== -1;
      });
      if (matchedKey) {
        const preset = window.DESKTOP_PRESETS[matchedKey];
        if (current !== preset.activeCss) {
          localStorage.setItem("beautify-active-css", preset.activeCss);
          upgradedTo = preset.name;
        }
      }
    }

    localStorage.setItem(BUILTIN_PRESET_CSS_VERSION_KEY, String(BUILTIN_PRESET_CSS_VERSION));
    if (upgradedTo) {
      console.log("[内置主题] 样式已自动升级到最新版：" + upgradedTo);
    }
    return true;
  } catch (e) {
    console.warn("内置主题样式升级失败:", e);
    return false;
  }
};

// ============================================================
// 内置组件尺寸 / 内容自动升级
// ------------------------------------------------------------
// 内置组件是「应用预设」时整段拷进 localStorage['beautify-widgets'] 的，
// 因此只改 app_desktop_presets.js 里的 widthSpan / heightSpan / html，
// 老用户不重新点一次预设就看不到变化。
// 这里按组件 id 把宽高跨度同步成预设最新值；
// 若预设里的 html 也变了（例如调了内置样式），只有「存的还是内置原版」时才整体替换：
// 判定方式是预设 html 里第一个 id="xxx" 标记仍出现在已存 html 中，
// 用户从零重写的组件不含该标记 → 原样保留，非内置组件（自定义 id）完全不受影响。
// ⚠️ 以后每次调整内置组件的尺寸或 html，都要把 BUILTIN_PRESET_WIDGET_VERSION +1。
// ============================================================
const BUILTIN_PRESET_WIDGET_VERSION = 5;
const BUILTIN_PRESET_WIDGET_VERSION_KEY = "beautify-builtin-widget-version";

// 取内置 html 里第一个 id="xxx" 作为「这是内置原版」的指纹
function builtinWidgetMarker(html) {
  const m = /id="([A-Za-z0-9_-]+)"/.exec(html || "");
  return m ? 'id="' + m[1] + '"' : "";
}

window.syncBuiltinPresetWidgets = function() {
  try {
    const saved = parseInt(localStorage.getItem(BUILTIN_PRESET_WIDGET_VERSION_KEY) || "0", 10);
    if (saved >= BUILTIN_PRESET_WIDGET_VERSION) return false;

    let widgets = {};
    try { widgets = JSON.parse(localStorage.getItem("beautify-widgets")) || {}; } catch (e) { widgets = {}; }

    // 汇总所有内置预设里的组件定义
    const specs = {};
    Object.keys(window.DESKTOP_PRESETS || {}).forEach(key => {
      const preset = window.DESKTOP_PRESETS[key];
      if (!preset || !preset.widgets) return;
      Object.keys(preset.widgets).forEach(id => {
        const def = preset.widgets[id];
        if (!def) return;
        specs[id] = {
          widthSpan: parseInt(def.widthSpan) || 1,
          heightSpan: parseInt(def.heightSpan) || 1,
          html: typeof def.html === "string" ? def.html : ""
        };
      });
    });

    let changed = 0;
    Object.keys(widgets).forEach(id => {
      const spec = specs[id];
      const w = widgets[id];
      if (!spec || !w) return;
      let touched = false;
      const oldW = parseInt(w.widthSpan) || 1;
      const oldH = parseInt(w.heightSpan) || 1;
      if (oldW !== spec.widthSpan || oldH !== spec.heightSpan) {
        w.widthSpan = spec.widthSpan;
        w.heightSpan = spec.heightSpan;
        touched = true;
      }
      // html：仅当已存内容仍是内置原版（含内置指纹）时才替换
      const marker = spec.html ? builtinWidgetMarker(spec.html) : "";
      if (spec.html && w.html !== spec.html && marker && (w.html || "").indexOf(marker) !== -1) {
        w.html = spec.html;
        touched = true;
      }
      if (touched) changed++;
    });

    if (changed > 0) {
      localStorage.setItem("beautify-widgets", JSON.stringify(widgets));
      console.log("[内置组件] 已把 " + changed + " 个内置组件同步到最新版（尺寸/内置样式）");
    }
    localStorage.setItem(BUILTIN_PRESET_WIDGET_VERSION_KEY, String(BUILTIN_PRESET_WIDGET_VERSION));
    return changed > 0;
  } catch (e) {
    console.warn("内置组件升级失败:", e);
    return false;
  }
};

// 立即执行一次：必须在 app_desktop.js 的 applyGlobalSettingsOnLoad() 注入样式之前完成
window.syncBuiltinPresetCss();
window.syncBuiltinPresetWidgets();

