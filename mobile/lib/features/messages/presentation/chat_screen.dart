import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/user_avatar.dart';
import '../cubit/chat_cubit.dart';
import '../data/message_model.dart';
import '../data/messages_repository.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key, required this.conversationId, required this.other});

  final String conversationId;
  final ChatOtherUser other;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ChatCubit(MessagesRepository(), conversationId)..load(),
      child: _ChatView(other: other),
    );
  }
}

class _ChatView extends StatefulWidget {
  const _ChatView({required this.other});
  final ChatOtherUser other;

  @override
  State<_ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<_ChatView> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  Future<void> _send() async {
    final text = _controller.text;
    if (text.trim().isEmpty) return;
    _controller.clear();
    await context.read<ChatCubit>().send(text);
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: Column(
            children: [
              _ChatHeader(other: widget.other),
              Expanded(
                child: BlocConsumer<ChatCubit, ChatState>(
                  listenWhen: (p, c) => c.messages.length != p.messages.length,
                  listener: (context, state) =>
                      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom()),
                  builder: (context, state) {
                    if (state.status == ChatStatus.loading && state.messages.isEmpty) {
                      return const Center(child: CircularProgressIndicator(color: AppColors.indigo));
                    }
                    if (state.status == ChatStatus.failure && state.messages.isEmpty) {
                      return Center(
                        child: Text(state.error ?? 'Xatolik', style: const TextStyle(color: AppColors.textMuted)),
                      );
                    }
                    if (state.messages.isEmpty) {
                      return const Center(
                        child: Text('Xabar yozing — suhbat shu yerdan boshlanadi',
                            style: TextStyle(color: AppColors.textMuted)),
                      );
                    }
                    return ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                      itemCount: state.messages.length,
                      itemBuilder: (context, i) => _MessageBubble(message: state.messages[i]),
                    );
                  },
                ),
              ),
              _Composer(controller: _controller, onSend: _send),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatHeader extends StatelessWidget {
  const _ChatHeader({required this.other});
  final ChatOtherUser other;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 6, 16, 10),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          ),
          UserAvatar(imageUrl: other.image, initial: _initial(other.name), size: 36),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(other.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                if (other.isSupport)
                  const Text('Qo\'llab-quvvatlash', style: TextStyle(color: AppColors.emerald, fontSize: 11.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});
  final ChatMessageModel message;

  @override
  Widget build(BuildContext context) {
    if (message.system) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(99),
            ),
            child: Text(message.body,
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
          ),
        ),
      );
    }
    final mine = message.mine;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 3),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.74),
        decoration: BoxDecoration(
          color: mine ? AppColors.indigo : Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(mine ? 16 : 4),
            bottomRight: Radius.circular(mine ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message.deleted ? "o'chirilgan xabar" : message.body,
              style: TextStyle(
                color: message.deleted ? Colors.white54 : Colors.white,
                fontStyle: message.deleted ? FontStyle.italic : FontStyle.normal,
                fontSize: 14,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              _time(message.createdAtDate),
              style: TextStyle(color: Colors.white.withValues(alpha: 0.55), fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }

  String _time(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.onSend});
  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 5,
                textCapitalization: TextCapitalization.sentences,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: const InputDecoration(
                  isDense: true,
                  border: InputBorder.none,
                  hintText: 'Xabar yozing...',
                  hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 14),
                ),
                onSubmitted: (_) => onSend(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: AppColors.indigo,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onSend,
              child: const Padding(
                padding: EdgeInsets.all(11),
                child: Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
