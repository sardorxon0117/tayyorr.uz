import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/confirm_dialog.dart';
import '../../../widgets/danger_button.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/skeleton.dart';
import '../../../widgets/user_avatar.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/data/user_model.dart';
import '../../dashboard/data/order_model.dart';
import '../../public_profile/presentation/public_profile_screen.dart';
import '../cubit/order_detail_cubit.dart';
import '../data/order_detail_model.dart';
import '../data/order_detail_repository.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => OrderDetailCubit(OrderDetailRepository(), orderId)..load(),
      child: const _OrderDetailView(),
    );
  }
}

class _OrderDetailView extends StatelessWidget {
  const _OrderDetailView();

  @override
  Widget build(BuildContext context) {
    final me = context.watch<AuthBloc>().state.user;
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: BlocConsumer<OrderDetailCubit, OrderDetailState>(
            listenWhen: (p, c) => c.error != null && c.error != p.error,
            listener: (context, state) {
              if (state.error != null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(state.error!), backgroundColor: AppColors.red.withValues(alpha: 0.9)),
                );
              }
            },
            builder: (context, state) {
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 6, 16, 4),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                        ),
                        Text('Buyurtma',
                            style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  Expanded(child: _Body(state: state, me: me)),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.state, required this.me});
  final OrderDetailState state;
  final UserModel? me;

  @override
  Widget build(BuildContext context) {
    if (state.status == OrderDetailStatus.loading && state.order == null) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          GlassCard(
            blur: false,
            child: Row(
              children: [
                const SCircle(size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SBar(width: MediaQuery.of(context).size.width * 0.3, height: 14),
                      const SizedBox(height: 6),
                      const SBar(width: 80, height: 11),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const SBar(width: 90, height: 11),
          const SizedBox(height: 10),
          SBar(width: MediaQuery.of(context).size.width * 0.6, height: 22),
          const SizedBox(height: 14),
          const SBlock(height: 110),
          const SizedBox(height: 16),
          GlassCard(
            blur: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SBar(width: 120, height: 13),
                SizedBox(height: 12),
                SBar(height: 42, borderRadius: 12),
                SizedBox(height: 10),
                SBar(height: 80, borderRadius: 12),
              ],
            ),
          ),
        ],
      );
    }
    if (state.status == OrderDetailStatus.failure && state.order == null) {
      return Center(child: Text(state.error ?? 'Xatolik', style: const TextStyle(color: AppColors.textMuted)));
    }
    final order = state.order;
    if (order == null) return const SizedBox.shrink();

    final myId = me?.id;
    final isOrderer = myId != null && order.orderer.id == myId;
    final isAssignedPreparer = myId != null && order.preparer?.id == myId;
    final isPreparerRole = me?.isPreparer ?? false;
    OrderOfferModel? myOffer;
    if (isPreparerRole && myId != null) {
      for (final o in order.offers) {
        if (o.preparer.id == myId) {
          myOffer = o;
          break;
        }
      }
    }

    return RefreshIndicator(
      onRefresh: () => context.read<OrderDetailCubit>().load(),
      color: AppColors.indigo,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          GlassCard(
            blur: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(order.title,
                          style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                    ),
                    _StatusBadge(status: order.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(order.description,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.45)),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 14,
                  runSpacing: 8,
                  children: [
                    _InfoChip(icon: Icons.category_outlined, label: kOrderTypeLabel[order.type] ?? order.type),
                    _InfoChip(
                      icon: Icons.payments_outlined,
                      label: order.budget != null ? formatSom(order.budget!) : 'Kelishiladi',
                    ),
                    if (order.deadline != null)
                      _InfoChip(
                        icon: Icons.event_outlined,
                        label: '${order.deadline!.day}.${order.deadline!.month}.${order.deadline!.year}',
                      ),
                    _InfoChip(icon: Icons.schedule_rounded, label: timeAgo(order.createdAt)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _PartyTile(party: order.orderer, roleLabel: 'Buyurtmachi'),
          if (order.preparer != null) ...[
            const SizedBox(height: 10),
            _PartyTile(party: order.preparer!, roleLabel: 'Tayyorlovchi'),
          ],

          // --- faol shartnoma ---
          if (order.activeContract != null) ...[
            const SizedBox(height: 16),
            _ContractCard(contract: order.activeContract!, myId: myId, busy: state.busy),
          ],
          if (order.review != null) ...[
            const SizedBox(height: 12),
            _ReviewCard(review: order.review!),
          ] else if (isOrderer && order.status == 'DONE') ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showReviewSheet(context, orderId: order.id),
                icon: const Icon(Icons.star_outline_rounded, size: 18),
                label: const Text('Tayyorlovchiga baho bering'),
              ),
            ),
          ],

          // --- status action buttons ---
          if (isAssignedPreparer && order.status == 'IN_PROGRESS') ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: state.busy ? null : () => context.read<OrderDetailCubit>().setStatus('DELIVERED'),
                child: const Text('Ishni topshirish'),
              ),
            ),
          ],
          if (isOrderer && order.status == 'DELIVERED') ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: state.busy
                    ? null
                    : () async {
                        final ok = await confirmDialog(context,
                            title: 'Ish yakunlansinmi?',
                            message:
                                "Bloklangan mablag' to'liq tayyorlovchiga o'tkaziladi. Qaytarib bo'lmaydi.",
                            confirmLabel: 'Ha, yakunlash');
                        if (ok != true || !context.mounted) return;
                        final done = await context.read<OrderDetailCubit>().finalizeOrder();
                        if (done && context.mounted) {
                          await _showReviewSheet(context, orderId: order.id);
                        }
                      },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.emerald, foregroundColor: Colors.black),
                child: const Text('Ishni yakunlash'),
              ),
            ),
          ],
          if (isOrderer &&
              !order.deleted &&
              order.status == 'OPEN' &&
              order.activeContract == null) ...[
            const SizedBox(height: 10),
            DangerButton(
              label: 'Bekor qilish',
              onPressed: state.busy
                  ? null
                  : () async {
                      final ok = await confirmDialog(context,
                          title: 'Bekor qilinsinmi?',
                          message: "Buyurtma bekor qilinadi, qaytarib bo'lmaydi.",
                          confirmLabel: 'Ha, bekor qilish');
                      if (ok == true && context.mounted) {
                        context.read<OrderDetailCubit>().setStatus('CANCELLED');
                      }
                    },
            ),
          ],
          if (isOrderer && !order.deleted) ...[
            const SizedBox(height: 10),
            DangerButton(
              label: "Buyurtmani o'chirish",
              icon: Icons.delete_outline_rounded,
              onPressed: state.busy
                  ? null
                  : () async {
                      final ok = await confirmDialog(context,
                          title: "O'chirilsinmi?",
                          message: "Buyurtma faqat sizda saqlanadi, boshqalarga ko'rinmay qoladi.",
                          confirmLabel: "Ha, o'chirish");
                      if (ok == true && context.mounted) {
                        context.read<OrderDetailCubit>().deleteOrder();
                      }
                    },
            ),
          ],
          if (order.deleted) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.textFaint.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text("O'chirilgan — faqat sizga ko'rinadi",
                  style: TextStyle(color: AppColors.textFaint, fontSize: 12)),
            ),
          ],

          // --- preparer: submit offer ---
          if (isPreparerRole && !isOrderer && order.status == 'OPEN' && myOffer == null) ...[
            const SizedBox(height: 16),
            _OfferForm(orderId: order.id),
          ],
          if (myOffer != null) ...[
            const SizedBox(height: 16),
            Text('Sizning taklifingiz', style: TextStyle(color: AppColors.textPrimary, fontSize: 14.5, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            _OfferTile(offer: myOffer, canRespond: false, busy: state.busy),
          ],

          // --- preparer (not orderer): navbat (star bo'yicha o'rinlar) ---
          if (isPreparerRole && !isOrderer && order.queue.isNotEmpty) ...[
            const SizedBox(height: 16),
            _QueueSection(queue: order.queue, orderOpen: order.status == 'OPEN'),
          ],

          // --- orderer: offers list ---
          if (isOrderer && order.offers.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('Takliflar (${order.offers.length})',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 14.5, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...order.offers.map((o) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _OfferTile(
                    offer: o,
                    canRespond: order.status == 'OPEN' && o.status == 'PENDING' && order.activeContract == null,
                    busy: state.busy,
                    orderId: order.id,
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

class _PartyTile extends StatelessWidget {
  const _PartyTile({required this.party, required this.roleLabel});
  final OrderPartyModel party;
  final String roleLabel;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: party.id)),
      ),
      child: GlassCard(
        blur: false,
        child: Row(
          children: [
            UserAvatar(imageUrl: party.image, initial: _initial(party.displayName), size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(party.displayName,
                      style: TextStyle(color: AppColors.textPrimary, fontSize: 13.5, fontWeight: FontWeight.w600)),
                  Text(roleLabel, style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppColors.textFaint, size: 20),
          ],
        ),
      ),
    );
  }
}

class _ContractCard extends StatelessWidget {
  const _ContractCard({required this.contract, required this.myId, required this.busy});
  final ContractModel contract;
  final String? myId;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final isTargetPreparer = myId != null && myId == contract.preparerId;
    final isSent = contract.status == 'SENT';
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.description_rounded, size: 17, color: AppColors.indigo),
              const SizedBox(width: 8),
              Text(isSent ? 'Shartnoma yuborilgan' : 'Faol shartnoma',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
              const Spacer(),
              Text(formatSom(contract.amount),
                  style: const TextStyle(color: AppColors.amber, fontSize: 14, fontWeight: FontWeight.w700)),
            ],
          ),
          if ((contract.note ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(contract.note!, style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
          ],
          if (contract.deadline != null) ...[
            const SizedBox(height: 6),
            Text(
              'Muddat: ${contract.deadline!.day}.${contract.deadline!.month}.${contract.deadline!.year}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
          ],
          if (isSent && isTargetPreparer) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: busy
                        ? null
                        : () => context.read<OrderDetailCubit>().respondToContract(contract.id, action: 'DECLINE'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.red,
                      side: BorderSide(color: AppColors.red.withValues(alpha: 0.4)),
                    ),
                    child: const Text('Rad etish'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: busy
                        ? null
                        : () => context.read<OrderDetailCubit>().respondToContract(contract.id, action: 'ACCEPT'),
                    child: const Text('Qabul qilish'),
                  ),
                ),
              ],
            ),
          ] else if (isSent && !isTargetPreparer) ...[
            const SizedBox(height: 10),
            const Text("Tayyorlovchi javobini kutilmoqda…", style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 10),
            DangerButton(
              label: 'Shartnomani bekor qilish',
              dense: true,
              onPressed: busy
                  ? null
                  : () async {
                      final ok = await confirmDialog(context,
                          title: 'Bekor qilinsinmi?',
                          message: "Bloklangan mablag' hisobingizga qaytariladi.",
                          confirmLabel: 'Ha, bekor qilish');
                      if (ok == true && context.mounted) {
                        context.read<OrderDetailCubit>().respondToContract(contract.id, action: 'CANCEL');
                      }
                    },
            ),
          ] else if (!isSent && myId != null) ...[
            const SizedBox(height: 10),
            DangerButton(
              label: 'Shartnomani bekor qilish',
              dense: true,
              onPressed: busy
                  ? null
                  : () async {
                      final ok = await confirmDialog(context,
                          title: 'Bekor qilinsinmi?',
                          message: "Ish bekor qilinadi, bloklangan mablag' to'liq buyurtmachiga qaytariladi.",
                          confirmLabel: 'Ha, bekor qilish');
                      if (ok == true && context.mounted) {
                        context.read<OrderDetailCubit>().respondToContract(contract.id, action: 'CANCEL');
                      }
                    },
            ),
          ],
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review});
  final OrderReviewModel review;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Baho', style: TextStyle(color: AppColors.textPrimary, fontSize: 13.5, fontWeight: FontWeight.w700)),
              const SizedBox(width: 8),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < review.stars ? Icons.star_rounded : Icons.star_outline_rounded,
                    size: 15,
                    color: AppColors.amber,
                  ),
                ),
              ),
            ],
          ),
          if ((review.comment ?? '').isNotEmpty) ...[
            const SizedBox(height: 6),
            Text('«${review.comment}»',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5, fontStyle: FontStyle.italic)),
          ],
        ],
      ),
    );
  }
}

