import 'dart:async';
import 'dart:ui';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/confirm_dialog.dart';
import '../../../widgets/skeleton.dart';
import '../../../widgets/user_avatar.dart';
import '../../dashboard/data/order_model.dart';
import '../../order_detail/presentation/order_detail_screen.dart';
import '../../public_profile/presentation/public_profile_screen.dart';
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
      child: _ChatView(initialOther: other),
    );
  }
}

class _ChatView extends StatefulWidget {
  const _ChatView({required this.initialOther});
  final ChatOtherUser initialOther;

  @override
  State<_ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<_ChatView> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _sendingFile = false;
  int _contractIndex = 0;
  Timer? _contractTimer;

  @override
  void initState() {
    super.initState();
    _contractTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      final n = context.read<ChatCubit>().state.activeContracts.length;
      if (n > 1 && mounted) setState(() => _contractIndex = (_contractIndex + 1) % n);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _contractTimer?.cancel();
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

  Future<void> _pickAndSendFile() async {
    final cubit = context.read<ChatCubit>();
    final result = await FilePicker.platform.pickFiles(withData: true);
    final file = result?.files.single;
    if (file == null || file.bytes == null) return;
    setState(() => _sendingFile = true);
    try {
      final ext = (file.extension ?? '').toLowerCase();
      final contentType = switch (ext) {
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'jpg' || 'jpeg' => 'image/jpeg',
        'pdf' => 'application/pdf',
        'zip' => 'application/zip',
        _ => 'application/octet-stream',
      };
      await cubit.sendFile(bytes: file.bytes!, filename: file.name, contentType: contentType);
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } finally {
      if (mounted) setState(() => _sendingFile = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: BlocConsumer<ChatCubit, ChatState>(
            listenWhen: (p, c) => c.messages.length != p.messages.length,
            listener: (context, state) => WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom()),
            builder: (context, state) {
              final other = state.other ?? widget.initialOther;
              return Column(
                children: [
                  _ChatHeader(other: other, blockedByMe: state.blockedByMe),
                  if (state.activeContracts.isNotEmpty)
                    _PinnedContractCard(
                      order: state.activeContracts[_contractIndex % state.activeContracts.length],
                      total: state.activeContracts.length,
                      index: _contractIndex % state.activeContracts.length,
                      onCycle: () => setState(
                        () => _contractIndex = (_contractIndex + 1) % state.activeContracts.length,
                      ),
                    ),
                  Expanded(
                    child: Builder(builder: (context) {
                      if (state.status == ChatStatus.loading && state.messages.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                          child: Column(
                            children: const [
                              SBubble(widthFraction: 0.4),
                              SizedBox(height: 10),
                              SBubble(widthFraction: 0.5, mine: true),
                              SizedBox(height: 10),
                              SBubble(widthFraction: 0.6),
                              SizedBox(height: 10),
                              SBubble(widthFraction: 0.4, mine: true),
                              SizedBox(height: 10),
                              SBubble(widthFraction: 0.35),
                            ],
                          ),
                        );
                      }
                      if (state.status == ChatStatus.failure && state.messages.isEmpty) {
                        return Center(
                          child: Text(state.error ?? 'Xatolik', style: const TextStyle(color: AppColors.textMuted)),
                        );
                      }
                      if (state.blockedMe && !other.isSupport) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'Bu foydalanuvchi sizni bloklagan — xabar yoza olmaysiz.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppColors.textMuted),
                            ),
                          ),
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
                        itemBuilder: (context, i) => _MessageBubble(
                          message: state.messages[i],
                          hasActiveContract: state.activeContracts.isNotEmpty,
                          pinnedOrderId: state.activeContracts.isNotEmpty ? state.activeContracts.first.id : null,
                        ),
                      );
                    }),
                  ),
                  if (state.replyTo != null) _ReplyBanner(message: state.replyTo!),
                  if (!state.blockedMe && !state.blockedByMe)
                    _Composer(
                      controller: _controller,
                      onSend: _send,
                      onAttach: _sendingFile ? null : _pickAndSendFile,
                      busy: _sendingFile,
                    )
                  else if (state.blockedByMe)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: OutlinedButton(
                        onPressed: () => context.read<ChatCubit>().toggleBlock(),
                        child: const Text('Blokdan chiqarish'),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _ChatHeader extends StatelessWidget {
  const _ChatHeader({required this.other, required this.blockedByMe});
  final ChatOtherUser other;
  final bool blockedByMe;

  String _presence(DateTime? lastSeenAt) {
    if (lastSeenAt == null) return 'oflayn';
    final diff = DateTime.now().difference(lastSeenAt);
    if (diff.inMinutes < 2) return 'onlayn';
    if (diff.inMinutes < 60) return '${diff.inMinutes} daq oldin onlayn';
    if (diff.inHours < 24) return '${diff.inHours} soat oldin onlayn';
    return '${diff.inDays} kun oldin onlayn';
  }

  @override
  Widget build(BuildContext context) {
    final online = other.lastSeenAt != null && DateTime.now().difference(other.lastSeenAt!).inMinutes < 2;
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 6, 10, 10),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          ),
          GestureDetector(
            onTap: other.isSupport
                ? null
                : () => Navigator.of(context)
                    .push(MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: other.id))),
            child: Row(
              children: [
                UserAvatar(imageUrl: other.image, initial: _initial(other.name), size: 36),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(other.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                      if (other.isSupport)
                        const Text("Qo'llab-quvvatlash", style: TextStyle(color: AppColors.emerald, fontSize: 11.5))
                      else
                        Text(_presence(other.lastSeenAt),
                            style: TextStyle(
                                color: online ? AppColors.emerald : AppColors.textMuted, fontSize: 11.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (!other.isSupport)
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert_rounded, color: AppColors.textSecondary),
              color: AppColors.surface,
              onSelected: (value) => _onMenuSelect(context, value),
              itemBuilder: (context) => [
                PopupMenuItem(value: 'report', child: Text('Shikoyat qilish', style: TextStyle(color: AppColors.textPrimary))),
                PopupMenuItem(
                  value: 'block',
                  child: Text(blockedByMe ? 'Blokdan chiqarish' : 'Bloklash',
                      style: TextStyle(color: AppColors.textPrimary)),
                ),
                const PopupMenuItem(value: 'delete', child: Text("Suhbatni o'chirish", style: TextStyle(color: AppColors.red))),
              ],
            ),
        ],
      ),
    );
  }

  Future<void> _onMenuSelect(BuildContext context, String value) async {
    final cubit = context.read<ChatCubit>();
    switch (value) {
      case 'report':
        await _showReportDialog(context);
        break;
      case 'block':
        await cubit.toggleBlock();
        break;
      case 'delete':
        final ok = await confirmDialog(
          context,
          title: "Suhbat o'chirilsinmi?",
          message: 'Suhbat ikkala tomondan ham o\'chiriladi.',
          confirmLabel: "Ha, o'chirish",
        );
        if (ok == true && context.mounted) {
          final done = await cubit.deleteConversation();
          if (done && context.mounted) Navigator.of(context).pop();
        }
        break;
    }
  }
}

Future<void> _showReportDialog(BuildContext context, {String? messageId}) async {
  final cubit = context.read<ChatCubit>();
  final text = TextEditingController();
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.cardBorder)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Shikoyat qilish', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('Nima sodir bo\'lganini yozing (kamida 10 belgi).',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
            const SizedBox(height: 14),
            AppTextField(label: 'Shikoyat matni', controller: text, maxLines: 4),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (text.text.trim().length < 10) return;
                  Navigator.of(sheetContext).pop();
                  final ok = await cubit.report(text.text.trim(), messageId: messageId);
                  if (ok && sheetContext.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Shikoyat yuborildi')),
                    );
                  }
                },
                child: const Text('Yuborish'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}

