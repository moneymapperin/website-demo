import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  static const _reminderEnabledKey = 'weekly_reminders_enabled';

  Future<void> init() async {
    tz_data.initializeTimeZones();
    // Set default timezone to India
    try {
      tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
    } catch (e) {
      // Fallback if location not found
    }

    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(initSettings);
  }

  /// Reset and reschedule the 2 notifications.
  Future<void> scheduleWeeklyReminders() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final bool isEnabled = prefs.getBool(_reminderEnabledKey) ?? true;

      await cancelAllReminders();

      if (!isEnabled) return;

      // Notification 1: 6 days + 1 hour = 145 hours
      await _scheduleNotification(
        id: 101,
        title: 'MoneyMapper Update 🦉',
        body: '6 din ho gaye hain! Aapne apna weekly financial journal update nahi kiya. Aaj hi check karein.',
        seconds: 145 * 3600,
      );

      // Notification 2: 7 days - 2 hours = 166 hours
      await _scheduleNotification(
        id: 102,
        title: 'Streak Warning! 🔥',
        body: 'Sirf 2 ghante bache hain! Apna data update karein warna aapki weekly streak reset ho sakti hai.',
        seconds: 166 * 3600,
      );
    } catch (e) {
      print("Notification Scheduling Error: $e");
    }
  }

  Future<void> _scheduleNotification({
    required int id,
    required String title,
    required String body,
    required int seconds,
  }) async {
    try {
      await _notificationsPlugin.zonedSchedule(
        id,
        title,
        body,
        tz.TZDateTime.now(tz.local).add(Duration(seconds: seconds)),
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'weekly_reminders',
            'Weekly Reminders',
            channelDescription: 'Notifications to remind user to update weekly data',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      print("Schedule Error: $e");
    }
  }

  Future<void> cancelAllReminders() async {
    try {
      await _notificationsPlugin.cancel(101);
      await _notificationsPlugin.cancel(102);
    } catch (e) {}
  }

  Future<bool> isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_reminderEnabledKey) ?? true;
  }

  Future<void> setEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_reminderEnabledKey, value);
    if (value) {
      await scheduleWeeklyReminders();
    } else {
      await cancelAllReminders();
    }
  }
}
