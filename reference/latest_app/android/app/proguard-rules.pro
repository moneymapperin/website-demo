# ============================================================================
# MoneyMapper - Production R8 / ProGuard Obfuscation & Scrambling Rules
# ============================================================================

# --- 1. Flutter Engine & Core Embeddings ---
-keep class io.flutter.** { *; }
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }
-keepclassmembers class * implements io.flutter.plugin.common.MethodChannel.MethodCallHandler {
    public <methods>;
}

# --- 2. Supabase, PostgREST & Auth Client Reflection ---
-keep class io.supabase.** { *; }
-keep class supabase.** { *; }
-keep class postgrest.** { *; }
-keep class gotrue.** { *; }
-keep class realtime.** { *; }
-keep class functions.** { *; }
-keepattributes Signature, InnerClasses, EnclosingMethod, Annotation, *Annotation*

# --- 3. JSON & Model Serialization (Gson / Jackson / Kotlinx) ---
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.google.gson.** { *; }

# --- 4. Flutter Native Plugins ---
# Flutter Secure Storage & Android Keystore
-keep class com.it_item.flutter_secure_storage.** { *; }
-dontwarn com.it_item.flutter_secure_storage.**

# Local Auth / Biometrics
-keep class io.flutter.plugins.localauth.** { *; }

# Mobile Scanner
-keep class com.microblink.** { *; }
-keep class dev.zxing.** { *; }

# Flutter Local Notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }

# Dio Network Client
-keep class com.developers.dio.** { *; }
-dontwarn dio.**

# --- 5. Obfuscation & Metadata Stripping ---
-repackageclasses 'com.moneymapper.obscured'
-allowaccessmodification
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
-dontwarn java.lang.invoke.**