class _PinnedContractCard extends StatelessWidget {
  const _PinnedContractCard({required this.order, required this.total, required this.index, required this.onCycle});
  final ChatContractOrderRef order;
  final int total;
  final int index;
  final VoidCallback onCycle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
      child: GestureDetector(
        onTap: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id))),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                color: AppColors.indigo.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.indigo.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.push_pin_rounded, size: 16, color: AppColors.indigo),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(order.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
                        Text(
                          '${kOrderTypeLabel[order.type] ?? order.type} · ${kOrderStatusLabel[order.status] ?? order.status}'
                          '${total > 1 ? " · ${index + 1}/$total" : ""}',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  if (total > 1)
                    IconButton(
                      onPressed: onCycle,
                      icon: const Icon(Icons.swap_horiz_rounded, size: 18, color: AppColors.textMuted),
                    ),
                  Icon(Icons.chevron_right_rounded, color: AppColors.textFaint, size: 18),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ReplyBanner extends StatelessWidget {
  const _ReplyBanner({required this.message});
  final ChatMessageModel message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.tint(0.05),
        borderRadius: BorderRadius.circular(12),
        border: const Border(left: BorderSide(color: AppColors.indigo, width: 3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Javob berilmoqda', style: TextStyle(color: AppColors.indigo, fontSize: 11, fontWeight: FontWeight.w700)),
                Text(
                  message.deleted ? "o'chirilgan xabar" : (message.body.isNotEmpty ? message.body : (message.file?.name ?? 'xabar')),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.read<ChatCubit>().setReplyTo(null),
            icon: Icon(Icons.close_rounded, size: 18, color: AppColors.textFaint),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.hasActiveContract, this.pinnedOrderId});
  final ChatMessageModel message;
  final bool hasActiveContract;
  final String? pinnedOrderId;

  void _openMenu(BuildContext context) {
    if (message.deleted) return;
    final cubit = context.read<ChatCubit>();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.cardBorder)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _ReactionButton(
                    icon: Icons.thumb_up_alt_rounded,
                    active: message.reactions.mine == 'LIKE',
                    onTap: () {
                      Navigator.of(sheetContext).pop();
                      cubit.react(message.id, message.reactions.mine == 'LIKE' ? null : 'LIKE');
                    },
                  ),
                  const SizedBox(width: 28),
                  _ReactionButton(
                    icon: Icons.thumb_down_alt_rounded,
                    active: message.reactions.mine == 'DISLIKE',
                    onTap: () {
                      Navigator.of(sheetContext).pop();
                      cubit.react(message.id, message.reactions.mine == 'DISLIKE' ? null : 'DISLIKE');
                    },
                  ),
                ],
              ),
            ),
            Divider(color: AppColors.cardBorder, height: 1),
            ListTile(
              leading: Icon(Icons.reply_rounded, color: AppColors.textSecondary),
              title: Text('Javob berish', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.of(sheetContext).pop();
                cubit.setReplyTo(message);
              },
            ),
            if (message.mine) ...[
              ListTile(
                leading: Icon(Icons.edit_outlined, color: AppColors.textSecondary),
                title: Text('Tahrirlash', style: TextStyle(color: AppColors.textPrimary)),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  _showEditSheet(context, cubit, message);
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline_rounded, color: AppColors.red),
                title: const Text("O'chirish", style: TextStyle(color: AppColors.red)),
                onTap: () async {
                  Navigator.of(sheetContext).pop();
                  final ok = await confirmDialog(context,
                      title: "O'chirilsinmi?",
                      message: "Xabar ikkala tomondan ham o'chiriladi.",
                      confirmLabel: "Ha, o'chirish");
                  if (ok == true) cubit.deleteMessage(message.id);
                },
              ),
            ] else
              ListTile(
                leading: const Icon(Icons.flag_outlined, color: AppColors.red),
                title: const Text('Shikoyat qilish', style: TextStyle(color: AppColors.red)),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  _showReportDialog(context, messageId: message.id);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showEditSheet(BuildContext context, ChatCubit cubit, ChatMessageModel message) {
    final controller = TextEditingController(text: message.body);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: AppColors.cardBorder)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Xabarni tahrirlash', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 14),
              AppTextField(label: 'Xabar', controller: controller, maxLines: 4),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final text = controller.text.trim();
                    if (text.isEmpty) return;
                    Navigator.of(sheetContext).pop();
                    cubit.editMessage(message.id, text);
                  },
                  child: const Text('Saqlash'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mine = message.mine;
    // "Mening" pufakcham har doim indigo fon + oq matn (rejimdan qat'i
    // nazar). Boshqasiniki esa sahifa foniga mos xira qatlam — shuning
    // uchun matn rangi rejimga qarab moslashishi kerak.
    final bubbleTextColor = mine ? Colors.white : AppColors.textPrimary;

    if (message.system) {
      return Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
          decoration: BoxDecoration(
            color: mine ? AppColors.indigo.withValues(alpha: 0.85) : AppColors.tint(0.06),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message.body, style: TextStyle(color: bubbleTextColor, fontSize: 13.5, height: 1.4)),
              if (hasActiveContract && pinnedOrderId != null) ...[
                const SizedBox(height: 8),
                Divider(color: mine ? Colors.white24 : AppColors.cardBorder, height: 1),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: pinnedOrderId!))),
                  child: Text('Buyurtmani ko\'rish ›',
                      style: TextStyle(color: bubbleTextColor, fontSize: 12.5, fontWeight: FontWeight.w700)),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: () => _openMenu(context),
      child: Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: Column(
          crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 3),
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.74),
              decoration: BoxDecoration(
                color: mine ? AppColors.indigo : AppColors.tint(0.06),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(mine ? 16 : 4),
                  bottomRight: Radius.circular(mine ? 4 : 16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (message.replyTo != null) _ReplyQuote(reply: message.replyTo!),
                  if (message.file != null) _FileAttachment(file: message.file!),
                  if (!message.deleted && message.body.isNotEmpty) ...[
                    if (message.file != null) const SizedBox(height: 6),
                    Text(message.body, style: TextStyle(color: bubbleTextColor, fontSize: 14, height: 1.35)),
                  ],
                  if (message.deleted)
                    Text("o'chirilgan xabar",
                        style: TextStyle(color: bubbleTextColor.withValues(alpha: 0.6), fontStyle: FontStyle.italic, fontSize: 14)),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (message.edited && !message.deleted) ...[
                        Text('tahrirlangan · ',
                            style: TextStyle(color: bubbleTextColor.withValues(alpha: 0.55), fontSize: 9.5)),
                      ],
                      Text(_time(message.createdAtDate),
                          style: TextStyle(color: bubbleTextColor.withValues(alpha: 0.65), fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),
            if (message.reactions.like > 0 || message.reactions.dislike > 0)
              Padding(
                padding: const EdgeInsets.only(top: 2, bottom: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (message.reactions.like > 0) _ReactionCountPill(icon: '👍', count: message.reactions.like),
                    if (message.reactions.like > 0 && message.reactions.dislike > 0) const SizedBox(width: 6),
                    if (message.reactions.dislike > 0) _ReactionCountPill(icon: '👎', count: message.reactions.dislike),
                  ],
                ),
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

class _ReplyQuote extends StatelessWidget {
  const _ReplyQuote({required this.reply});
  final ReplyPreviewModel reply;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(8),
        border: const Border(left: BorderSide(color: Colors.white38, width: 2)),
      ),
      child: Text(
        reply.deleted ? "o'chirilgan xabar" : reply.text,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: Colors.white70, fontSize: 12),
      ),
    );
  }
}

