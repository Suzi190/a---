package com.story.phone

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Resources
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.IBinder
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.story.phone.R
import kotlin.math.abs

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var androidMcp: AndroidMcp
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_RESULT_CODE = 101
    private val PERMISSIONS_REQUEST_CODE = 102

    // ===== 返回逻辑状态（手势边缘返回 / 物理返回键共用） =====
    private var exitArmedAt = 0L // 上一次“再按一次退出”的时间戳
    private var swipeTracking = false // 本次触摸是否从屏幕左右边缘起手
    private var swipeStartX = 0f
    private var swipeStartY = 0f
    private var swipeStartAt = 0L

    // 边缘起手判定区 & 触发距离（dp → px）
    private val edgeZonePx: Float by lazy { 28f * resources.displayMetrics.density }
    private val edgeDistancePx: Float by lazy { 72f * resources.displayMetrics.density }
    /** 上一帧输入法是否可见：用于在键盘收起时补一次 WebView relayout */
    private var imeWasVisible = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // ① 全屏：edge-to-edge 铺满整块屏幕（状态栏 / 导航栏 / 挖孔区都不再占位）
        setupFullscreenWindow()
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        // ② 去掉 WebView 默认灰底与拖动时的边缘泛光，避免顶部/底部出现灰色条带
        //    底色改用与应用主背景一致的 #f4f6fa：任何露出的缝隙都不再是刺眼的白色
        val appBg = ContextCompat.getColor(this, R.color.app_bg)
        webView.setBackgroundColor(appBg)
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        // ③ 系统栏 / 键盘守卫：edge-to-edge 铺满整屏，键盘只抬 WebView 底边，状态栏被顶回来就再隐藏
        installEdgeToEdgeInsets()
        // ④ 文档级滚动守卫：本项目页面全部是「固定高度 + 内部容器滚动」布局，
        //    WebView 自身一旦被 scrollIntoView / 输入框自动上移顶起来（overflow:hidden
        //    只禁用户手势、不禁程序滚动），用户就再也拖不回来 —— 真机上表现就是
        //    「桌面一片空白、Dock 跑到屏幕上方、下方露出大片底色」。
        //    这里把 WebView 自身的滚动量钉死在 0，页面内部容器的滚动完全不受影响。
        webView.setOnScrollChangeListener { v, _, _, _, _ ->
            if (v != null && (v.scrollX != 0 || v.scrollY != 0)) v.scrollTo(0, 0)
        }

        
        webView.webViewClient = object : WebViewClient() {
            @Suppress("DEPRECATION")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return handleExternalUrl(url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: android.webkit.WebResourceRequest?
            ): Boolean {
                return handleExternalUrl(request?.url?.toString())
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // 网页 focus / 软键盘可能把系统栏抢回来，页面加载完成后重新锁定全屏
                applyImmersiveMode()
            }
        }

        // 重写 WebChromeClient 解决定位授权与网页 File 文件选择器失灵问题
        webView.webChromeClient = object : WebChromeClient() {
            // 支持 HTML5 Geolocation 定位授权
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            // 支持 HTML5 <input type="file"> 文件选择器（备份/角色卡导入等全部走这里）
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                @Suppress("UNCHECKED_CAST")
                (fileUploadCallback as? ValueCallback<Array<Uri>?>)?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                // 首选系统推荐 Intent；部分机型 createIntent() 返回 null，则用 ACTION_GET_CONTENT 兜底
                var intent = fileChooserParams?.createIntent()
                if (intent == null) {
                    intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = resolveAcceptType(fileChooserParams)
                        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                    }
                }

                return try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE)
                    true
                } catch (e: ActivityNotFoundException) {
                    // 二级兜底：任意文件
                    try {
                        startActivityForResult(
                            Intent(Intent.ACTION_GET_CONTENT).apply {
                                addCategory(Intent.CATEGORY_OPENABLE)
                                type = "*/*"
                            },
                            FILE_CHOOSER_RESULT_CODE
                        )
                        true
                    } catch (e2: Exception) {
                        fileUploadCallback = null
                        Toast.makeText(this@MainActivity, "当前设备没有可用的文件选择器", Toast.LENGTH_SHORT).show()
                        false
                    }
                }
            }
        }

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true 
        settings.allowFileAccess = true   
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        // 本地 file:// 页面需要访问同源资源（备份/角色卡/图片导入导出依赖）
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.setGeolocationEnabled(true)
        settings.javaScriptCanOpenWindowsAutomatically = false
        settings.setSupportMultipleWindows(false)
        
        // 解锁 AI 在后台静默自动点播放歌
        settings.mediaPlaybackRequiresUserGesture = false

        // 直链下载（http/https）交给系统下载管理器，落到 Download/Storypoem
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            try {
                if (url.startsWith("data:") || url.startsWith("blob:")) return@setDownloadListener
                val fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType)
                val request = android.app.DownloadManager.Request(Uri.parse(url)).apply {
                    addRequestHeader("User-Agent", userAgent)
                    setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "Storypoem/$fileName")
                }
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
                dm.enqueue(request)
                Toast.makeText(this, "已开始下载：$fileName", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(this, "下载失败，请检查网络或存储权限", Toast.LENGTH_SHORT).show()
            }
        }

        // 注入 window.AndroidMCP 原生接口并向静态通道注册主 Activity 引用
        AndroidMcp.mainActivity = this
        androidMcp = AndroidMcp(this)
        webView.addJavascriptInterface(androidMcp, "AndroidMCP")

        // 加载 assets 本地打包的前端页面
        webView.loadUrl("file:///android_asset/index.html")

        // 自动申请 Android 定位与通知的系统级运行时权限
        requestAppPermissions()
    }

    // 处理文件选择器弹窗的回调 
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (fileUploadCallback == null) return
            val results = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            
            @Suppress("UNCHECKED_CAST")
            (fileUploadCallback as? ValueCallback<Array<Uri>?>)?.onReceiveValue(results)
            fileUploadCallback = null
        }
    }

    // 申请运行时权限
    private fun requestAppPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        // 动态合并追加存储与媒体音频权限，兼容 Android 13+ 与旧版系统
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            permissions.add(Manifest.permission.READ_MEDIA_AUDIO)
        } else {
            @Suppress("DEPRECATION")
            permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            @Suppress("DEPRECATION")
            permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }

        val listToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (listToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                listToRequest.toTypedArray(),
                PERMISSIONS_REQUEST_CODE
            )
        }
    }

    // ==========================================================
    // 全屏沉浸：隐藏状态栏 + 导航栏（无灰色顶栏），但保留 adjustResize
    // ==========================================================

    private fun setupFullscreenWindow() {
        // 窗体底色 = 应用主背景色（#f4f6fa，与网页 --bg-main 一致），仅作最后一道兜底
        window.setBackgroundDrawable(ColorDrawable(ContextCompat.getColor(this, R.color.app_bg)))
        // 系统栏颜色透明：系统栏被临时唤出时透出的是网页内容，而不是一条底色
        @Suppress("DEPRECATION")
        run {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            window.statusBarColor = Color.TRANSPARENT
            window.navigationBarColor = Color.TRANSPARENT
        }
        // ★ 真·全屏铺满（不是「给条带染色」）：
        //   decorFitsSystemWindows = false 让 DecorView 不再为状态栏 / 导航栏 / 挖孔区预留内边距，
        //   页面从屏幕最顶端第一颗像素一直画到最底端最后一颗像素。
        //   之前保持 true，系统即使把状态栏隐藏，dec 内容区仍可能被 inset 顶下一截，
        //   那一截只能是窗体底色 —— 这就是「顶部永远有一条带」的来源。
        window.decorView.fitsSystemWindows = false
        WindowCompat.setDecorFitsSystemWindows(window, false)
        // 允许绘制到刘海 / 挖孔区域：Android 11+ 用 ALWAYS 最彻底，老机型退化为 shortEdges
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.attributes = window.attributes.apply {
                @Suppress("DEPRECATION")
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes = window.attributes.apply {
                @Suppress("DEPRECATION")
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        // 键盘策略：
        //  · Android 11+（edge-to-edge）：系统不再自动缩窗口，改由 installEdgeToEdgeInsets()
        //    按 IME inset 把 WebView 底边抬到键盘上沿（等价 adjustResize，但不会把整页顶飞）；
        //  · Android 8~10：仍走系统 ADJUST_RESIZE，真实缩小窗口高度。
        window.setSoftInputMode(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
            else
                WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        )
        applyImmersiveMode()
    }

    private fun applyImmersiveMode() {
        try {
            @Suppress("DEPRECATION")
            run {
                window.statusBarColor = Color.TRANSPARENT
                window.navigationBarColor = Color.TRANSPARENT
            }
            val controller = WindowCompat.getInsetsController(window, window.decorView)
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.isAppearanceLightStatusBars = false
            controller.isAppearanceLightNavigationBars = false
            controller.hide(WindowInsetsCompat.Type.systemBars())
            @Suppress("DEPRECATION")
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * 边缘到边缘（edge-to-edge）布局守卫：
     * 1) 状态栏 / 导航栏 / 挖孔区的 inset 一律不施加给 WebView —— 页面从屏幕最顶端画到最底端，
     *    这是「铺满整屏」和「把条带染成同色」的根本区别；
     * 2) Android 11+ 系统不再为键盘缩窗口，这里按 IME inset 把 WebView 底边抬到键盘上沿，
     *    效果等同 adjustResize：输入框自动上移、整页不会被顶飞；
     * 3) 状态栏 / 导航栏一旦被系统重新显示，立刻再隐藏；
     * 4) 键盘收起时补一次 relayout，避免视口停留在被压缩高度（底栏卡在上移位置）。
     */
    private fun installEdgeToEdgeInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { view, insets ->
            val systemBarsVisible = insets.isVisible(WindowInsetsCompat.Type.statusBars()) ||
                insets.isVisible(WindowInsetsCompat.Type.navigationBars())
            if (systemBarsVisible) view.post { applyImmersiveMode() }

            if (::webView.isInitialized) {
                // 只处理键盘：系统栏 inset 全部丢弃，WebView 才能铺满整屏。
                // 关键：必须先 isVisible(ime()) 再取 ime().bottom，不能只读 bottom ——
                // 部分 ROM（MIUI / HyperOS / EMUI）在键盘收起后仍会回传过期的 IME inset，
                // 照着它设 bottomMargin，WebView 就会永久矮一截：页面只能在「缩小的视口」
                // 里排版，于是底栏上浮、下方露出大片壁纸/空白，而且不会自行恢复。
                val imeVisible = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
                    insets.isVisible(WindowInsetsCompat.Type.ime())
                val imeBottom = if (imeVisible)
                    insets.getInsets(WindowInsetsCompat.Type.ime()).bottom else 0
                val lp = webView.layoutParams
                if (lp is ViewGroup.MarginLayoutParams && lp.bottomMargin != imeBottom) {
                    lp.bottomMargin = imeBottom
                    webView.layoutParams = lp
                    webView.requestLayout()
                }
                webView.fitsSystemWindows = false
            }
            insets
        }

        // 老系统 / 部分 ROM 只会回调 legacy 的 systemUiVisibility 变化，这里再兜一层
        @Suppress("DEPRECATION")
        window.decorView.setOnSystemUiVisibilityChangeListener { visibility ->
            if (visibility and View.SYSTEM_UI_FLAG_FULLSCREEN == 0) {
                window.decorView.post { applyImmersiveMode() }
            }
        }

        // 键盘高度变化守卫：用可见区域高度判断输入法开合，收起时强制 WebView 重新布局
        window.decorView.viewTreeObserver.addOnGlobalLayoutListener {
            if (!::webView.isInitialized) return@addOnGlobalLayoutListener
            val visibleFrame = android.graphics.Rect()
            window.decorView.getWindowVisibleDisplayFrame(visibleFrame)
            val screenHeight = window.decorView.rootView.height
            if (screenHeight <= 0) return@addOnGlobalLayoutListener
            val imeVisible = (screenHeight - visibleFrame.bottom) > screenHeight * 0.15f
            if (imeWasVisible && !imeVisible) {
                // 键盘收起：清掉可能残留的底部留白 + 强制重新布局，
                // 否则视口会停在被压缩的高度上（底栏卡在上移位置）
                clearWebViewImeMargin()
                webView.post {
                    webView.requestLayout()
                    webView.invalidate()
                }
            }
            imeWasVisible = imeVisible
        }
    }

    /**
     * 键盘不在时把 WebView 底部留白抹平。
     * 只在「确实非 0」时才写 layoutParams，避免每次全局布局都触发一次 requestLayout。
     */
    private fun clearWebViewImeMargin() {
        if (!::webView.isInitialized) return
        val lp = webView.layoutParams
        if (lp is ViewGroup.MarginLayoutParams && lp.bottomMargin != 0) {
            lp.bottomMargin = 0
            webView.layoutParams = lp
            webView.requestLayout()
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        // 从系统栏 / 键盘返回页面时重新锁定全屏
        if (hasFocus) applyImmersiveMode()
    }

    override fun onResume() {
        super.onResume()
        applyImmersiveMode()
        // 从后台 / 其它应用回来时，ROM 可能留下过期的 IME 留白，这里顺手抹平
        if (!imeWasVisible) clearWebViewImeMargin()
    }

    // 折叠屏展开 / 分屏 / 旋转等配置变化（activity 声明了 configChanges，不会重建）后，
    // 系统栏可能被系统重新显示，这里立即再锁一次全屏，避免顶部重新出现状态栏白条
    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        super.onConfigurationChanged(newConfig)
        applyImmersiveMode()
    }

    /** 解析 accept 类型，供 ACTION_GET_CONTENT 兜底使用 */
    private fun resolveAcceptType(params: WebChromeClient.FileChooserParams?): String {
        val accepts = params?.acceptTypes ?: return "*/*"
        for (raw in accepts) {
            val item = raw.trim()
            if (item.isEmpty() || item.startsWith(".")) continue // 后缀形式无法直接映射到 MIME
            if (item.contains("/")) return item
        }
        return "*/*"
    }

    /**
     * 站外链接（http/https/mailto/tel 等）交给系统处理，站内 file:// 与本地服务不拦截。
     * @return true 表示已由系统接管，WebView 不再加载
     */
    private fun handleExternalUrl(url: String?): Boolean {
        if (url.isNullOrBlank()) return false
        val lower = url.lowercase()
        if (lower.startsWith("file://") || lower.startsWith("about:") || lower.startsWith("blob:") ||
            lower.startsWith("data:") || lower.startsWith("javascript:") || lower.startsWith("content:")
        ) {
            return false
        }
        val uri = try { Uri.parse(url) } catch (e: Exception) { return false }
        val scheme = uri.scheme?.lowercase() ?: return false
        if (scheme == "http" || scheme == "https") {
            val host = uri.host ?: return false
            // 本地回环（内置代理 / 调试服务）保持站内处理
            if (host == "localhost" || host == "127.0.0.1" || host == "0.0.0.0") return false
        }
        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }


    /**
     * 统一返回入口：先问网页“还有没有上一页”，网页处理完则吞掉；
     * 否则回退 WebView 历史；仍无历史时——
     *   · 物理返回键：二次确认后才允许退出；
     *   · 边缘滑动手势：静默忽略，绝不退出 APK。
     */
    private fun handleBackRequest(fromGesture: Boolean = false) {
        if (!::webView.isInitialized) {
            if (!fromGesture) finish()
            return
        }
        try {
            webView.evaluateJavascript(
                "(function(){try{return String((window.__storyNativeBack && window.__storyNativeBack()) || 'unhandled');}catch(e){return 'unhandled';}})()"
            ) { raw ->
                val result = raw?.trim()?.trim('"') ?: ""
                if (result == "handled") {
                    exitArmedAt = 0L
                    return@evaluateJavascript
                }
                if (webView.canGoBack()) {
                    webView.goBack()
                    exitArmedAt = 0L
                    return@evaluateJavascript
                }
                if (!fromGesture) askBeforeExit()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            if (!fromGesture) askBeforeExit()
        }
    }

    /** 连续两次返回才退出，避免手势误划直接杀掉应用 */
    private fun askBeforeExit() {
        val now = System.currentTimeMillis()
        val gap = now - exitArmedAt
        if (gap in 1..2000) {
            exitArmedAt = 0L
            finish()
        } else {
            exitArmedAt = now
            Toast.makeText(this, "再返回一次退出叙事诗", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onBackPressed() {
        handleBackRequest()
    }

    /**
     * 边缘手势返回：从屏幕左边缘向右划 / 右边缘向左划 → 触发返回。
     * 只在贴边 28dp 内起手且水平位移 ≥72dp 时触发，避免误伤横向滚动列表。
     */
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                val width = window.decorView.width.takeIf { it > 0 } ?: resources.displayMetrics.widthPixels
                swipeTracking = ev.x <= edgeZonePx || ev.x >= width - edgeZonePx
                swipeStartX = ev.x
                swipeStartY = ev.y
                swipeStartAt = System.currentTimeMillis()
            }
            MotionEvent.ACTION_UP -> {
                if (swipeTracking) {
                    swipeTracking = false
                    val dx = ev.x - swipeStartX
                    val dy = ev.y - swipeStartY
                    val elapsed = System.currentTimeMillis() - swipeStartAt
                    if (elapsed <= 700 && abs(dx) >= edgeDistancePx && abs(dx) >= abs(dy) * 1.6f) {
                        handleBackRequest(true)
                    }
                }
            }
            MotionEvent.ACTION_CANCEL -> swipeTracking = false
        }
        return super.dispatchTouchEvent(ev)
    }

    // ==========================================================
    // 本地通知权限（Android 13+ 运行时授权）
    // ==========================================================

    /** 供 AndroidMCP 调用：申请 Android 13+ 的本地通知运行时权限 */
    fun requestNotificationPermissionNow() {
        runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                ) {
                    ActivityCompat.requestPermissions(
                        this,
                        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                        PERMISSIONS_REQUEST_CODE
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /** 当前是否已允许本地通知（含用户在系统设置里关闭通知的情况） */
    fun hasNotificationPermissionNow(): Boolean {
        return try {
            if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }
        } catch (e: Exception) {
            false
        }
    }

    /** 权限申请结果回传网页，便于前端提示“通知已被关闭” */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != PERMISSIONS_REQUEST_CODE) return
        val granted = try { hasNotificationPermissionNow() } catch (e: Exception) { false }
        try {
            if (::webView.isInitialized) {
                webView.evaluateJavascript(
                    "window.StoryNotify && window.StoryNotify._onNativeResult && window.StoryNotify._onNativeResult($granted);",
                    null
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        try {
            // 停止 AlarmManager 后台心跳，并注销媒体控制 Receiver，避免内存泄漏
            androidMcp.stopBackgroundPolling()
            androidMcp.unregisterMediaReceiver()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }
}

/**
 * 前台服务 —— 保障后台运行时不被系统杀进程，
 * 同时支持歌单持续播放与后台发信功能。
 *
 * ⚠ 使用前必须满足：
 * 1) AndroidManifest.xml 中声明了 <service android:foregroundServiceType="specialUse" />
 * 2) Android 13+ 已获取 POST_NOTIFICATIONS 权限
 * 3) 调用 context.startForegroundService(intent) 后，本服务必须在 5 秒内
 *    调用 startForeground()，否则系统抛出 ForegroundServiceDidNotStartInTimeException
 */
class McpForegroundService : Service() {

    companion object {
        private const val CHANNEL_ID = "mcp_foreground_service_channel"
        private const val NOTIFICATION_ID = 1005
    }

    // 静默音频保活：播放无声音频保持 WebView JS 环境活跃，防止后台被冻结
    private var keepAliveAudioTrack: android.media.AudioTrack? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

        // 启动静默音频保活，保持 WebView JS 环境活跃
        startKeepAliveAudio()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        // 停止静默音频保活
        stopKeepAliveAudio()
        // 兜底释放 AndroidMcp 持有的后台 WakeLock，防止服务被回收后 WakeLock 仍占用
        try {
            AndroidMcp.releaseWakeLockIfHeld()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }

    /**
     * 静默音频保活：使用 AudioTrack 播放无声音频，让系统认为应用正在播放媒体，
     * 从而保持 WebView 的 JS 执行环境活跃，防止后台时 evaluateJavascript 和 fetch 被冻结。
     * 这解决了"必须留在 APK 内才能触发发信"的核心问题。
     */
    private fun startKeepAliveAudio() {
        try {
            val sampleRate = 8000  // 低采样率省电
            val frames = sampleRate  // 1秒的帧数
            val bufferSizeInBytes = frames * 2  // 16bit mono = 2 bytes/frame

            val audioTrack = android.media.AudioTrack.Builder()
                .setAudioAttributes(
                    android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                .setAudioFormat(
                    android.media.AudioFormat.Builder()
                        .setEncoding(android.media.AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(android.media.AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(bufferSizeInBytes)
                .setTransferMode(android.media.AudioTrack.MODE_STATIC)
                .build()

            // 写入静音 PCM 数据（全零）
            val silentData = ByteArray(bufferSizeInBytes)
            audioTrack.write(silentData, 0, silentData.size)

            // 设置无限循环播放
            audioTrack.setLoopPoints(0, frames, -1)

            audioTrack.play()
            keepAliveAudioTrack = audioTrack

            android.util.Log.d("McpForegroundService", "静默音频保活已启动")
        } catch (e: Exception) {
            android.util.Log.e("McpForegroundService", "静默音频保活启动失败: ${e.message}")
            e.printStackTrace()
        }
    }

    private fun stopKeepAliveAudio() {
        try {
            keepAliveAudioTrack?.stop()
            keepAliveAudioTrack?.release()
            keepAliveAudioTrack = null
            android.util.Log.d("McpForegroundService", "静默音频保活已停止")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // ---------------------------------------------------------------
    // 通知构建
    // ---------------------------------------------------------------

    /**
     * 构建前台通知：
     * - 优先使用项目自有图标 R.drawable.ic_launcher
     * - 若资源加载失败（例如资源 ID 无效或资源未找到），
     *   降级为 Android 系统内置图标 android.R.drawable.ic_dialog_info
     */
    private fun buildNotification(): android.app.Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        // 安全加载小图标 —— 避免因资源找不到导致前台服务启动失败
        val smallIcon = safeGetSmallIcon()

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("叙事诗前台守护中")
            .setContentText("系统不休眠、歌单播放与后台发信功能保护中")
            .setSmallIcon(smallIcon)
            .setContentIntent(pendingIntent)
            .build()
    }

    /**
     * 安全获取通知小图标：
     * 尝试使用 R.drawable.ic_launcher，若抛出异常则降级为系统图标
     */
    private fun safeGetSmallIcon(): Int {
        return try {
            // 验证资源是否存在
            resources.getDrawable(R.drawable.ic_launcher, theme)
            R.drawable.ic_launcher
        } catch (e: Resources.NotFoundException) {
            // 资源未找到时使用系统原生图标兜底
            android.R.drawable.ic_dialog_info
        } catch (e: Exception) {
            android.R.drawable.ic_dialog_info
        }
    }

    // ---------------------------------------------------------------
    // 通知渠道
    // ---------------------------------------------------------------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "叙事诗后台守护通道",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }
}

// ============================================================
//  后台保活 / 定时闹钟 / 开机自启 三个 BroadcastReceiver
// ============================================================

/**
 * 后台心跳 Receiver：由 AlarmManager.setAndAllowWhileIdle 触发，
 * Doze 下仍可唤醒 CPU。收到后链式重排下一次，并向 WebView 注入心跳 JS。
 */
class BgPollReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val intervalMs = intent?.getLongExtra(EXTRA_INTERVAL_MS, DEFAULT_INTERVAL_MS) ?: DEFAULT_INTERVAL_MS
        // 链式重排下一次唤醒
        scheduleNextPoll(context, intervalMs)
        // 强制在 UI 线程向 WebView 注入心跳 JS
        val activity = AndroidMcp.mainActivity ?: return
        activity.runOnUiThread {
            try {
                val webView = activity.findViewById<WebView>(R.id.webview)
                webView?.evaluateJavascript(
                    "javascript:if(window.desktopPetSystem && typeof window.desktopPetSystem.triggerBackgroundActiveMessageNative === 'function') { window.desktopPetSystem.triggerBackgroundActiveMessageNative(); }",
                    null
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    companion object {
        private const val EXTRA_INTERVAL_MS = "interval_ms"
        private const val DEFAULT_INTERVAL_MS = 10L * 60_000L
        private const val REQUEST_CODE = 9991

        fun scheduleNextPoll(context: Context, intervalMs: Long) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
                val intent = Intent(context, BgPollReceiver::class.java).apply {
                    action = "com.story.phone.ACTION_BG_POLL"
                    putExtra(EXTRA_INTERVAL_MS, intervalMs)
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                } else {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT
                }
                val pi = android.app.PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
                val triggerAt = System.currentTimeMillis() + intervalMs
                // setAndAllowWhileIdle 在 Doze 下仍能唤醒，且不需要 SCHEDULE_EXACT_ALARM 权限
                am.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAt, pi)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        fun cancelPoll(context: Context) {
            try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
                val intent = Intent(context, BgPollReceiver::class.java).apply {
                    action = "com.story.phone.ACTION_BG_POLL"
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                } else {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT
                }
                val pi = android.app.PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
                am.cancel(pi)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

/**
 * 应用内定时闹钟 Receiver：到点后发系统通知 + 振动 + 唤醒 WebView 发消息。
 * 由 AndroidMcp.setInAppAlarm 通过 AlarmManager 调度。
 */
class InAppAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val message = intent?.getStringExtra(EXTRA_MESSAGE) ?: "叙事诗闹钟提醒"
        // 1. 振动
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as android.os.VibratorManager
                vm.defaultVibrator.vibrate(android.os.VibrationEffect.createOneShot(1000L, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val v = context.getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
                v.vibrate(android.os.VibrationEffect.createOneShot(1000L, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        // 2. 发系统通知
        try {
            showAlarmNotification(context, message)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        // 3. 直接通过 evaluateJavascript 触发 AI 发信
        //    配合 McpForegroundService 的静默音频保活，WebView JS 环境在后台保持活跃
        val activity = AndroidMcp.mainActivity
        if (activity != null) {
            activity.runOnUiThread {
                try {
                    val webView = activity.findViewById<WebView>(R.id.webview)
                    val quoted = org.json.JSONObject.quote(message)
                    webView?.evaluateJavascript(
                        "javascript:if(window.desktopPetSystem && typeof window.desktopPetSystem.handleInAppAlarm === 'function') { window.desktopPetSystem.handleInAppAlarm($quoted); }",
                        null
                    )
                } catch (ex: Exception) {
                    ex.printStackTrace()
                }
            }
        }
    }

    private fun showAlarmNotification(context: Context, message: String) {
        // 使用 _v2 后缀的新 channel ID，强制重建 importance
        val channelId = "story_phone_alarm_channel_v2"
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            var channel = nm.getNotificationChannel(channelId)
            if (channel == null) {
                nm.deleteNotificationChannel("story_phone_alarm_channel")
                channel = android.app.NotificationChannel(channelId, "叙事诗闹钟提醒", android.app.NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "应用内定时闹钟到点提醒（Heads-up 弹出式）"
                    enableVibration(true)
                    enableLights(true)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                }
                nm.createNotificationChannel(channel)
            }
        }
        val notifyIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        } else {
            android.app.PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pi = android.app.PendingIntent.getActivity(context, 0, notifyIntent, flags)
        val smallIcon = try {
            context.resources.getDrawable(R.drawable.ic_launcher, context.theme)
            R.drawable.ic_launcher
        } catch (e: Exception) {
            android.R.drawable.ic_dialog_info
        }
        val notification = androidx.core.app.NotificationCompat.Builder(context, channelId)
            .setSmallIcon(smallIcon)
            .setContentTitle("叙事诗闹钟")
            .setContentText(message)
            .setStyle(androidx.core.app.NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setCategory(androidx.core.app.NotificationCompat.CATEGORY_ALARM)
            .setVisibility(androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(longArrayOf(0, 500, 300, 500))
            .setDefaults(androidx.core.app.NotificationCompat.DEFAULT_SOUND)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build()
        nm.notify(1007, notification)
    }

    companion object {
        private const val EXTRA_MESSAGE = "alarm_message"
        private const val REQUEST_CODE = 9992

        // 取消应用内闹钟：用相同 REQUEST_CODE 重建 PendingIntent 并 cancel
        fun cancel(context: Context): Boolean {
            return try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
                val intent = Intent(context, InAppAlarmReceiver::class.java).apply {
                    action = "com.story.phone.ACTION_IN_APP_ALARM"
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                } else {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT
                }
                val pi = android.app.PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
                am.cancel(pi)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        fun schedule(context: Context, triggerAtMillis: Long, message: String): Boolean {
            return try {
                val am = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
                val intent = Intent(context, InAppAlarmReceiver::class.java).apply {
                    action = "com.story.phone.ACTION_IN_APP_ALARM"
                    putExtra(EXTRA_MESSAGE, message)
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                } else {
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT
                }
                val pi = android.app.PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
                // 优先精确闹钟（需 SCHEDULE_EXACT_ALARM），无权限则降级 setAndAllowWhileIdle
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (am.canScheduleExactAlarms()) {
                        am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
                    } else {
                        am.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
                    }
                } else {
                    am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
                }
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
    }
}

/**
 * 开机自启 Receiver：开机后重启前台守护服务，恢复保活。
 * 需要 RECEIVE_BOOT_COMPLETED 权限（已在 AndroidManifest 声明）。
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        try {
            val serviceIntent = Intent(context, McpForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
