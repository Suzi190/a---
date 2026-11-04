const CACHE_NAME = 'story-phone-v42'; // v42：角色卡导入加「零反应」防护——每步诊断日志（logcat tag=WebViewDiag）+ 全链路超时（老 WebView 读 content:// 会既不 onload 也不 onerror，旧版就永久挂住）+ 安卓壳层 ContentResolver 兜底读文件 + 必定可见的进度/错误浮层（不再依赖 Toast）+ 选文件看门狗（壳层没回传文件时明说）；v41：修 Android 老机型 WebView 上「SillyTavern 角色卡能选文件但导入无反应」——改用全版本可用的 FileReader 读文件（不再依赖 Blob.arrayBuffer/Blob.text，Chromium 76+ 才有），并内置纯 JS DEFLATE 解压兜底（不再依赖 DecompressionStream，Chromium 80+ 才有），补 PNG 文件头识别与失败提示；v40：真·edge-to-edge 全屏（内容铺满含状态栏/挖孔区，不再靠同色条带糊弄）+ 桌面图标/Dock/时光卡统一「无色磨砂玻璃」材质（真半透明+背景模糊+中性灰线稿，去掉顶部白条与灰白糊面）；v39：修键盘弹起后整页被顶飞/底栏卡在上移位置（移除 resizes-content 与滚焦 hack，壳层加系统栏守卫），安全区留白归零去掉顶部白条，4×5 时光卡改无色磨砂玻璃；v38：静谧蓝玻璃主题组件改为灰色系（桌面图标名/时光卡/日历/圆点/Dock 全部去蓝调）；v37：APK 壳层全屏沉浸 + 边缘滑动返回 + 本地通知权限 + 导出走 MediaStore + app 名「叙事诗」；v36：静谧蓝玻璃时光卡中部卡片由 2×2 加高为 2×3（照片卡/日历卡，位置与顶部条、圆点、文案尺寸不变），老用户自动同步内置组件 html；v35：清透凉夏拍立得组件由 2×2 加高为 2×3（位置/宽度不变），并为老用户自动同步内置组件尺寸；v34：档案库新增 SillyTavern 角色卡导入（PNG/JSON 角色卡 + 配套世界书，深度/概率/关键词/模式自动映射）；v33：内置主题 CSS 自动升级（老用户不必重装主题即可看到圆形 52px 浅灰图标）

// 包含所有平铺引用的功能文件和图标（强制更新 Cache-Key 迫使浏览器重新拉取并应用）
const ASSETS = [
  './index.html',
  './manifest.json',
  './style.css',
  './app.css',
  './chat.css',
  './sticker.css',
  './app_quicktravel.js',
  './db.js',
  './app_prompts.js',
  './app_desktop.js',
  './app_desktop_presets.js', // 内置桌面 UI 预设与默认主题装配
  './app_settings.js',
  './app_archive.js',
  './app_world_book.js',
  './app_chat.js',
  './app_wallet.js',
  './app_chat_quote.js',
  './app_summary_memory.js',
  './deeptalk.css',          // 深谈样式
  './app_deeptalk.js',       // 深谈逻辑
  './chat_html.css',         // HTML 互动舱样式
  './app_chat_html_widget.js',// HTML 互动舱逻辑
  './app_chat_plot_engine.js',// 剧情引擎逻辑
  './app_chat_mcp.js',
  './app_mcp_client.js',     // MCP 客户端逻辑 (新加入)
  './app_chat_cot.js',       // 思维链 CoT 逻辑 (新加入)
  './app_desktop_pet.js',
  './app_reader.js',
  './app_chat_focus.js',
  './app_chat_check_phone.js',
  './app_chat_search.js',
  './app_chat_beautify.js',
  './app_chat_couples.js',
  './couples.css',
  './check_phone.css',
  './forum.css',             // 论坛主题样式表 (新加入)
  './app_forum_loader.js',   // 论坛层栈管理器 (新加入)
  './app_forum_posts.js',    // 论坛帖子与互动机制 (新加入)
  './app_forum_messages.js', // 论坛私信机制 (新加入)
  './music.css',             // 听歌网易云样式表 (新加入)
  './app_music.js',          // 听歌与陪听中枢逻辑 (新加入)
  './app_native_bridge.js',  // 原生壳交互桥（返回/键盘/通知）
  './images/wallpaper_summer.jpg',
  './images/widget_top_photo.jpg',
  './images/widget_polaroid_photo.jpg',
  './images/avatar_char1.jpg',
  './images/avatar_char2.jpg',
  './icon-512.png',
  'https://unpkg.com/dexie@4.0.1/dist/dexie.js'
];

// 安装阶段：预缓存所有资源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧版本的缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：优先使用缓存，若无则发起网络请求
self.addEventListener('fetch', (e) => {
  // 排除对外部 API 请求的拦截，仅缓存本地应用静态资源
  if (e.request.url.startsWith('http') && !e.request.url.includes('unpkg.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// 通知点击：聚焦已打开的页面，否则打开 index.html
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});