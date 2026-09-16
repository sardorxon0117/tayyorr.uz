import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/glass_card.dart';
import '../cubit/dashboard_cubit.dart';
import '../data/order_model.dart';
import '../data/orders_repository.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => DashboardCubit(OrdersRepository())..load(),
      child: const _DashboardView(),
    );
  }
}

class _DashboardView extends StatelessWidget {
  const _DashboardView();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => context.read<DashboardCubit>().load(),
        color: AppColors.indigo,
        backgroundColor: AppColors.surface,
        child: BlocBuilder<DashboardCubit, DashboardState>(
          builder: (context, state) {
            if (state.status == DashboardStatus.loading && state.orders.isEmpty) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.indigo),
              );
            }
            if (state.status == DashboardStatus.failure && state.orders.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 120),
                  Icon(Icons.wifi_off_rounded, color: AppColors.textFaint, size: 40),
                  const SizedBox(height: 12),
                  Center(
                    child: Text(
                      state.error ?? 'Xatolik',
                      style: const TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              );
            }
            if (state.orders.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 140),
                  Center(
                    child: Text(
                      "Hozircha buyurtma yo'q",
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: state.orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) => _OrderCard(order: state.orders[i]),
            );
          },
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});
  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  order.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15.5,
                  ),
                ),
              ),
              _StatusBadge(status: order.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            order.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                kOrderTypeLabel[order.type] ?? order.type,
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const Text(' · ', style: TextStyle(color: AppColors.textFaint)),
              Text(
                order.budget != null ? formatSom(order.budget!) : 'Kelishiladi',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              const Spacer(),
              Text(
                timeAgo(order.createdAt),
                style: const TextStyle(color: AppColors.textFaint, fontSize: 11.5),
              ),
            ],
          ),
        ],
      ),
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
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        kOrderStatusLabel[status] ?? status,
        style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