Future<void> _showReviewSheet(BuildContext context, {required String orderId}) async {
  final cubit = context.read<OrderDetailCubit>();
  int stars = 5;
  final comment = TextEditingController();
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => StatefulBuilder(
      builder: (sheetContext, setSheetState) => Padding(
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
              Text('Tayyorlovchiga baho bering', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final filled = i < stars;
                  return GestureDetector(
                    onTap: () => setSheetState(() => stars = i + 1),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(filled ? Icons.star_rounded : Icons.star_outline_rounded, size: 34, color: AppColors.amber),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 14),
              AppTextField(label: 'Sharh (ixtiyoriy)', controller: comment, maxLines: 3),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.of(sheetContext).pop();
                    await cubit.submitReview(stars: stars, comment: comment.text.trim());
                  },
                  child: const Text('Yuborish'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _OfferForm extends StatefulWidget {
  const _OfferForm({required this.orderId});
  final String orderId;

  @override
  State<_OfferForm> createState() => _OfferFormState();
}

class _OfferFormState extends State<_OfferForm> {
  static const _minStars = 2;
  final _price = TextEditingController();
  final _message = TextEditingController();
  int _stars = _minStars;

  @override
  void dispose() {
    _price.dispose();
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Taklif yuborish', style: TextStyle(color: AppColors.textPrimary, fontSize: 14.5, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          const Text("Navbatdagi o'rningiz sarflagan star miqdoriga bog'liq — ko'proq sarflasangiz yuqoriroqda turasiz.",
              style: TextStyle(color: AppColors.textMuted, fontSize: 11.5, height: 1.35)),
          const SizedBox(height: 12),
          AppTextField(label: "Narx, so'm", controller: _price, keyboardType: TextInputType.number),
          const SizedBox(height: 10),
          AppTextField(label: 'Xabar (ixtiyoriy)', controller: _message, maxLines: 3),
          const SizedBox(height: 10),
          Text('Sarflanadigan star', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 6),
          Row(
            children: [
              _StarStepButton(
                icon: Icons.remove_rounded,
                onTap: _stars > _minStars ? () => setState(() => _stars--) : null,
              ),
              Expanded(
                child: Center(
                  child: Text('$_stars ⭐', style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
              _StarStepButton(icon: Icons.add_rounded, onTap: () => setState(() => _stars++)),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                final price = int.tryParse(_price.text.trim());
                if (price == null || price <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Narxni to'g'ri kiriting")),
                  );
                  return;
                }
                final ok = await context
                    .read<OrderDetailCubit>()
                    .submitOffer(price: price, message: _message.text.trim(), stars: _stars);
                if (ok && context.mounted) {
                  context.read<AuthBloc>().add(const AuthMeRefreshRequested());
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Taklif yuborildi')),
                  );
                }
              },
              child: const Text('Yuborish'),
            ),
          ),
        ],
      ),
    );
  }
}

