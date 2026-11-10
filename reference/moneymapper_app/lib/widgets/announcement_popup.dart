import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AnnouncementPopup {
  static Future<void> checkAndShow(BuildContext context) async {
    try {
      final supabase = Supabase.instance.client;
      
      // Fetch the single active announcement
      final response = await supabase
          .schema('public')
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response == null) return; // No active announcement

      final String id = response['id'].toString();
      final String htmlContent = response['html_content'].toString();
      final bool showOnce = response['show_once_per_user'] == true;
      final String title = response['title'] ?? 'Announcement';

      final prefs = await SharedPreferences.getInstance();
      final String cacheKey = 'announcement_seen_$id';

      if (showOnce) {
        final hasSeen = prefs.getBool(cacheKey) ?? false;
        if (hasSeen) return; // Already seen, skip
      }

      if (!context.mounted) return;

      // Show the popup
      await showDialog(
        context: context,
        barrierDismissible: true,
        builder: (ctx) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 500),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(),
                Flexible(
                  child: SingleChildScrollView(
                    child: HtmlWidget(
                      htmlContent,
                      textStyle: const TextStyle(fontSize: 15, height: 1.4),
                      customStylesBuilder: (element) {
                        if (element.classes.contains('highlight')) {
                          return {'color': 'red'};
                        }
                        return null;
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Okay'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Mark as seen immediately after closing the dialog
      if (showOnce) {
        await prefs.setBool(cacheKey, true);
      }

    } catch (e) {
      debugPrint("Failed to fetch announcement: $e");
    }
  }
}