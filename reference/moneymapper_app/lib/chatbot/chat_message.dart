class QuickAction {
  final String label;
  final String route;

  const QuickAction({
    required this.label,
    required this.route,
  });
}

class ChatMessage {
  final String id;
  final String sender; // 'user' or 'bot'
  final String text;
  final String? redirectTo;
  final String? redirectLabel;
  final List<QuickAction> quickActions;
  final String timestamp; // "hh:mm a" format

  const ChatMessage({
    required this.id,
    required this.sender,
    required this.text,
    this.redirectTo,
    this.redirectLabel,
    this.quickActions = const [],
    required this.timestamp,
  });
}