class _StarStepButton extends StatelessWidget {
  const _StarStepButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: onTap == null ? 0.03 : 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Icon(icon, size: 17, color: onTap == null ? AppColors.textFaint : Colors.white),
      ),
    );
  }
}

class _QueueSection extends StatelessWidget {
  const _QueueSection({required this.queue, required this.orderOpen});
  final List<OfferQueueEntry> queue;
  final bool orderOpen;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Navbat', style: TextStyle(color: AppColors.textPrimary, fontSize: 14.5, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          const Text("Kim ko'proq star sarflagan bo'lsa, shuncha yuqorida turadi.",
              style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
          const SizedBox(height: 12),
          ...queue.map((q) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: q.mine ? AppColors.indigo.withValues(alpha: 0.25) : AppColors.tint(0.05),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('${q.position}',
                          style: TextStyle(color: q.mine ? Colors.white : AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        q.mine ? '${q.maskedName} (siz)' : q.maskedName,
                        style: TextStyle(
                          color: q.mine ? Colors.white : AppColors.textSecondary,
                          fontSize: 13,
                          fontWeight: q.mine ? FontWeight.w700 : FontWeight.w500,
                          letterSpacing: q.hiddenLen > 0 ? 1 : 0,
                        ),
                      ),
                    ),
                    Text('${q.starsSpent} ⭐', style: const TextStyle(color: AppColors.amber, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  ],
                ),
              )),
          if (orderOpen && queue.any((q) => q.mine)) ...[
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showBoostSheet(context),
                icon: const Icon(Icons.rocket_launch_rounded, size: 16),
                label: const Text("Yuqoriga chiqish uchun star qo'shish"),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showBoostSheet(BuildContext context) {
    final cubit = context.read<OrderDetailCubit>();
    int stars = 2;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) => Container(
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
              Text("Qo'shimcha star", style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 14),
              Row(
                children: [
                  _StarStepButton(icon: Icons.remove_rounded, onTap: stars > 1 ? () => setSheetState(() => stars--) : null),
                  Expanded(
                    child: Center(
                      child: Text('$stars ⭐', style: TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  _StarStepButton(icon: Icons.add_rounded, onTap: () => setSheetState(() => stars++)),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.of(sheetContext).pop();
                    final ok = await cubit.boostOffer(stars);
                    if (ok && context.mounted) {
                      context.read<AuthBloc>().add(const AuthMeRefreshRequested());
                    }
                  },
                  child: const Text("Qo'shish"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _showSendContractSheet(
  BuildContext context, {
  required String orderId,
  required OrderOfferModel offer,
}) async {
  final cubit = context.read<OrderDetailCubit>();
  final amount = TextEditingController(text: '${offer.price}');
  final note = TextEditingController();
  DateTime? deadline;
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => StatefulBuilder(
      builder: (sheetContext, setSheetState) => Padding(
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
              Text('Shartnoma yuborish', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              const Text(
                "Summa hisobingizdan bloklanadi, ish yakunlangach tayyorlovchiga o'tadi.",
                style: TextStyle(color: AppColors.textMuted, fontSize: 12.5, height: 1.35),
              ),
              const SizedBox(height: 14),
              AppTextField(label: "Summa, so'm", controller: amount, keyboardType: TextInputType.number),
              const SizedBox(height: 10),
              AppTextField(label: 'Tavsif (ixtiyoriy)', controller: note, maxLines: 3),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: sheetContext,
                    initialDate: DateTime.now().add(const Duration(days: 3)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) setSheetState(() => deadline = picked);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  decoration: BoxDecoration(
                    color: AppColors.tint(0.04),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.textMuted),
                      const SizedBox(width: 10),
                      Text(
                        deadline != null
                            ? '${deadline!.day}.${deadline!.month}.${deadline!.year}'
                            : 'Muddat (ixtiyoriy)',
                        style: TextStyle(color: deadline != null ? Colors.white : AppColors.textMuted, fontSize: 13.5),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final amt = int.tryParse(amount.text.trim());
                    if (amt == null || amt <= 0) {
                      ScaffoldMessenger.of(sheetContext).showSnackBar(
                        const SnackBar(content: Text("Summani to'g'ri kiriting")),
                      );
                      return;
                    }
                    Navigator.of(sheetContext).pop();
                    await cubit.sendContract(
                      preparerId: offer.preparer.id,
                      amount: amt,
                      note: note.text.trim(),
                      deadline: deadline,
                    );
                  },
                  child: const Text('Yuborish'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _OfferTile extends StatelessWidget {
  const _OfferTile({required this.offer, required this.canRespond, required this.busy, this.orderId});
  final OrderOfferModel offer;
  final bool canRespond;
  final bool busy;
  final String? orderId;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: offer.preparer.id)),
                ),
                child: Row(
                  children: [
                    UserAvatar(imageUrl: offer.preparer.image, initial: _initial(offer.preparer.displayName), size: 34),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 140,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(offer.preparer.displayName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                          if (offer.preparerRatingCount > 0)
                            Text('${offer.preparerRating!.toStringAsFixed(1)} ⭐ · ${offer.preparerRatingCount} baho',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(formatSom(offer.price),
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
            ],
          ),
          if ((offer.message ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(offer.message!, style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              _OfferStatusBadge(status: offer.status),
              const SizedBox(width: 8),
              Text('${offer.starsSpent} ⭐', style: const TextStyle(color: AppColors.amber, fontSize: 11.5, fontWeight: FontWeight.w600)),
            ],
          ),
          if (canRespond) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: busy ? null : () => context.read<OrderDetailCubit>().respondToOffer(offer.id, accept: false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.red,
                      side: BorderSide(color: AppColors.red.withValues(alpha: 0.4)),
                    ),
                    child: const Text('Rad etish'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: busy || orderId == null
                        ? null
                        : () => _showSendContractSheet(context, orderId: orderId!, offer: offer),
                    child: const Text('Shartnoma yuborish'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _OfferStatusBadge extends StatelessWidget {
  const _OfferStatusBadge({required this.status});
  final String status;

  Color get _color {
    switch (status) {
      case 'ACCEPTED':
        return AppColors.emerald;
      case 'REJECTED':
        return AppColors.red;
      case 'WITHDRAWN':
        return AppColors.textMuted;
      default:
        return AppColors.amber;
    }
  }

  String get _label {
    switch (status) {
      case 'ACCEPTED':
        return 'Qabul qilindi';
      case 'REJECTED':
        return 'Rad etildi';
      case 'WITHDRAWN':
        return 'Qaytarib olindi';
      default:
        return "Ko'rib chiqilmoqda";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: _color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(99)),
      child: Text(_label, style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  Color get _color {
    switch (status) {
      case 'OPEN':
        return AppColors.emerald;
      case 'IN_PROGRESS':
        return AppColors.indigo;
      case 'DONE':
        return AppColors.textMuted;
      case 'CANCELLED':
        return AppColors.red;
      default:
        return AppColors.amber;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: _color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(99)),
      child: Text(kOrderStatusLabel[status] ?? status,
          style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}
