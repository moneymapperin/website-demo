package com.moneymapper

import io.flutter.embedding.android.FlutterFragmentActivity
import android.view.WindowManager
import android.os.Bundle
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterFragmentActivity() {
    private val CHANNEL = "com.moneymapper/security"
    private val INTEGRITY_CHANNEL = "com.moneymapper/integrity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Default to secure
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Security Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "setSecure") {
                val isSecure = call.argument<Boolean>("isSecure") ?: true
                setSecure(isSecure)
                result.success(null)
            } else {
                result.notImplemented()
            }
        }

        // Play Integrity Attestation Channel Boilerplate
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, INTEGRITY_CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "requestIntegrityToken") {
                val nonce = call.argument<String>("nonce") ?: ""
                val cloudProjectNumber = call.argument<String>("cloudProjectNumber") ?: ""
                
                // Native Play Integrity Manager dispatch
                // Once com.google.android.play:integrity dependency is added to build.gradle.kts:
                // IntegrityManagerFactory.create(applicationContext)...
                
                // Returning a mock token for local testing until GCP Cloud Project Number is wired:
                result.success("integrity_token_attested_for_nonce_$nonce")
            } else {
                result.notImplemented()
            }
        }
    }

    private fun setSecure(isSecure: Boolean) {
        runOnUiThread {
            if (isSecure) {
                window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            } else {
                window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            }
        }
    }
}
