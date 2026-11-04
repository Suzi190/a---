# 叙事诗小手机 · StoryPhone

> 一个用 **Android 原生壳（Kotlin）+ HTML5 Web View** 混合开发的真机级 AI 角色扮演与伴读系统。前端纯原生 HTML / CSS / JavaScript 实现，底层用 Dexie.js（IndexedDB）做事务级持久化，再通过自研的 MCP 桥接协议打破沙箱，调用真机定位、震动马达、系统闹钟、本地音乐、悬浮桌宠等深度系统特权。

本仓库为**开源版本**：已移除所有登录鉴权、设备绑定、激活码、酒馆 PNG 角色卡导入等私有逻辑，开箱即用，任何人都可以本地部署或托管到 GitHub Pages / Vercel。

---

## 目录

- [一、项目特性](#一项目特性)
- [二、技术栈](#二技术栈)
- [三、仓库目录结构](#三仓库目录结构)
- [四、本地部署（PWA 网页版）](#四本地部署pwa-网页版)
- [五、本地构建 Android APK](#五本地构建-android-apk)
- [六、把前端分离出来用 GitHub 托管 + Vercel 部署](#六把前端分离出来用-github-托管--vercel-部署)
- [七、配置 GitHub Actions 自动云打包工作流](#七配置-github-actions-自动云打包工作流)
- [八、核心数据库设计（Dexie / IndexedDB）](#八核心数据库设计dexie--indexeddb)
- [九、安全与隐私说明](#九安全与隐私说明)
- [十、开源协议](#十开源协议)

---

## 一、项目特性

- **真机级 AI 角色扮演**：每个角色拥有独立人设、记忆、关系网，可双向注入 AI 上下文。
- **悬浮多状态桌宠**：原生系统级悬浮窗，9 种动作状态、双击跨进程唤醒、台词加权随机或大模型实时生成。
- **长周期记忆 + RAG 召回**：会话总结自动提炼，关键词索引，深度可调（最深 `-600`）的长久记忆库。
- **深度对话剖析空间（深谈）**：独立于主会话的剖析舱，支持 `[THOUGHT]` 内心闪念拦截与封存。
- **HTML 互动舱**：让 AI 现场写带样式与 JS 的单文件 HTML 卡片（迷你游戏、雷达图等），并自带沙盒与维修舱。
- **主线剧情引导引擎**：用户输入故事大纲，作为最高优先级控制指令驱动模型走向。
- **沉浸式旋转专注中枢**：Pointer Tracking 极角指针，5～120 分钟阻尼微调，伴随白噪音音频流。
- **自闭环 AI 伴读书城**：本地 .txt / .docx 极速导入，GBK 乱码自愈引擎，段落级 AI 书评气球。
- **JS 独立后台发信调度器**：每 30 秒高精度轮询，各角色发信间隔物理分离，携带世界书与长 RAG 记忆编译高质量 Prompt。
- **真机通知 + 桌面冒泡气泡链**：定时器启动→冒泡“有人冒泡。”→收到消息→系统通知 + 桌宠气泡“有人来信。”
- **MCP 物理联动协议**：定位、震动、闹钟、本地音乐后台锁屏放歌、大文件物理导出、悬浮窗等。
- **情侣/双角色模块、朋友圈、论坛、网易云同频听歌、钱包、表情包、向量化记忆、TTS、图像生成** 等丰富子系统。

---

## 二、技术栈

| 层级 | 技术 |
| --- | --- |
| 前端核心 | HTML5 + CSS3 + 原生 JavaScript（无框架、无构建工具） |
| 数据持久化 | Dexie.js 4.x（IndexedDB）+ LocalStorage 辅助 |
| PWA | `manifest.json` + `sw.js` Service Worker 离线缓存 |
| 安卓原生壳 | Kotlin + WebView + `@JavascriptInterface` 桥接 |
| 安卓构建 | Gradle 8.5 + AGP 8.2.2 + Kotlin 1.9.22 + JDK 17 |
| AI 协议 | OpenAI / OpenAI 兼容 / Gemini / DeepSeek 多协议适配 |
| 第三方 CDN | Dexie.js、JSZip（Word 解析）、vConsole（调试） |

---

## 三、仓库目录结构

```text
StoryPhone/
├── app/                                  # 安卓工程目录
│   ├── src/main/
│   │   ├── assets/                       # ★ 全部前端平铺资源（网页版的核心）
│   │   │   ├── index.html                # 前端入口
│   │   │   ├── manifest.json             # PWA 清单
│   │   │   ├── sw.js                     # Service Worker 离线缓存
│   │   │   ├── db.js                     # Dexie 数据库定义
│   │   │   ├── app_*.js                  # 各功能模块（聊天、桌宠、书城、论坛、音乐…）
│   │   │   ├── *.css                     # 各模块样式
│   │   │   └── images/                   # 图片资源
│   │   ├── java/com/story/phone/
│   │   │   ├── MainActivity.kt           # 主 Activity + 前台服务 + 多个 Receiver
│   │   │   └── AndroidMcp.kt             # 原生特权硬件接口桥接
│   │   ├── res/                          # 安卓资源（图标、布局）
│   │   └── AndroidManifest.xml           # 系统权限与组件清单
│   ├── build.gradle.kts                  # App 模块编译脚本（含签名配置）
│   ├── proguard-rules.pro                # 混淆白名单
│   └── storyphone.jks                    # 示例签名密钥（生产环境请替换为你自己的）
├── build.gradle.kts                      # 根项目编译脚本
├── settings.gradle.kts                   # Gradle 设置
├── gradle.properties                     # Gradle 属性
├── LICENSE                               # MIT 协议
└── README.md                             # 本文件
```

> 仓库不再附带 `.github/workflows/` 工作流文件，需要自动云打包请按 [第七节](#七配置-github-actions-自动云打包工作流) 自行添加。

---

## 四、本地部署（PWA 网页版）

网页版**完全不需要 Android 环境**，只要一个能跑静态文件的服务器即可。推荐两种方式：

### 方式 A：用 Python 自带 HTTP 服务（最快）

```bash
# 进入前端资源目录
cd app/src/main/assets

# Python 3
python3 -m http.server 8080

# 浏览器打开
# http://localhost:8080/index.html
```

### 方式 B：用 Node 的 `serve`（支持目录浏览与 SPA 回退）

```bash
# 全局安装 serve（仅需一次）
npm i -g serve

# 进入前端资源目录并启动
cd app/src/main/assets
serve -l 8080
```

启动后用浏览器（推荐 Chrome 移动端模拟）打开 `http://localhost:8080`，按 `F12` 切到手机模式即可获得最佳体验。

> **首次进入说明**：本开源版本**没有任何登录界面**，打开即是主界面。首次使用请进入「系统设置 → API 协议设置」填入你自己的大模型 API（OpenAI / DeepSeek / Gemini 等均可），再到「档案库」新建角色，即可开始对话。

> **PWA 安装**：在 Chrome / Edge 中访问页面后，地址栏右侧会出现「安装」按钮，可将其安装为本地 PWA 应用，离线可用。

---

## 五、本地构建 Android APK

APK 版本会解锁全部真机特权（系统悬浮窗、震动、闹钟、本地音乐后台播放、前台保活服务等）。

### 5.1 环境要求

- **JDK 17**（推荐 Temurin / OpenJDK 17）
- **Android SDK**（compileSdk 34，minSdk 26 = Android 8.0）
- **Gradle 8.5**（项目自带 Gradle Wrapper 配置；若未使用 wrapper，请全局安装 gradle 8.5）

> 📌 本仓库的安卓工程在 `Poemnarapk-main/` 子目录里，下文命令请先 `cd Poemnarapk-main`。
> 首次构建前在 `Poemnarapk-main/local.properties` 里写一行 `sdk.dir=你的Android SDK路径`（该文件已在 `.gitignore` 中忽略）。
> 如果你的工程路径含中文（例如 `D:\a叙事诗`），`gradle.properties` 里的 `android.overridePathCheck=true` 负责放行 AGP 的非 ASCII 路径检查，否则会直接构建失败。

### 5.2 配置签名密钥

仓库自带了一个示例签名 `app/storyphone.jks`（密码 `123456`，别名 `key`），**仅用于本地测试**。正式发布请务必替换为你自己的密钥：

```bash
# 生成你自己的签名密钥
keytool -genkey -v -keystore app/my-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key

# 然后修改 app/build.gradle.kts 中的 signingConfigs 段：
# signingConfigs {
#     create("release") {
#         storeFile = file("my-release.jks")
#         storePassword = "你的密码"
#         keyAlias = "你的别名"
#         keyPassword = "你的密码"
#     }
# }
```

> ⚠️ 切勿把你自己的 `.jks` 密钥和密码提交到公共仓库！建议把密钥放在仓库外，或用环境变量 / GitHub Secrets 注入。

### 5.3 构建命令

在仓库根目录执行：

```bash
# Debug 版（调试用，使用同一个签名以便覆盖安装）
gradle assembleDebug

# Release 版（混淆 + 签名，用于发布）
gradle assembleRelease
```

构建产物路径：

- Debug：`app/build/outputs/apk/debug/app-debug.apk`
- Release：`app/build/outputs/apk/release/app-release.apk`

把生成的 APK 传到手机安装即可。首次启动会请求定位、通知、振动、悬浮窗、本地存储等权限，请全部允许，否则部分特权功能不可用。

### 5.4 APK 壳层行为说明（v2 壳层）

| 能力 | 实现位置 | 说明 |
| --- | --- | --- |
| 应用名 | `res/values/strings.xml` | 桌面图标名 = **叙事诗** |
| 真·全屏铺满（含状态栏 / 挖孔区） | `MainActivity.setupFullscreenWindow()` + `applyImmersiveMode()` + `installEdgeToEdgeInsets()` + `res/values/styles.xml` | **不是「给条带染成同色」，而是内容真正铺满整块屏幕**：`android:windowFullscreen` + `WindowCompat.setDecorFitsSystemWindows(window, false)` + `decorView.fitsSystemWindows = false`，DecorView 不再为状态栏 / 导航栏 / 挖孔区预留内边距，页面从第一颗像素画到最后一颗像素；挖孔模式 Android 11+ 用 `ALWAYS`（更低版本 `shortEdges`）；系统栏颜色透明、`systemBarsBehavior` 为「滑动临时呼出」，划出后自动再收起；`@color/app_bg` 只作转场兜底 |
| 键盘不遮挡、也不顶飞页面 | `MainActivity.installEdgeToEdgeInsets()` | edge-to-edge 下系统不再自动缩窗口：Android 11+ 用 `SOFT_INPUT_ADJUST_NOTHING`，由 IME inset 把 `WebView` 的 `bottomMargin` 抬到键盘上沿（等价 `adjustResize`，但不会整页上移）；Android 8~10 仍走系统 `ADJUST_RESIZE`；**不再**使用 `interactive-widget=resizes-content`（与系统 resize 叠加会把视口压两次） |
| 边缘滑动返回 | `MainActivity.dispatchTouchEvent()` → `handleBackRequest(true)` | 左边缘右划 / 右边缘左划（贴边 28dp 内起手、水平位移 ≥72dp）触发返回；先回上一页，回不去则静默忽略，**绝不退出 APK**（只有物理返回键才走“再返回一次退出”），所以桌面左右翻页不会误退 |
| 返回键不误退 | 同 `handleBackRequest()` | 网页侧 `window.__storyNativeBack()` 按「浮层 → 设置二级 → 应用窗口」逐级回退，全部关完才轮到退出确认 |
| 数据导入导出 | `assets/app_settings.js` + `AndroidMcp.openExportStream()` | 导出统一落到 `Download/Storypoem/`；Android 10+ 走 MediaStore（无需“所有文件访问”权限），Android 9 及以下直写公共下载目录；导入走 HTML5 `<input type="file">`，壳层已做 `createIntent()` 兜底 |
| 本地通知权限 | `AndroidMcp.requestNotificationPermission()` / `hasNotificationPermission()` / `openNotificationSettings()`，前端 `window.StoryNotify` | Android 13+ 一次性弹出 `POST_NOTIFICATIONS` 运行时授权；被用户关掉时可直接跳到本应用通知设置页；`showSystemNotification()` 发通知前会自动补齐权限 |
| 系统栏被顶回来自动再隐藏 | `installEdgeToEdgeInsets()` + `applyImmersiveMode()` | `ViewCompat.setOnApplyWindowInsetsListener` 只在系统栏可见时补一次隐藏；系统栏 inset 一律不施加给 `WebView`（否则又会被顶下一截）；`setOnSystemUiVisibilityChangeListener` 兜底老 ROM |
| 桌面材质：无色磨砂玻璃 | `style.css` 的 `--glass-*` 令牌 + `app_desktop_presets.js` 内置主题 | 真半透明（`rgba(255,255,255,0.2~0.6)` 渐变）+ `backdrop-filter: blur(18~26px) saturate(120%)` + 1px 白色高光边 + 0.5px 中性暗边 + 顶部内高光；图标线稿统一 `#4f5b69` 石墨灰、标签 `#3f4855`，**全程不掺蓝紫**；时光卡顶部条不再叠第二层白底（避免看着像状态栏白带）。内置主题 CSS/组件版本各 +1，老用户升级后自动换新（`syncBuiltinPresetCss` / `syncBuiltinPresetWidgets`） |

| 键盘不顶飞页面 | Manifest `adjustResize` + `installInsetsGuard()` + `app_native_bridge.js` 视口守卫 | 键盘弹出时 WebView 真实变矮 → 底栏随键盘上移；键盘收起后壳层主动 `requestLayout()` 并把文档级滚动量归零、桌面滚动位置还原，不会再出现「整页上移且退不回来」；页面里**不调用** `scrollIntoView`（改用 `window.storyScrollToElement()` 只滚容器），也不再使用 `interactive-widget`，避免二次补偿 |
| 整页不被程序滚动顶起 | `MainActivity` 把 `WebView` 自身滚动量钉死在 0 + `app_native_bridge.js` 的 `installDocumentScrollGuard()` + `style.css` 里 `html{overflow:hidden}` | `overflow:hidden` 只禁用户手势、**不禁程序滚动**：`scrollIntoView`、输入框自动上移、输入法/系统栏推挤都会改文档级滚动量，一旦被顶起来用户再也拖不回来，真机表现就是「退出快穿局后桌面空白、Dock 跑到屏幕上方、下方一大片底色」。现在文档滚动量只要偏离 0 就会被立刻归零，`Dock` 永远贴底 |

> 网页侧新增的 `app_native_bridge.js` 只依赖壳层暴露的 `AndroidMCP`，在浏览器/PWA 下运行时会退化为 Web Notification 与普通页面返回，不影响网页版。

### 5.5 APK 体积（约 27 MB）

| 手段 | 位置 | 效果 |
| --- | --- | --- |
| 只打包两种 ABI | `app/build.gradle.kts` 的 `ndk.abiFilters` | 去掉 x86 / x86_64 模拟器库，真机只留 `arm64-v8a` + `armeabi-v7a` |
| 原生库二次压缩 | `app/build.gradle.kts` 的 `packaging.jniLibs.useLegacyPackaging = true`（等价于 `extractNativeLibs=true`） | libwebp 等 so 从「存储」改为「压缩」入包 |
| 图片重编码 | `assets/images/*` 统一 JPEG q86 重采样（长边 ≤1440） | 情侣空间/壁纸/组件照片从 ~20 MB 降到 ~2 MB，画质肉眼无差 |
| 代码与资源压缩 | `isMinifyEnabled` + `isShrinkResources` + 自定义 `proguard-rules.pro` | R8 混淆并裁掉未引用的资源 |
| 构建脚本搬移 | `start-ncm-api.js` 从 `assets/` 移到 `tools/` | 调试脚本不再打进安装包 |

> 需要为模拟器出包时，把 `abiFilters` 临时改成 `"arm64-v8a", "armeabi-v7a", "x86_64"` 即可。

---

## 六、把前端分离出来用 GitHub 托管 + Vercel 部署

如果你只想要网页版（不要 APK），可以把 `app/src/main/assets/` 目录下的**所有文件平铺**到一个独立的 GitHub 仓库根目录，再用 Vercel 一键部署。整个流程**不需要任何构建命令**，因为本项目的网页版就是纯静态的 HTML / CSS / JS。

### 6.1 准备前端仓库

```bash
# 1. 新建一个空仓库（比如 storyphone-web）
mkdir storyphone-web
cd storyphone-web
git init

# 2. 把 assets 目录下的所有文件复制到仓库根目录（平铺，不要带 assets/ 这层）
cp -r /path/to/StoryPhone/app/src/main/assets/* .

# 3. 确认入口文件 index.html 在根目录
ls index.html   # 应该能看到

# 4. 提交
git add .
git commit -m "init: storyphone web frontend"
git branch -M main
git remote add origin git@github.com:<你的用户名>/storyphone-web.git
git push -u origin main
```

### 6.2 用 Vercel 部署

1. 打开 [vercel.com](https://vercel.com/)，用 GitHub 账号登录。
2. 点击 **「Add New… → Project」**，授权并选择刚才的 `storyphone-web` 仓库。
3. 在 **Configure Project** 页面：
   - **Framework Preset**：选 `Other`（纯静态站点）
   - **Build Command**：**留空**（不需要构建）
   - **Output Directory**：**留空** 或填 `.`（仓库根目录就是输出目录）
   - **Install Command**：**留空**
4. 点击 **Deploy**，几十秒后会得到一个 `https://storyphone-web.vercel.app` 形式的在线网址，直接可用。

### 6.3 （可选）绑定自定义域名

在 Vercel 项目 → Settings → Domains 中添加你自己的域名，按提示配置 CNAME 即可。

### 6.4 更新网页

以后只要把改动 `git push` 到 `main` 分支，Vercel 会自动重新部署，无需任何手动操作。

> **小贴士**：Vercel 默认会自动启用 HTTPS 与全球 CDN，PWA 的 Service Worker 在 HTTPS 下才能注册成功，所以部署后 PWA 离线能力也会自动生效。

---

## 七、配置 GitHub Actions 自动云打包工作流

本仓库已内置 `.github/workflows/build-apk.yml`（工作流文件在仓库根目录，安卓工程在 `Poemnarapk-main/` 子目录）。它会在这些时机自动云端打包：

- `git push` 到 `main` / `master`（改动涉及 `Poemnarapk-main/**` 或工作流文件时）
- Pull Request
- 在 **Actions → Build APK (叙事诗) → Run workflow** 手动触发
- 打 tag（`git tag v1.0.0 && git push --tags`）时，额外面向 GitHub Release 上传 APK

### 7.1 工作流做了什么

1. `actions/checkout` 拉取源码；
2. `actions/setup-java` 安装 JDK 17；
3. 直接复用 runner 自带的 Android SDK（`setup-android@v3` 在自带 cmdline-tools 的镜像上会失败），用 `sdkmanager` 补装 `platforms;android-34`、`build-tools;34.0.0`；
4. `gradle/actions/setup-gradle` 装配 Gradle 8.5（无需提交 gradle wrapper）；
5. 在 `Poemnarapk-main` 目录执行 `gradle :app:assembleRelease`，复用仓库自带 `app/storyphone.jks` 签名；
6. 产物重命名为 `story-poem-<versionName>-<run-number>.apk`，上传为 Artifact（名称 `story-poem-apk`）。

### 7.2 下载安装包

构建完成后进入对应的 Workflow Run 页面，在页面底部 **Artifacts** 区域下载 `story-poem-apk`，解压得到 APK，传到手机安装即可。

> 首次构建约 8～12 分钟（要下载 Gradle / SDK / 依赖，含 onnxruntime），之后有缓存会快很多。

### 7.3 想每次都出 Debug 包？

把工作流里的 `:app:assembleRelease` 换成 `:app:assembleDebug`，产物路径换成 `app/build/outputs/apk/debug/app-debug.apk` 即可（Debug 与 Release 共用同一签名，可互相覆盖安装）。

### 7.4 （可选）云端 Release 签名

如果你想在云端用你自己的 release 密钥签名发布版 APK：

1. 用 `base64` 编码你的 `.jks` 文件：
   ```bash
   base64 -i my-release.jks -o keystore.b64
   ```
2. 在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加以下 Secrets：
   - `KEYSTORE_BASE64`：上面 `keystore.b64` 的内容
   - `KEYSTORE_PASSWORD`：keystore 密码
   - `KEY_ALIAS`：别名
   - `KEY_PASSWORD`：别名密码
3. 在工作流的 Build 步骤前加一步解码密钥：
   ```yaml
   - name: Decode Keystore
     run: |
       echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > app/release.jks
   ```
4. 把 `Build APK` 步骤改成 `gradle assembleRelease`，并修改 `app/build.gradle.kts` 的 `signingConfigs` 读取环境变量。

> 出于安全考虑，**不要把真实的 `.jks` 文件或密码直接提交到仓库**，永远通过 Secrets 注入。

### 7.5 真机报「软件包似乎无效 / 安装包缺乏开发者证书」怎么办

这是**签名方案缺失**，不是包损坏。`minSdk >= 24` 时 AGP 默认只打 **v2**、把 **v1（JAR 签名）关掉**；而 vivo / OPPO 等国产 ROM 的安装器（QQ 内置安装、文件管理器安装走同一套校验）仍会按老式 `JarFile` 路径校验证书，找不到就报 `INSTALL_PARSE_FAILED_NO_CERTIFICATES`。

本项目已在 `app/build.gradle.kts` 里显式打开三套签名：

```kotlin
signingConfigs {
    create("release") {
        // ...
        enableV1Signing = true // 兼容国产 ROM 安装器的老校验路径
        enableV2Signing = true // Android 7+ 主校验
        enableV3Signing = true // Android 9+ 密钥轮换
    }
}
```

自检命令（三行都要是 `true` 才算合格）：

```bash
$ANDROID_HOME/build-tools/34.0.0/apksigner verify -v --min-sdk-version 21 app-release.apk
# Verified using v1 scheme (JAR signing): true
# Verified using v2 scheme (APK Signature Scheme v2): true
# Verified using v3 scheme (APK Signature Scheme v3): true
```

> 排查经验：`apksigner verify -v` 不带 `--min-sdk-version` 时会按 `minSdk=26` 判定「v1 已无意义」而报 v1 false，这不代表没签 v1；用 `jarsigner -verify app-release.apk` 看到「jar 已验证」即可确认 v1 真实有效。

如果仍装不上，按顺序排查：① 手机上是否开了 vivo「纯净模式 / 严格安装」（关掉后重试）；② 传输过程中文件被截断（比对 SHA-256）；③ 旧版本是同包名不同签名的包，需先卸载旧版。

### 7.6 退出快穿局后「桌面一片空白 + Dock 跑到屏幕上方」/ 顶部还有白条

这是**文档级滚动残留**，不是桌面数据丢失（重进 App 就恢复正常，数据一直在 IndexedDB 里）。

根因链：

1. `overflow: hidden` 只禁止**用户手势**滚动，**不禁止程序滚动**——`el.scrollIntoView()`、输入框自动上移、输入法 / 系统栏把页面推挤，都会直接改文档级 `scrollTop`；
2. 本项目页面是「固定高度 + 内部容器滚动」布局，文档一旦被滚走，因为 `overflow:hidden` 用户又拖不回来 → 整页就永远停在「被顶起」的状态；
3. 于是看到的就是：桌面网格被滚出屏幕上方（一片空白）、Dock 栏跑到屏幕上方、Dock 下方露出大块底色。
4. 顶部白条则来自窗口 / WebView 底色：`windowBackground` 与 `webView.setBackgroundColor()` 原来是纯白，系统栏或挖孔区一露出白色就非常刺眼。

> **补充（本轮复现后定位到的真凶）**：真正被滚走的往往不是 document，而是 **`#phone-container` 自己**。
> 它同样是 `overflow: hidden`，用户拖不动，但 `input.focus()` / `scrollIntoView()` 照样能改它的 `scrollTop`
> —— 实测「进出几轮快穿局」后固定残留 **701px**：容器内桌面 / 应用层 / Dock 整体上移 701px，
> 每个元素自身的高度、位置都正常，`document.scrollTop` 也是 0，所以之前的文档级守卫抓不到。
> 现在由 `app_layout_guard.js` 把壳层滚动量一起归零，并用 `overflow: clip` 从根上让它不可滚动。

五层修复（缺一层都可能复现）：

| 层 | 位置 | 做法 |
| --- | --- | --- |
| 页面调用 | `app_native_bridge.js` 的 `window.storyScrollToElement(el, {block, container})` | 只滚动**最近的滚动容器**，绝不惊动文档；`app_chat_search.js` / `app_moments.js` / `app_music.js` / `app_quicktravel.js` 里原来的 `scrollIntoView` 已全部换掉 |
| 页面兜底 | `app_native_bridge.js` 的 `installDocumentScrollGuard()` | 在 `scroll` 事件捕获阶段发现文档滚动量 ≠ 0 就立刻归零；`pointerup` / `touchend` / `focusout` / `visualViewport.scroll` 也各兜一层；关闭应用窗口后再复位两次（60ms / 420ms） |
| 页面布局 | `style.css` | `html { overflow: hidden; overscroll-behavior: none }`；`#phone-container` 加 `justify-content: space-between`；原生壳里 `#desktop { flex: 1 1 auto; min-height: 0 }`，即使桌面异常塌陷 Dock 也贴底 |
| 原生壳 | `MainActivity` | `webView.setOnScrollChangeListener { ... scrollTo(0, 0) }` 把 WebView 自身滚动量钉死在 0（页面内部容器的滚动完全不受影响）；`setDecorFitsSystemWindows(window, false)` + `windowFullscreen` 让页面铺满整屏；`onConfigurationChanged()` / `onWindowFocusChanged()` 再锁全屏 |

**第五层：布局自愈守卫 `app_layout_guard.js`（新增）**

前三层都是「出问题之前别让它出事」，但真机 ROM 差异太多（输入法顶起、窗口动画、ROM 回传过期 IME inset），所以再加一层**事后自愈**：

| 机制 | 说明 |
| --- | --- |
| 触发点 | `openApp()` / `closeApp()`、`resize`、`orientationchange`、`pageshow`、`focusout`、`visualViewport.resize`、`visibilitychange`，每次连探测 5 次（0 / 60 / 240 / 520 / 1200ms），专门等键盘收起和窗口动画结束 |
| 判定标准 | `phone.top≈0`、`phone.h≈视口高`、`dock.bottom≈视口高`、`doc.scrollTop==0`、`phone.scrollTop==0`、`app-window-container.scrollTop==0`、`body` 无 transform |
| 修复动作 | ① 文档 / 壳层滚动量归零；② 清掉 `#phone-container` / `#desktop` / `#dock` 上的内联污染（height / flex / transform / margin / position + top..left 偏移）；③ 仍不健康才按视口把高度钉死 |
| 幂等 | **健康时零写入**；只有判定异常才动手，不会和现有样式互相打架 |
| 取证 | 控制台 `[StoryLayoutGuard] 布局异常已自愈 (reason)` + `localStorage['story-layout-guard-log']`（保留最近 20 条），`window.StoryLayoutGuard.log()` 直接读 |
| 附带修复 | 关窗前先 `blur()` 收起软键盘；`closeApp('quicktravel')` 调 `window.teardownQuickTravelApp()` 回收弹幕定时器、document 级拖拽监听、`#qt-toast` / `#qt-overlay` / `qt-game-beautify-css` |

配套的 CSS 加固：`#phone-container` 由 `position: relative` 改为 **`position: fixed; top: 0; left: 0`**（与文档滚动彻底解耦），并加 **`overflow: clip`**（老内核自动回落 `hidden`）。

自检方法（网页版同样适用，浏览器 F12 控制台）：

```js
// 1) 文档不该有任何滚动量
document.scrollingElement.scrollTop = 500; await new Promise(r => setTimeout(r, 150));
document.scrollingElement.scrollTop; // 期望 0（守卫已归零）

// 2) Dock 应该贴在底部
Math.round(document.getElementById('dock').getBoundingClientRect().bottom) === window.innerHeight;

// 3) 桌面主体应该有高度
document.getElementById('desktop').getBoundingClientRect().height > 100;

// 4) 壳层容器自己也不该有滚动量（真凶就在这儿，document 是 0 也可能是坏的）
document.getElementById('phone-container').scrollTop;   // 期望 0
document.getElementById('app-window-container').scrollTop; // 期望 0

// 5) 用守卫视角整体体检：返回 ['problems...']，空数组＝健康
window.StoryLayoutGuard.problems();

// 6) 看历史自愈记录（真机上排查用，等价 localStorage['story-layout-guard-log']）
window.StoryLayoutGuard.log();
```

---

### 7.7 「全屏」的正确做法 & 桌面材质是「无色磨砂玻璃」（1.3.4）

**① 全屏 ≠ 把条带染成同色。** 1.3.2~1.3.3 只是把 `windowBackground` / WebView 底色改成与页面相同的 `#f4f6fa`，条带还在，只是看着不刺眼而已。真正的铺满必须让 DecorView 不再为系统栏预留空间：

```kotlin
window.decorView.fitsSystemWindows = false
WindowCompat.setDecorFitsSystemWindows(window, false)   // 关键
// Android 11+ 用 LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS，更低版本 SHORT_EDGES
```

配套 `android:windowFullscreen=true`（`styles.xml`），并在 `installEdgeToEdgeInsets()` 里：
- **系统栏 inset 一律丢弃**（不给任何 View 加 padding，否则又被顶下一截）；
- **只把 IME inset 用在 `WebView` 的 `bottomMargin` 上**（Android 11+），等价 `adjustResize` 但不会整页上移；
- 系统栏可见时补一次 `applyImmersiveMode()` 再隐藏。

页面侧用 `max(12px, env(safe-area-inset-top))` 只给 `#desktop` 让出刘海高度，背景仍通到屏幕最顶端，所以是「铺满 + 内容不被前摄挡住」而不是「留白后染色」。

**② 「无色磨砂玻璃」的含义。** 无色 = 只用白/灰，不掺蓝紫；磨砂 = 半透明 + `backdrop-filter` 模糊背后的壁纸；玻璃 = 有边（1px 白色高光边 + 0.5px 中性暗边 + 顶部内高光）。统一令牌在 `style.css`：

```css
--glass-fill: linear-gradient(155deg, rgba(255,255,255,.60), rgba(255,255,255,.30) 48%, rgba(255,255,255,.20));
--glass-blur: blur(20px) saturate(118%);
--glass-ring: 0 0 0 .5px rgba(15,23,42,.07);
--glass-ink: #4f5b69;   /* 图标线稿：石墨灰，无彩色 */
```

应用范围：桌面 App 图标底托、Dock 长条、Dock 图标底托、时光卡（外层卡 + 照片卡 + 日历卡 + 圆形图片位 + 头像）。时光卡的**顶部条不再单独做白底**——外层已经是玻璃，里面再叠一层白卡就会被误读成「顶部白条」。

老用户升级后自动换新，无需重装主题：`BUILTIN_PRESET_CSS_VERSION` / `BUILTIN_PRESET_WIDGET_VERSION` 已各 +1，`syncBuiltinPresetCss()` / `syncBuiltinPresetWidgets()` 会把 localStorage 里的旧 CSS / 旧组件 html 换成新版。

自检（真机 Chrome inspect 或桌面 F12）：

```js
getComputedStyle(document.querySelector('.app-icon .icon-wrapper')).backdropFilter; // blur(...)
getComputedStyle(document.querySelector('.dock-container')).backgroundColor;        // rgba(255,255,255,0.3x)
document.getElementById('phone-container').getBoundingClientRect().top;             // 0
```

---

### 7.8 「角色卡能选文件，但导入没反应」——WebView 版本兼容坑（1.3.5）

现象：网页版（桌面 Chrome / Edge）导入 SillyTavern 角色卡一切正常，装成 APK 后在部分安卓机上「文件选择器能打开、也能选中文件，但选完什么都不发生」。

原因不是解析逻辑，而是三个**新 API**只在较新的 Chromium 里才有，而安卓 8~10 老机型自带的 WebView 常年不更新：

| API | 最低 Chromium | 在老 WebView 上 |
| --- | --- | --- |
| `Blob.prototype.arrayBuffer()` / `Blob.prototype.text()` | 76（2019） | `TypeError: file.text is not a function` |
| `DecompressionStream('deflate')` | 80（2020） | `ReferenceError: DecompressionStream is not defined` |
| `FileReader` / `atob` / `TextDecoder` | 极早（38 以前） | 全版本可用 ✅ |

而全项目其它导入（头像、备份、阅读器、表情包、字体……）一直走 `FileReader`，所以只有角色卡导入出问题。

修法（`app_archive.js`）：

```js
// 1) 读文件统一走 FileReader（全版本可用），外面再包一层超时防「挂死」
async function stReadFileAsArrayBuffer(file, fileIndex) { /* FileReader + 超时 + 原生兜底 */ }

// 2) 文本用字节解码：有 TextDecoder 用它，没有就 decodeURIComponent(escape(bin))
function stDecodeUtf8Text(bytes) { /* ... */ }

// 3) 压缩文本块（zTXt / iTXt flag=1）先用 DecompressionStream，失败则用内置纯 JS DEFLATE
async function stInflateDeflate(bytes) { /* 原生 → 失败则 stInflateZlib() */ }
```

顺带补了两处健壮性：

- **PNG 文件头嗅探**：安卓文件管理器常不给 `File.type`、甚至丢后缀，现在读字节后先看 `89 50 4E 47` 魔数，能识别就直接当 PNG 解析；
- **失败一定有反馈**：解析前先提示「正在解析角色卡…」，出错显示具体原因（含文件名），选完文件却没回传时提示「没有读取到所选文件」，不再静默失败。

回归测试（不需要真机）：

```bash
node tools/st-inflate-test.mjs   # 在「无 DecompressionStream / 无 Blob.arrayBuffer」的 vm 沙箱里跑 58 项
node tools/st-import-test.mjs    # 无头 Edge：真实 input[type=file] → 解析 → 预览 → 落库
```

> 经验：写进 `app/src/main/assets` 的前端代码，只要用到 2019 年之后新增的 Web API，就要准备降级路径或自实现兜底——桌面浏览器测不出来，老安卓 WebView 会直接白给。

### 7.9 「还是没反应」——挂死型失败与三层兜底（1.3.6）

1.3.5 补齐了 API 兼容后，仍有老机型「选完文件毫无变化、连提示都看不到」。原因有两类，都不是解析逻辑：

1. **挂死型失败**：老 WebView 读文件选择器回传的 `content://` URI 时，有时 `FileReader` 既不 `onload` 也不 `onerror`，Promise 永远不 settle——报错提示自然永远等不到。同理旧版 `compressImageBlob()` 只写了 `onload`，读失败就永久挂住。
2. **反馈通道不可靠**：旧版失败只弹 Toast，壳层里 Toast 容器被遮住/未加载时用户就什么都看不到。

1.3.6 的修法（全部在 `app_archive.js` + `AndroidMcp.kt` + `MainActivity.kt`）：

| 层 | 做法 |
| --- | --- |
| 超时 | `stWithTimeout()` 包住「读文件 15s / 解析 PNG 20s / 头像压缩 6s / 整体 60s」，到点必报错，绝不死等 |
| 原生兜底 | `MainActivity.onActivityResult` 先把 URI 交给 `AndroidMcp.rememberPickedUris()`；JS 读不到（报错或超时）就调 `openPickedFile()` / `readPickedFileChunk()`，由原生 `ContentResolver` 直接读字节（192KB 分块 base64 回传），绕过 WebView 对 `content://` 的限制 |
| 可见反馈 | 自建内联样式诊断浮层（`z-index: 2147483647`），显示「正在解析角色卡…」→ 成功自动关闭 / 失败列出**诊断记录 + 环境摘要**（Chromium 版本、是否有 `File.arrayBuffer` / `DecompressionStream` / `TextDecoder`、原生兜底是否可用），带「重试」按钮 |
| 看门狗 | 点导入后若壳层根本没把文件回传到网页（`onShowFileChooser` 回调丢失），JS 侧在页面重新可见 6s 后提示「没有收到文件」；Kotlin 侧 `onResume` 3s 后仍在挂着的 `fileUploadCallback` 会主动回传 `null` 解除占用（否则之后再点任何文件按钮都没反应） |
| 日志 | JS 每步写 `console` + `AndroidMCP.logDebug()`（logcat `WebViewDiag`）；`onConsoleMessage` 把 JS 报错转发到 logcat `WebViewConsole`；文件选择器结果记在 `FileChooser` |

真机排查命令：

```bash
adb logcat -s WebViewDiag WebViewConsole FileChooser AndroidMcp
```

回归测试：

```bash
node tools/st-inflate-test.mjs   # 58 项，含「FileReader 挂死 → 超时报错」「挂死 + 原生兜底 → 仍能导入」
node tools/st-import-test.mjs    # 无头 Edge：真实 input[type=file] → 解析 → 预览 → 落库
```

> 经验：跨 WebView 兼容问题，「一定会失败」比「一定会报错」更难查。给每个异步步骤加上限，比继续猜 API 差异有效得多；再叠加一条不走 WebView 的原生兜底路径，基本可以吃掉各类文件管理器/URI 权限的怪癖。

---

## 八、核心数据库设计（Dexie / IndexedDB）

系统使用 Dexie.js 在浏览器 IndexedDB 中维护 24+ 张物理表，覆盖 API 预设、档案、关系、会话、消息、世界书、剧场、状态切片、表情包、深谈、朋友圈、HTML 卡片、悬浮桌宠、阅读书城等模块。完整定义在 [app/src/main/assets/db.js](app/src/main/assets/db.js)。

新增表时务必同步更新 `app_settings.js` 中的 `computeStorageUsage()`、`exportBackup()`、`importBackup()` 三处，否则数据备份 / 还原会因事务空指针而假死。

---

## 九、安全与隐私说明

- 本开源版本**没有任何后端服务、没有任何登录、没有任何设备绑定或激活码**。所有数据均保存在你本机的 IndexedDB / LocalStorage 中，离线可用，完全属于你自己。
- 配置 API 时输入的 Key 仅保存在你本机，不会上传到任何第三方服务器（除了你指定的模型 API 提供商）。
- 安卓版本申请的权限均为本地特权功能（定位、震动、闹钟、悬浮窗、本地音乐、前台保活）所需，不会主动收集或上传任何用户数据。
- **本地向量大模型**：APK 版本中的「本地 ONNX 向量大模型」功能使用的是 [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) 量化版模型。模型与词表文件均**直接从 HuggingFace 官方仓库下载**，本项目不托管、不分发、不打包该模型，下载链接的可用性与合规性由上游官方仓库负责，与本仓库作者无关。如遇 HuggingFace 访问受限，请自行配置网络代理或更换为可访问的官方镜像。
- 仓库自带的 `app/storyphone.jks` 是示例签名密钥，**正式发布请务必替换为你自己的密钥**，否则别人也可以用同样的密钥签名覆盖你的应用。

---

## 十、开源协议

本项目基于 [MIT License](LICENSE) 开源。

Copyright (c) 2026 StoryPhone Contributors

在遵守 MIT 协议条款的前提下，你可以自由使用、修改、分发、商用本项目。如果本项目对你有帮助，欢迎 Star ⭐ 支持！
