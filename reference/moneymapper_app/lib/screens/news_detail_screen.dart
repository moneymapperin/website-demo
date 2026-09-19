import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

class NewsDetailScreen extends StatelessWidget {
  final Map<String, dynamic> news;
  final bool isNews;

  const NewsDetailScreen({super.key, required this.news, this.isNews = true});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final String title = news['title'] ?? 'No Title';
    final String? imageUrl = isNews ? news['image_url'] : news['imageUrl'];
    final String description = isNews 
        ? (news['description'] ?? news['content'] ?? 'No description available.')
        : (news['fullContent'] ?? news['summary'] ?? 'No content available.');
    
    final String source = isNews 
        ? (news['publisher'] ?? news['source_id'] ?? 'FINANCE NEWS').toString().toUpperCase()
        : (news['author'] ?? news['publisher'] ?? 'WEALTH BLOG').toString().toUpperCase();

    final String? link = news['url'] ?? news['link'];

    // Simple HTML stripper to make content readable
    String cleanDescription = description.replaceAll(RegExp(r'<[^>]*>|&nbsp;'), ' ');
    // Collapse multiple spaces/newlines for readability
    cleanDescription = cleanDescription.replaceAll(RegExp(r'\s+'), ' ').trim();

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: Text(isNews ? "Market Story" : "Wealth Guide", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imageUrl != null)
              Image.network(
                imageUrl,
                width: double.infinity,
                height: 250,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 200,
                  color: Colors.grey.withOpacity(0.1),
                  child: const Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      source,
                      style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.3),
                  ),
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 20),
                  Text(
                    cleanDescription,
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.6,
                      color: isDark ? Colors.white70 : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 30),
                  if (link != null)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication),
                        icon: const Icon(Icons.open_in_browser, color: Colors.white),
                        label: const Text("Read Full Article on Source", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
