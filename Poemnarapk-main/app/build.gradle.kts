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
        versionCode = 6
        versionName = "1.3.1"

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
    signingConfigs {
        create("release") {
            storeFile = file("storyphone.jks")
            storePassword = "123456"
            keyAlias = "key"
            keyPassword = "123456"
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
