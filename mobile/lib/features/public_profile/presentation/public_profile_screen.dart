import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/skeleton.dart';
import '../../../widgets/user_avatar.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../dashboard/data/order_model.dart';
import '../../messages/data/message_model.dart';
import '../../messages/data/messages_repository.dart';
import '../../messages/presentation/chat_screen.dart';
import '../cubit/public_profile_cubit.dart';
import '../data/public_profile_model.dart';
import '../data/public_profile_repository.dart';

class PublicProfileScreen extends StatelessWidget {
  const PublicProfileScreen({super.key, required this.userId});
  final String userId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => PublicProfileCubit(PublicProfileRepository(), userId),
      child: const _PublicProfileView(),
    );
  }
}

class _PublicProfileView extends StatelessWidget {
  const _PublicProfileView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 6, 16, 4),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                    ),
                    const Text('Profil', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              Expanded(
                child: BlocBuilder<PublicProfileCubit, PublicProfileState>(
                  builder: (context, state) {
                    if (state.status == PublicProfileStatus.loading) {
                      return ListView(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                        children: [
                          Row(
                            children: [
                              const SCircle(size: 76),
                              const SizedBox(width: 14),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  SBar(width: 130, height: 16),
                                  SizedBox(height: 8),
                                  SBar(width: 100, height: 11),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          GlassCard(
                            blur: false,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                SBar(height: 11),
                                SizedBox(height: 8),
                                SBar(width: 180, height: 11),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          const SBar(width: 160, height: 16),
                          const SizedBox(height: 10),
                          const SCard(),
                          const SizedBox(height: 10),
                          const SCard(),
                        ],
                      );
                    }
                    if (state.status == PublicProfileStatus.failure || state.profile == null) {
                      return Center(
                        child: Text(state.error ?? 'Topilmadi', style: const TextStyle(color: AppColors.textMuted)),
                      );
                    }
                    final p = state.profile!;
                    return ListView(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            UserAvatar(imageUrl: p.image, initial: _initial(p.displayName), size: 76),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p.displayName,
                                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 3),
                                  Text(
                                    '@${p.login ?? "—"} · ${p.role == "PREPARER" ? "Tayyorlovchi" : p.role == "ORDERER" ? "Buyurtma beruvchi" : "—"}',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: p.online ? AppColors.emerald : AppColors.textFaint,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(p.presenceText,
                                          style: TextStyle(color: p.online ? AppColors.emerald : AppColors.textMuted, fontSize: 11.5)),
                                    ],
                                  ),
                                  if (p.isPreparer) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        _Stars(value: p.rating ?? 0),
                                        const SizedBox(width: 6),
                                        Text(p.ratingCount > 0 ? p.rating!.toStringAsFixed(1) : '—',
                                            style: const TextStyle(color: Colors.white, fontSize: 13)),
                                        const SizedBox(width: 4),
                                        Text('(${p.ratingCount} baho)',
                                            style: const TextStyle(color: AppColors.textFaint, fontSize: 11.5)),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (context.read<AuthBloc>().state.user?.id != p.id) ...[
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _openChat(context, p),
                              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 17),
                              label: const Text('Xabar yozish'),
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        GlassCard(
                          blur: false,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _InfoRow(label: 'Email', value: p.email?.display ?? '—', blurred: p.email != null && !p.email!.full),
                              const Divider(color: AppColors.cardBorder, height: 20),
                              _InfoRow(label: "Ro'yxatdan o'tgan", value: _shortDate(p.createdAt)),
                              const Divider(color: AppColors.cardBorder, height: 20),
                              _InfoRow(
                                label: p.isPreparer ? 'Olingan ishlar' : 'Berilgan buyurtmalar',
                                value: '${p.isPreparer ? p.ordersTaken : p.ordersCreated}',
                              ),
                              if ((p.about ?? '').isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Text(p.about!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.4)),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          '${p.isPreparer ? "Bajarilgan ishlar" : "Berilgan buyurtmalar"} (${p.doneOrders.length})',
                          style: const TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        if (p.doneOrders.isEmpty)
                          const GlassCard(
                            blur: false,
                            child: Text("Hozircha yo'q.", style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          )
                        else
                          ...p.doneOrders.map((o) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: _DoneOrderTile(order: o, isPreparer: p.isPreparer),
                              )),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _openChat(BuildContext context, PublicProfileModel p) async {
  final navigator = Navigator.of(context);
  final messenger = ScaffoldMessenger.of(context);
  try {
    final convId = await MessagesRepository().startConversation(p.id);
    if (!context.mounted) return;
    navigator.push(MaterialPageRoute(
      builder: (_) => ChatScreen(
        conversationId: convId,
        other: ChatOtherUser(id: p.id, name: p.displayName, login: p.login, image: p.image, isSupport: false),
      ),
    ));
  } catch (_) {
    messenger.showSnackBar(const SnackBar(content: Text("Suhbat ochilmadi — qayta urinib ko'ring")));
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.blurred = false});
  final String label;
  final String value;
  final bool blurred;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              letterSpacing: blurred ? 1.5 : 0,
            ),
          ),
        ),
      ],
    );
  }
}

class _DoneOrderTile extends StatelessWidget {
  const _DoneOrderTile({required this.order, required this.isPreparer});
  final PublicOrderModel order;
  final bool isPreparer;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 3),
                    Text(
                      '${kOrderTypeLabel[order.type] ?? order.type} · ${_shortDate(order.date)}'
                      '${!isPreparer ? " · ${kOrderStatusLabel[order.status] ?? order.status}" : ""}',
                      style: const TextStyle(color: AppColors.textFaint, fontSize: 11.5),
                    ),
                  ],
                ),
              ),
              if (isPreparer)
                order.reviewStars != null
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          _Stars(value: order.reviewStars!.toDouble(), size: 12),
                          Text('${order.reviewStars}.0', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      )
                    : const Text('baholanmagan', style: TextStyle(color: AppColors.textFaint, fontSize: 11)),
            ],
          ),
          if (isPreparer && (order.reviewComment ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('«${order.reviewComment}»',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5, fontStyle: FontStyle.italic)),
          ],
        ],
      ),
    );
  }
}

class _Stars extends StatelessWidget {
  const _Stars({required this.value, this.size = 14});
  final double value;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = value >= i + 1;
        final half = !filled && value > i && value < i + 1;
        return Icon(
          half ? Icons.star_half_rounded : (filled ? Icons.star_rounded : Icons.star_outline_rounded),
          size: size,
          color: filled || half ? AppColors.amber : AppColors.textFaint,
        );
      }),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}

const _monthsUz = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

String _shortDate(DateTime d) {
  final s = '${d.day}-${_monthsUz[d.month - 1]}';
  return d.year == DateTime.now().year ? s : '$s ${d.year}';
}
