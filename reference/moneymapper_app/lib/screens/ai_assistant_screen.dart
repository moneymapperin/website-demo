import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../chatbot/chat_intent_service.dart';
import '../chatbot/chat_message.dart';
import '../theme/app_theme.dart';
import '../services/premium_service.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final ChatIntentService _chatService = ChatIntentService();
  final PremiumService _premiumService = PremiumService();
  final List<ChatMessage> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;
  bool _isAiAccessible = true;
  bool _isPro = false;

  final List<Map<String, String>> _suggestions = [
    {'label': '📊 Reliance Stock', 'query': 'Reliance stock score'},
    {'label': '📈 SBI Mutual Fund', 'query': 'SBI Bluechip Mutual Fund'},
    {'label': '🛡️ Health Insurance', 'query': 'HDFC Ergo Health Insurance'},
    {'label': '🚀 Upcoming IPOs', 'query': 'Upcoming IPO score'},
    {'label': '🚨 Emergency Fund', 'query': 'Emergency Fund'},
    {'label': '📅 Weekly Expenses', 'query': 'Weekly Expenses'},
    {'label': '👤 Edit Profile', 'query': 'Edit Profile'},
  ];

  @override
  void initState() {
    super.initState();
    _loadAiPremiumStatus();

    _messages.add(
      ChatMessage(
        id: 'welcome',
        sender: 'bot',
        text:
            "Hi! I'm your Assistant. You can ask me questions about your financial pillars, mutual funds, or ask me to redirect you anywhere in the app!",
        redirectTo: null,
        redirectLabel: null,
        quickActions: const [
          QuickAction(
            label: "What's today's best stock for me?",
            route: "What's today's best stock for me?",
          ),
          QuickAction(
            label: "Which mutual fund suits my long-term goals?",
            route: "Which mutual fund suits my long-term goals?",
          ),
          QuickAction(
            label: "Best liquid fund for my emergency needs?",
            route: "Best liquid fund for my emergency needs?",
          ),
          QuickAction(
            label: "Which insurance fits my budget?",
            route: "Which insurance fits my budget?",
          ),
        ],
        timestamp: DateFormat('hh:mm a').format(DateTime.now()),
      ),
    );
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _navigateTo(String route) {
    Navigator.of(context).pushNamed(route);
  }

  Future<void> _handleSendMessage(String text) async {
    if (text.trim().isEmpty || _isTyping) return;

    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: DateFormat('hh:mm a').format(DateTime.now()),
    );

    _textController.value = TextEditingValue.empty;
    setState(() {
      _messages.add(userMsg);
      _isTyping = true;
    });
    _scrollToBottom();

    final botReply = await _chatService.processMessage(userMsg.text);

    if (mounted) {
      setState(() {
        _messages.add(botReply);
        _isTyping = false;
      });
      _scrollToBottom();
    }
  }

  Widget _buildRichText(String text, TextStyle baseStyle, TextStyle boldStyle) {
    List<InlineSpan> spans = [];
    final RegExp regex = RegExp(r'\*\*(.*?)\*\*');
    int lastMatchEnd = 0;

    for (final Match match in regex.allMatches(text)) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(
          text: text.substring(lastMatchEnd, match.start),
          style: baseStyle,
        ));
      }
      spans.add(TextSpan(
        text: match.group(1),
        style: boldStyle,
      ));
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastMatchEnd),
        style: baseStyle,
      ));
    }

    return RichText(
      text: TextSpan(children: spans),
    );
  }

  Widget _buildAiHeader(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 10,
        16,
        16,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF2E1065),
            const Color(0xFF1E0A45).withOpacity(0.9),
            isDark ? AppColors.darkBackground : AppColors.background,
          ],
          stops: const [0.0, 0.7, 1.0],
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Row(
            children: [
              Builder(
                builder: (ctx) => IconButton(
                  icon: const Icon(Icons.menu_rounded, color: Colors.white, size: 24),
                  onPressed: () => Scaffold.of(ctx).openDrawer(),
                ),
              ),
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 48),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          "AI Assistant",
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                        if (!_isPro && _isAiAccessible) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.5), width: 0.8),
                            ),
                            child: const Text(
                              'TRIAL: 1D LEFT',
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFF59E0B),
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            left: 55,
            bottom: -5,
            child: Image.asset(
              'assets/mascot no background -s.png',
              height: 55,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _loadAiPremiumStatus() async {
    final pro = await _premiumService.isPro();
    final accessible = await _premiumService.isAiAssistantAccessible();
    if (mounted) {
      setState(() {
        _isPro = pro;
        _isAiAccessible = accessible;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: null,
      body: Column(
        children: [
          _buildAiHeader(isDark),
          Expanded(
            child: !_isAiAccessible
                ? _buildLockedAiView(isDark)
                : Column(
                    children: [
                      if (!_isPro)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                          color: AppColors.warning.withOpacity(0.12),
                          child: const Text(
                            "⚡ FREE TRIAL: 1-Day AI Assistant Access Active",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.warning,
                            ),
                          ),
                        ),
                      const SizedBox(height: 8),
                      _buildSuggestionsRow(isDark),
                      Expanded(child: _buildMessageList(isDark)),
                      if (_isTyping) _buildTypingIndicator(isDark),
                      _buildInputBar(isDark),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedAiView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0D0E15) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: const Color(0xFFF59E0B).withOpacity(0.4),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.4 : 0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.lock_outline_rounded,
                  size: 40,
                  color: Color(0xFFF59E0B),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Unlock MoneyMapper AI Assistant 🚀',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Your 1-day AI Assistant trial has ended. Upgrade to MoneyMapper Pro for 24/7 unlimited access to AI financial advisory, Stock, Mutual Fund, Insurance, and IPO Score Card insights!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  height: 1.4,
                  color: isDark ? Colors.white70 : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () {
                    Navigator.pushNamed(context, '/subscription');
                  },
                  child: const Text(
                    'UPGRADE TO PRO',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuggestionsRow(bool isDark) {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: _suggestions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (ctx, idx) {
          final item = _suggestions[idx];
          return ActionChip(
            backgroundColor: isDark ? AppColors.darkCard : Colors.white,
            side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            labelPadding: const EdgeInsets.symmetric(horizontal: 4),
            label: Text(
              item['label']!,
              style: TextStyle(
                color: isDark ? Colors.white70 : AppColors.textPrimaryLight,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            onPressed: () => _handleSendMessage(item['query']!),
          );
        },
      ),
    );
  }

  Widget _buildMessageList(bool isDark) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      itemCount: _messages.length,
      itemBuilder: (ctx, idx) {
        final msg = _messages[idx];
        final isUser = msg.sender == 'user';

        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    child: Image.asset('assets/mascot no background -s.png', width: 18, height: 18),
                  ),
              Container(
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isUser ? AppColors.primary : (isDark ? AppColors.darkCard : Colors.white),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(20),
                    topRight: const Radius.circular(20),
                    bottomLeft: Radius.circular(isUser ? 20 : 4),
                    bottomRight: Radius.circular(isUser ? 4 : 20),
                  ),
                  border: isUser ? null : Border.all(color: isDark ? AppColors.darkBorder : AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRichText(
                      msg.text,
                      TextStyle(color: isUser ? Colors.white : (isDark ? Colors.white : Colors.black87), fontSize: 14, height: 1.5),
                      TextStyle(color: isUser ? Colors.white : (isDark ? Colors.white : Colors.black87), fontSize: 14, fontWeight: FontWeight.bold, height: 1.5),
                    ),
                    if (msg.quickActions.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: msg.quickActions.map((action) {
                            return ActionChip(
                              backgroundColor: isUser ? Colors.white.withOpacity(0.2) : AppColors.primary.withOpacity(0.05),
                              side: BorderSide.none,
                              label: Text(
                                action.label,
                                style: TextStyle(color: isUser ? Colors.white : AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              onPressed: () {
                                if (action.route.startsWith('/')) {
                                  _navigateTo(action.route);
                                } else {
                                  _handleSendMessage(action.route);
                                }
                              },
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 4, right: 4),
                child: Text(
                  msg.timestamp,
                  style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 10,
            backgroundColor: AppColors.primary.withOpacity(0.1),
            child: Image.asset('assets/mascot no background -s.png', width: 15, height: 15),
          ),
          const SizedBox(width: 8),
          const Text(
            "AI is thinking...",
            style: TextStyle(color: Colors.grey, fontSize: 11, fontStyle: FontStyle.italic),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        border: Border(top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.borderLight)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(28),
              ),
              child: TextField(
                controller: _textController,
                style: TextStyle(fontSize: 14),
                decoration: const InputDecoration(
                  hintText: "Ask me anything about finance...",
                  border: InputBorder.none,
                ),
                onSubmitted: _handleSendMessage,
              ),
            ),
          ),
          const SizedBox(width: 12),
          FloatingActionButton.small(
            onPressed: () => _handleSendMessage(_textController.text),
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
          ),
        ],
      ),
    );
  }
}
