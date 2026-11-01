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
| 全屏无灰顶栏 | `MainActivity.setupFullscreenWindow()` + `applyImmersiveMode()` + `res/values/styles.xml` | 状态栏与导航栏全隐藏、系统栏颜色透明、窗口底色纯黑（不会在刘海条处透出白色）；`systemBarsBehavior` 为“滑动临时呼出”，划出后 `installInsetsGuard()` 会自动再收起 |
| 输入框不被键盘遮挡 | Manifest `windowSoftInputMode="adjustResize"` + `WindowCompat.setDecorFitsSystemWindows(window, true)` | 键盘弹出时 WebView 真实变矮，输入框与底栏随之上移；**不再**使用 `interactive-widget=resizes-content`（与 adjustResize 叠加会把视口压两次，导致整页被顶飞、中间出现大白框） |
| 边缘滑动返回 | `MainActivity.dispatchTouchEvent()` → `handleBackRequest(true)` | 左边缘右划 / 右边缘左划（贴边 28dp 内起手、水平位移 ≥72dp）触发返回；先回上一页，回不去则静默忽略，**绝不退出 APK**（只有物理返回键才走“再返回一次退出”），所以桌面左右翻页不会误退 |
| 返回键不误退 | 同 `handleBackRequest()` | 网页侧 `window.__storyNativeBack()` 按「浮层 → 设置二级 → 应用窗口」逐级回退，全部关完才轮到退出确认 |
| 数据导入导出 | `assets/app_settings.js` + `AndroidMcp.openExportStream()` | 导出统一落到 `Download/Storypoem/`；Android 10+ 走 MediaStore（无需“所有文件访问”权限），Android 9 及以下直写公共下载目录；导入走 HTML5 `<input type="file">`，壳层已做 `createIntent()` 兜底 |
| 本地通知权限 | `AndroidMcp.requestNotificationPermission()` / `hasNotificationPermission()` / `openNotificationSettings()`，前端 `window.StoryNotify` | Android 13+ 一次性弹出 `POST_NOTIFICATIONS` 运行时授权；被用户关掉时可直接跳到本应用通知设置页；`showSystemNotification()` 发通知前会自动补齐权限 |
| 真全屏（无顶部白条） | `MainActivity.setupFullscreenWindow()` / `applyImmersiveMode()` / `installInsetsGuard()` + `app_native_bridge.js` 给 `<html>` 打 `story-native-shell` 标记 | 状态栏与导航栏全隐藏、系统栏颜色透明；系统或输入法把状态栏顶回来时立即再隐藏；壳层内把 `env(safe-area-inset-*)` 留白统一归零（`style.css` 里 `html.story-native-shell` 规则），顶部不再出现浅色条带，应用窗口也不会被安全区顶起来 |
| 键盘不顶飞页面 | Manifest `adjustResize` + `installInsetsGuard()` + `app_native_bridge.js` 视口守卫 | 键盘弹出时 WebView 真实变矮 → 底栏随键盘上移；键盘收起后壳层主动 `requestLayout()` 并把文档级滚动量归零、桌面滚动位置还原，不会再出现「整页上移且退不回来」；页面里已移除 `interactive-widget` 与 `scrollIntoView` 补丁，避免二次补偿 |

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
