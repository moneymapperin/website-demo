import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private var channel: FlutterMethodChannel?
  private var isSecure: Bool = true

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    channel = FlutterMethodChannel(name: "com.moneymapper/security",
                                              binaryMessenger: controller.binaryMessenger)
    
    channel?.setMethodCallHandler({
      (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
      if call.method == "setSecure" {
        if let args = call.arguments as? [String: Any],
           let isSecure = args["isSecure"] as? Bool {
          self.isSecure = isSecure
        }
        result(nil)
      } else {
        result(FlutterMethodNotImplemented)
      }
    })

    // 1. Screenshot Detection
    NotificationCenter.default.addObserver(
        self,
        selector: #selector(didTakeScreenshot),
        name: UIApplication.userDidTakeScreenshotNotification,
        object: nil
    )

    // 2. Screen Recording Detection
    if #available(iOS 11.0, *) {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenCaptureStatusChanged),
            name: UIScreen.capturedDidChangeNotification,
            object: nil
        )
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private var blurView: UIVisualEffectView?

  override func applicationWillResignActive(_ application: UIApplication) {
      // Show blur when entering app switcher
      if isSecure && blurView == nil {
          let blurEffect = UIBlurEffect(style: .dark)
          blurView = UIVisualEffectView(effect: blurEffect)
          blurView?.frame = window?.frame ?? UIScreen.main.bounds
          window?.addSubview(blurView!)
      }
  }

  override func applicationDidBecomeActive(_ application: UIApplication) {
      // Remove blur when app is active
      blurView?.removeFromSuperview()
      blurView = nil
  }

  @objc func didTakeScreenshot() {
      if isSecure {
          channel?.invokeMethod("onScreenshotTaken", arguments: nil)
      }
  }

  @objc func screenCaptureStatusChanged() {
      if #available(iOS 11.0, *) {
          let isCaptured = UIScreen.main.isCaptured
          // We still send the event, but Flutter will check isSecure for the overlay
          channel?.invokeMethod("onScreenRecordingChanged", arguments: isCaptured)
      }
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