class _FileAttachment extends StatelessWidget {
  const _FileAttachment({required this.file});
  final ChatFileModel file;

  @override
  Widget build(BuildContext context) {
    if (file.isImage) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: GestureDetector(
          onTap: () => launchUrl(Uri.parse(file.url), mode: LaunchMode.externalApplication),
          child: Image.network(file.url, fit: BoxFit.cover, height: 160, width: double.infinity,
              errorBuilder: (_, __, ___) => const SizedBox.shrink()),
        ),
      );
    }
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse(file.url), mode: LaunchMode.externalApplication),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          // Rangi qanday bo'lishidan qat'i nazar o'qiladigan bo'lishi uchun
          // yorug' rejimda qattiqroq qora parda ishlatiladi.
          color: Colors.black.withValues(alpha: AppColors.isLight ? 0.55 : 0.18),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.insert_drive_file_rounded, size: 20, color: Colors.white70),
            const SizedBox(width: 8),
            Flexible(
              child: Text(file.name,
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12.5)),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReactionButton extends StatelessWidget {
  const _ReactionButton({required this.icon, required this.active, required this.onTap});
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: active ? AppColors.indigo.withValues(alpha: 0.2) : AppColors.tint(0.05),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 22, color: active ? AppColors.indigo : AppColors.textSecondary),
      ),
    );
  }
}

class _ReactionCountPill extends StatelessWidget {
  const _ReactionCountPill({required this.icon, required this.count});
  final String icon;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.tint(0.06),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Text('$icon $count', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.onSend, required this.onAttach, required this.busy});
  final TextEditingController controller;
  final VoidCallback onSend;
  final VoidCallback? onAttach;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.tint(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: busy
                    ? const Padding(
                        padding: EdgeInsets.all(11),
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.textMuted),
                      )
                    : IconButton(
                        onPressed: onAttach,
                        icon: Icon(Icons.attach_file_rounded, size: 20, color: AppColors.textSecondary),
                      ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.tint(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: TextField(
                    controller: controller,
                    minLines: 1,
                    maxLines: 5,
                    textCapitalization: TextCapitalization.sentences,
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 14),
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
