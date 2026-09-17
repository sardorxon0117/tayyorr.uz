import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/user_avatar.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/data/user_model.dart';
import '../../dashboard/data/order_model.dart';
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
                        const Text('Buyurtma',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        IconButton(
                          onPressed: () => context.read<OrderDetailCubit>().load(),
                          icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textSecondary),
                        ),
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
      return const Center(child: CircularProgressIndicator(color: AppColors.indigo));
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
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                    ),
                    _StatusBadge(status: order.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(order.description,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.45)),
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
          GlassCard(
            blur: false,
            child: Row(
              children: [
                UserAvatar(imageUrl: order.orderer.image, initial: _initial(order.orderer.displayName), size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.orderer.displayName,
                          style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                      const Text('Buyurtmachi', style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (order.preparer != null) ...[
            const SizedBox(height: 10),
            GlassCard(
              blur: false,
              child: Row(
                children: [
                  UserAvatar(imageUrl: order.preparer!.image, initial: _initial(order.preparer!.displayName), size: 40),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(order.preparer!.displayName,
                            style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                        const Text('Tayyorlovchi', style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          // --- status action buttons ---
          if (isAssignedPreparer && order.status == 'IN_PROGRESS') ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: state.busy ? null : () => context.read<OrderDetailCubit>().setStatus('DELIVERED'),
              child: const Text('Ishni topshirish'),
            ),
          ],
          if (isOrderer && order.status == 'DELIVERED') ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: state.busy ? null : () => context.read<OrderDetailCubit>().setStatus('DONE'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.emerald, foregroundColor: Colors.black),
              child: const Text('Ishni yakunlash'),
            ),
          ],
          if (isOrderer && (order.status == 'OPEN' || order.status == 'IN_PROGRESS')) ...[
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: state.busy
                  ? null
                  : () async {
                      final ok = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          backgroundColor: AppColors.surface,
                          title: const Text('Bekor qilinsinmi?', style: TextStyle(color: Colors.white)),
                          content: const Text("Buyurtma bekor qilinadi, qaytarib bo'lmaydi.",
                              style: TextStyle(color: AppColors.textMuted)),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Yo\'q')),
                            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Ha, bekor qilish')),
                          ],
                        ),
                      );
                      if (ok == true && context.mounted) {
                        context.read<OrderDetailCubit>().setStatus('CANCELLED');
                      }
                    },
              style: OutlinedButton.styleFrom(foregroundColor: AppColors.red, side: const BorderSide(color: Color(0x33F87171))),
              child: const Text('Bekor qilish'),
            ),
          ],

          // --- preparer: submit offer ---
          if (isPreparerRole && !isOrderer && order.status == 'OPEN' && myOffer == null) ...[
            const SizedBox(height: 16),
            _OfferForm(orderId: order.id),
          ],
          if (myOffer != null) ...[
            const SizedBox(height: 16),
            const Text('Sizning taklifingiz', style: TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            _OfferTile(offer: myOffer, canRespond: false, busy: state.busy),
          ],

          // --- orderer: offers list ---
          if (isOrderer && order.offers.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('Takliflar (${order.offers.length})',
                style: const TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...order.offers.map((o) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _OfferTile(
                    offer: o,
                    canRespond: order.status == 'OPEN' && o.status == 'PENDING',
                    busy: state.busy,
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

class _OfferForm extends StatefulWidget {
  const _OfferForm({required this.orderId});
  final String orderId;

  @override
  State<_OfferForm> createState() => _OfferFormState();
}

class _OfferFormState extends State<_OfferForm> {
  final _price = TextEditingController();
  final _message = TextEditingController();

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
          const Text('Taklif yuborish', style: TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          const Text('2 ⭐ sarflanadi (navbatdagi boshlang\'ich o\'rin uchun)',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
          const SizedBox(height: 12),
          AppTextField(label: "Narx, so'm", controller: _price, keyboardType: TextInputType.number),
          const SizedBox(height: 10),
          AppTextField(label: 'Xabar (ixtiyoriy)', controller: _message, maxLines: 3),
          const SizedBox(height: 12),
          ElevatedButton(
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
                  .submitOffer(price: price, message: _message.text.trim());
              if (ok && context.mounted) {
                context.read<AuthBloc>().add(const AuthMeRefreshRequested());
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Taklif yuborildi')),
                );
              }
            },
            child: const Text('Yuborish'),
          ),
        ],
      ),
    );
  }
}

class _OfferTile extends StatelessWidget {
  const _OfferTile({required this.offer, required this.canRespond, required this.busy});
  final OrderOfferModel offer;
  final bool canRespond;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              UserAvatar(imageUrl: offer.preparer.image, initial: _initial(offer.preparer.displayName), size: 34),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(offer.preparer.displayName,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    if (offer.preparerRatingCount > 0)
                      Text('${offer.preparerRating!.toStringAsFixed(1)} ⭐ · ${offer.preparerRatingCount} baho',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
              Text(formatSom(offer.price),
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
            ],
          ),
          if ((offer.message ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(offer.message!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              _OfferStatusBadge(status: offer.status),
              const Spacer(),
              if (canRespond) ...[
                TextButton(
                  onPressed: busy ? null : () => context.read<OrderDetailCubit>().respondToOffer(offer.id, accept: false),
                  child: const Text('Rad etish', style: TextStyle(color: AppColors.red)),
                ),
                ElevatedButton(
                  onPressed: busy ? null : () => context.read<OrderDetailCubit>().respondToOffer(offer.id, accept: true),
                  style: ElevatedButton.styleFrom(minimumSize: const Size(0, 34), padding: const EdgeInsets.symmetric(horizontal: 14)),
                  child: const Text('Qabul qilish'),
                ),
              ],
            ],
          ),
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
