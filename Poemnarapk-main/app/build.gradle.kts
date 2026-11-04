plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.story.phone"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.story.phone"
        minSdk = 26 // 安卓 8.0，保障完美兼容通知监听、硬件马达与无障碍接口
        targetSdk = 34
        versionCode = 10
        versionName = "1.3.5"

        // ★ 体积优化：只打包真机 ABI。
        //   onnxruntime 的 x86 / x86_64 两个 .so 合计约 78MB，只在模拟器里用得上，
        //   真机（arm64-v8a 为主、少量老机 armeabi-v7a）完全不需要，直接剔除。
        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a")
        }
    }

    packaging {
        // 压缩 APK 内的 .so（安装时解压到 data 目录，运行行为不变），体积可再降一大截
        jniLibs {
            useLegacyPackaging = true
        }
        resources {
            // 剔除依赖库自带的许可证/元信息文件
            excludes += listOf(
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/license.txt",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt",
                "META-INF/notice.txt",
                "META-INF/AL2.0",
                "META-INF/LGPL2.1"
            )
        }
    }

    // 签名配置：使用项目自带的 storyphone.jks
    // 密码和别名都是好记的 123456 / key
    //
    // ★ 必须显式开启 v1/v2/v3 三套签名，否则真机装不上：
    //   minSdk = 26（≥24）时 AGP 默认只打 v2、**关掉 v1（JAR 签名）**，
    //   而 vivo / OPPO 等国产 ROM 的安装器（QQ、文件管理器走同一套校验）仍按老式
    //   JarFile 路径校验证书，遇到只有 v2 的包会报
    //   「应用未安装：软件包似乎无效 / 安装包缺乏开发者证书」
    //   （即 INSTALL_PARSE_FAILED_NO_CERTIFICATES）。
    //   显式开三套签名后，新老校验路径都能验到证书，安装恢复正常。
    signingConfigs {
        create("release") {
            storeFile = file("storyphone.jks")
            storePassword = "123456"
            keyAlias = "key"
            keyPassword = "123456"
            enableV1Signing = true // JAR 签名（兼容国产 ROM 安装器的老校验路径）
            enableV2Signing = true // APK Signature Scheme v2（Android 7+ 主校验）
            enableV3Signing = true // v3（Android 9+ 密钥轮换支持）
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            // ★ 体积优化：R8 压缩代码的同时把未被引用的资源（库自带的 drawable/layout/color）一并剔掉
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            // debug 也使用同一个签名，避免调试版和发布版签名冲突
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    // 说明：com.google.android.material 已移除 —— 全项目只有一个纯 WebView 的 activity_main.xml，
    // 没有用到任何 Material 控件/主题，留着只会白占 res 与 dex 体积。
    implementation("androidx.webkit:webkit:1.10.0")
    implementation("com.microsoft.onnxruntime:onnxruntime-android:latest.release")
}
