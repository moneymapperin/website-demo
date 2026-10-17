import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'chat_intent_service.dart';
import 'chat_message.dart';
import '../main.dart';
import '../theme/app_theme.dart';

class FloatingChatbot extends StatefulWidget {
  const FloatingChatbot({super.key});

  @override
  State<FloatingChatbot> createState() => _FloatingChatbotState();
}

class _FloatingChatbotState extends State<FloatingChatbot>
    with SingleTickerProviderStateMixin {
  final ChatIntentService _chatService = ChatIntentService();
  final List<ChatMessage> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late AnimationController _animController;
  late Animation<double> _floatAnimation;
  late Animation<double> _pulseAnimation;
  StreamSubscription<AuthState>? _authSubscription;

  bool _isOpen = false;
  bool _isMinimized = false;
  bool _isTyping = false;
  bool _isDragging = false;

  Offset? _position;
  Offset? _windowPosition;

  final List<Map<String, String>> _suggestions = [
    {'label': '📊 Financial Score', 'query': 'Financial Score'},
    {'label': '🚨 Emergency Fund', 'query': 'Emergency Fund'},
    {'label': '📈 Mutual Funds', 'query': 'Mutual Funds'},
    {'label': '👤 Edit Profile', 'query': 'Edit Profile'},
    {'label': '📅 Weekly Expenses', 'query': 'Weekly Expenses'},
    {'label': '🏆 My Badges', 'query': 'My Badges'},
  ];

  @override
  void initState() {
    super.initState();

    // Listen for auth state changes so chatbot is only visible when user is logged in
    _authSubscription = Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (mounted) setState(() {});
    });

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);

    _floatAnimation = Tween<double>(begin: -6.0, end: 6.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    _messages.add(
      ChatMessage(
        id: 'welcome',
        sender: 'bot',
        text:
            "Hi! I'm your Assistant. You can ask me questions about your financial pillars, mutual funds, or ask me to redirect you anywhere in the app!",
        redirectTo: null,
        redirectLabel: null,
        quickActions: const [
          QuickAction(label: "Emergency Fund", route: "/emergency_fund_p"),
          QuickAction(label: "Mutual Funds", route: "/mutual_fund_p"),
          QuickAction(label: "Edit Profile", route: "/profile"),
        ],
        timestamp: DateFormat('hh:mm a').format(DateTime.now()),
      ),
    );
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _textController.dispose();
    _scrollController.dispose();
    _animController.dispose();
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
    setState(() {
      _isOpen = false;
    });
    try {
      if (navigatorKey.currentState != null) {
        navigatorKey.currentState!.pushNamed(route);
      } else {
        Navigator.of(context).pushNamed(route);
      }
    } catch (_) {
      // Fallback navigation
    }
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

  @override
  Widget build(BuildContext context) {
    // Hide chatbot on login / onboarding / pre-auth screens
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return const SizedBox.shrink();
    }

    final screenSize = MediaQuery.of(context).size;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final defaultLauncherX = 20.0;
    final defaultLauncherY = MediaQuery.of(context).padding.top + 60.0;

    if (!_isOpen) {
      return _buildLauncher(defaultLauncherX, defaultLauncherY, screenSize, bottomInset, isDark);
    }

    return _buildChatWindow(screenSize, bottomInset, isDark);
  }

  Widget _buildLauncher(
      double defaultX, double defaultY, Size screenSize, double bottomInset, bool isDark) {
    final x = (_position?.dx ?? defaultX)
        .clamp(16.0, max(16.0, screenSize.width - 92.0))
        .toDouble();
    final y = (_position?.dy ?? defaultY)
        .clamp(16.0, max(16.0, screenSize.height - bottomInset - 110.0))
        .toDouble();

    return Positioned(
      left: x,
      top: y,
      child: GestureDetector(
        onPanUpdate: (details) {
          _isDragging = true;
          setState(() {
            final curDx = _position?.dx ?? defaultX;
            final curDy = _position?.dy ?? defaultY;
            _position = Offset(
              (curDx + details.delta.dx)
                  .clamp(16.0, max(16.0, screenSize.width - 92.0)),
              (curDy + details.delta.dy)
                  .clamp(16.0, max(16.0, screenSize.height - bottomInset - 110.0)),
            );
          });
        },
        onPanEnd: (_) {
          Future.delayed(const Duration(milliseconds: 100), () {
            _isDragging = false;
          });
        },
        onTap: () {
          if (!_isDragging) {
            setState(() {
              _isOpen = true;
            });
          }
        },
        child: AnimatedBuilder(
          animation: _animController,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(0, _floatAnimation.value),
              child: Transform.scale(
                scale: _pulseAnimation.value,
                child: child,
              ),
            );
          },
          child: SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                // Pure Mascot Avatar Image (Transparent PNG)
                ClipRRect(
                  borderRadius: BorderRadius.circular(1), // Prevents edge bleed artifact
                  child: Image.asset(
                    'assets/mascot no background -s.png',
                    width: 75,
                    height: 75,
                    fit: BoxFit.contain,
                    errorBuilder: (ctx, err, stack) => const Center(
                      child: Icon(Icons.smart_toy_rounded,
                          color: Color(0xFF6366F1), size: 48),
                    ),
                  ),
                ),
                // Green Online Indicator Dot
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? const Color(0xFF0F172A) : Colors.white,
                        width: 2,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x8022C55E),
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: const SizedBox(width: 14, height: 14),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChatWindow(Size screenSize, double bottomInset, bool isDark) {
    final windowWidth = min(380.0, screenSize.width - 32.0);

    // Keyboard-aware window height adjustment so keyboard does not occlude chat input
    final maxAvailableHeight = max(180.0, screenSize.height - bottomInset - 80.0);
    final windowHeight = _isMinimized ? null : min(520.0, maxAvailableHeight);

    final defaultX = screenSize.width - windowWidth - 16.0;
    final defaultY = screenSize.height - bottomInset - (_isMinimized ? 70.0 : (windowHeight ?? 70.0)) - 16.0;

    final x = (_windowPosition?.dx ?? defaultX)
        .clamp(8.0, max(8.0, screenSize.width - windowWidth - 8.0))
        .toDouble();
    final y = (_windowPosition?.dy ?? defaultY)
        .clamp(8.0, max(8.0, screenSize.height - bottomInset - 70.0))
        .toDouble();

    return Positioned(
      left: x,
      top: y,
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: windowWidth,
          height: windowHeight,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: isDark ? const Color(0x80000000) : const Color(0x1A000000),
                blurRadius: 24,
                spreadRadius: 4,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHeader(defaultX, defaultY, screenSize, bottomInset, windowWidth, isDark),
              if (!_isMinimized) ...[
                _buildSuggestionsRow(isDark),
                Expanded(child: _buildMessageList(isDark)),
                if (_isTyping) _buildTypingIndicator(isDark),
                _buildInputBar(isDark),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(
      double defaultX, double defaultY, Size screenSize, double bottomInset, double wWidth, bool isDark) {
    return GestureDetector(
      onPanUpdate: (details) {
        setState(() {
          final curDx = _windowPosition?.dx ?? defaultX;
          final curDy = _windowPosition?.dy ?? defaultY;
          final wHeight = _isMinimized ? 70.0 : min(520.0, screenSize.height - bottomInset - 80.0);
          _windowPosition = Offset(
            (curDx + details.delta.dx)
                .clamp(8.0, max(8.0, screenSize.width - wWidth - 8.0))
                .toDouble(),
            (curDy + details.delta.dy)
                .clamp(8.0, max(8.0, screenSize.height - bottomInset - wHeight - 8.0))
                .toDouble(),
          );
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF020617) : const Color(0xFFF1F5F9),
          borderRadius: _isMinimized
              ? BorderRadius.circular(18)
              : const BorderRadius.vertical(top: Radius.circular(18)),
          border: Border(
            bottom: _isMinimized
                ? BorderSide.none
                : BorderSide(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                  ),
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: isDark ? const Color(0xFF312E81) : const Color(0xFFE0E7FF),
              child: ClipOval(
                child: Image.asset(
                  'assets/mascot no background -s.png',
                  width: 28,
                  height: 28,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Icon(
                    Icons.smart_toy,
                    size: 18,
                    color: isDark ? Colors.white : const Color(0xFF4F46E5),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Text(
                        "Assistant",
                        style: TextStyle(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4F46E5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          "PRO",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    "Financial Fitness Assistant",
                    style: TextStyle(
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              icon: Icon(
                Icons.push_pin_outlined,
                size: 18,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
              onPressed: () {
                setState(() {
                  _position = null;
                  _windowPosition = null;
                });
              },
            ),
            IconButton(
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              icon: Icon(
                _isMinimized
                    ? Icons.keyboard_arrow_up_rounded
                    : Icons.keyboard_arrow_down_rounded,
                size: 20,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
              onPressed: () {
                setState(() {
                  _isMinimized = !_isMinimized;
                });
              },
            ),
            IconButton(
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              icon: Icon(
                Icons.close_rounded,
                size: 18,
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
              onPressed: () {
                setState(() {
                  _isOpen = false;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionsRow(bool isDark) {
    return Container(
      height: 38,
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        scrollDirection: Axis.horizontal,
        itemCount: _suggestions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (ctx, idx) {
          final item = _suggestions[idx];
          return ActionChip(
            backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
            side: BorderSide(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
            ),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            labelPadding: const EdgeInsets.symmetric(horizontal: 4),
            label: Text(
              item['label']!,
              style: TextStyle(
                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                fontSize: 11,
                fontWeight: FontWeight.w600,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: _messages.length,
      itemBuilder: (ctx, idx) {
        final msg = _messages[idx];
        final isUser = msg.sender == 'user';

        final botBubbleColor = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
        final botTextColor = isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment:
                isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (!isUser)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 4),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 8,
                        backgroundColor: isDark ? const Color(0xFF312E81) : const Color(0xFFE0E7FF),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/mascot no background -s.png',
                            width: 12,
                            height: 12,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Icon(
                              Icons.smart_toy,
                              size: 10,
                              color: isDark ? Colors.white : const Color(0xFF4F46E5),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "Assistant",
                        style: TextStyle(
                          color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              Container(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.7,
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isUser ? const Color(0xFF4F46E5) : botBubbleColor,
                  borderRadius: isUser
                      ? const BorderRadius.only(
                          topLeft: Radius.circular(16),
                          topRight: Radius.circular(16),
                          bottomLeft: Radius.circular(16),
                          bottomRight: Radius.circular(4),
                        )
                      : const BorderRadius.only(
                          topLeft: Radius.circular(16),
                          topRight: Radius.circular(16),
                          bottomLeft: Radius.circular(4),
                          bottomRight: Radius.circular(16),
                        ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRichText(
                      msg.text,
                      TextStyle(
                        color: isUser ? Colors.white : botTextColor,
                        fontSize: 13,
                        height: 1.4,
                      ),
                      TextStyle(
                        color: isUser ? Colors.white : botTextColor,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                    ),
                    if (msg.redirectTo != null && msg.redirectLabel != null)
                      Container(
                        margin: const EdgeInsets.only(top: 10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => _navigateTo(msg.redirectTo!),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    msg.redirectLabel!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.arrow_forward_rounded,
                                      size: 13, color: Colors.white),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (msg.quickActions.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: msg.quickActions.map((action) {
                            return ActionChip(
                              backgroundColor: isDark
                                  ? const Color(0xFF334155)
                                  : const Color(0xFFE2E8F0),
                              side: BorderSide.none,
                              padding: EdgeInsets.zero,
                              labelPadding:
                                  const EdgeInsets.symmetric(horizontal: 6),
                              label: Text(
                                action.label,
                                style: TextStyle(
                                  color: isDark
                                      ? const Color(0xFFE2E8F0)
                                      : const Color(0xFF1E293B),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              onPressed: () => _navigateTo(action.route),
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
                child: Text(
                  msg.timestamp,
                  style: TextStyle(
                    color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                    fontSize: 9,
                  ),
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
      padding: const EdgeInsets.only(left: 14, bottom: 8, top: 4),
      child: Row(
        children: [
          CircleAvatar(
            radius: 10,
            backgroundColor: isDark ? const Color(0xFF312E81) : const Color(0xFFE0E7FF),
            child: ClipOval(
              child: Image.asset(
                'assets/mascot no background -s.png',
                width: 14,
                height: 14,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Icon(
                  Icons.smart_toy,
                  size: 12,
                  color: isDark ? Colors.white : const Color(0xFF4F46E5),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            "Assistant is typing...",
            style: TextStyle(
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              fontSize: 11,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar(bool isDark) {
    final isTextNotEmpty = _textController.text.trim().isNotEmpty;
    final isSendDisabled = !isTextNotEmpty || _isTyping;

    final inputBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
    final inputBorderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF020617) : const Color(0xFFFFFFFF),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.only(left: 12, right: 4, top: 4, bottom: 4),
        decoration: BoxDecoration(
          color: inputBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: inputBorderColor, width: 1),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _textController,
                style: TextStyle(
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                  fontSize: 13,
                ),
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _handleSendMessage(_textController.text),
                decoration: InputDecoration(
                  hintText: "Ask financial questions...",
                  hintStyle: TextStyle(
                    color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                    fontSize: 13,
                  ),
                  filled: false,
                  fillColor: Colors.transparent,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 6),
                ),
              ),
            ),
            if (isTextNotEmpty)
              GestureDetector(
                onTap: () {
                  _textController.value = TextEditingValue.empty;
                  setState(() {});
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    Icons.cancel_rounded,
                    size: 16,
                    color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                  ),
                ),
              ),
            const SizedBox(width: 4),
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: isSendDisabled
                    ? null
                    : () => _handleSendMessage(_textController.text),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isTextNotEmpty
                        ? AppColors.primary
                        : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.send_rounded,
                    color: isTextNotEmpty
                        ? Colors.white
                        : (isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                    size: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
