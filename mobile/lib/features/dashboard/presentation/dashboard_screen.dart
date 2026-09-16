import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/app_header_sliver.dart';
import '../../../widgets/glass_card.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../wallet/presentation/top_up_sheet.dart';
import '../cubit/dashboard_cubit.dart';
import '../data/order_model.dart';
import '../data/orders_repository.dart';
import 'create_order_screen.dart';

const _statusFilters = [
  ('ALL', 'Hammasi'),
  ('OPEN', 'Ochiq'),
  ('IN_PROGRESS', 'Jarayonda'),
  ('DELIVERED', 'Topshirilgan'),
  ('DONE', 'Yakunlangan'),
  ('CANCELLED', 'Bekor qilingan'),
];

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

class _DashboardView extends StatefulWidget {
  const _DashboardView();

  @override
  State<_DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<_DashboardView> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  String _query = '';
  String _statusFilter = 'ALL';
  bool _fabExpanded = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _fabExpanded = false);
    });
  }

  void _onScroll() {
    if (_scrollController.offset > 8 && _fabExpanded) {
      setState(() => _fabExpanded = false);
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<OrderModel> _filter(List<OrderModel> orders) {
    return orders.where((o) {
      if (_statusFilter != 'ALL' && o.status != _statusFilter) return false;
      if (_query.trim().isEmpty) return true;
      return o.title.toLowerCase().contains(_query.trim().toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthBloc>().state.user;
    final isOrderer = user != null && !user.isPreparer;

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      drawer: const AppDrawer(),
      floatingActionButton: isOrderer
          ? _CreateOrderFab(
              expanded: _fabExpanded,
              onPressed: () async {
                setState(() => _fabExpanded = false);
                final created = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(builder: (_) => const CreateOrderScreen()),
                );
                if (created == true && context.mounted) {
                  context.read<DashboardCubit>().load();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Buyurtma joylandi')),
                  );
                }
              },
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () => context.read<DashboardCubit>().load(),
        color: AppColors.indigo,
        backgroundColor: AppColors.surface,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            AppHeaderSliver(
              onRefresh: () => context.read<DashboardCubit>().load(),
              bottomHeight: user != null ? 228 : 92,
              bottom: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (user != null) ...[
                    _WalletMiniCard(
                      balance: user.balance,
                      stars: user.starBalance,
                      imageUrl: user.image,
                    ),
                    const SizedBox(height: 10),
                  ],
                  _SearchField(controller: _searchController, onChanged: (v) => setState(() => _query = v)),
                  const SizedBox(height: 10),
                  _FilterChips(
                    value: _statusFilter,
                    onChanged: (v) => setState(() => _statusFilter = v),
                  ),
                ],
              ),
            ),
            BlocBuilder<DashboardCubit, DashboardState>(
              builder: (context, state) {
                if (state.status == DashboardStatus.loading && state.orders.isEmpty) {
                  return const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: AppColors.indigo)),
                  );
                }
                if (state.status == DashboardStatus.failure && state.orders.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.wifi_off_rounded, color: AppColors.textFaint, size: 40),
                          const SizedBox(height: 12),
                          Text(state.error ?? 'Xatolik', style: const TextStyle(color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  );
                }
                final filtered = _filter(state.orders);
                if (filtered.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Text(
                        state.orders.isEmpty ? "Hozircha buyurtma yo'q" : 'Mos buyurtma topilmadi',
                        style: const TextStyle(color: AppColors.textMuted),
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                  sliver: SliverList.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) => _OrderCard(order: filtered[i]),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _WalletMiniCard extends StatelessWidget {
  const _WalletMiniCard({required this.balance, required this.stars, this.imageUrl});
  final int balance;
  final int stars;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final hasImage = (imageUrl ?? '').isNotEmpty;
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Stack(
        children: [
          // orqa fon: profil rasmi bo'lsa kuchli xiralashtirilgan (blur)
          // holda — aniq ko'rinmaydi, faqat "izi" bo'ladi; bo'lmasa gradient
          if (hasImage)
            Positioned.fill(
              child: ImageFiltered(
                imageFilter: ImageFilter.blur(sigmaX: 26, sigmaY: 26, tileMode: TileMode.decal),
                child: Image.network(
                  imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const _CardGradientBg(),
                ),
              ),
            )
          else
            const Positioned.fill(child: _CardGradientBg()),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: hasImage ? 0.35 : 0.05),
                    Colors.black.withValues(alpha: hasImage ? 0.78 : 0.35),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Balans', style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 4),
                Text(
                  formatSom(balance),
                  style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text('$stars ⭐ yulduz',
                          style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w600)),
                    ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () => showTopUpSheet(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        minimumSize: const Size(0, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                      ),
                      child: const Text("To'ldirish"),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CardGradientBg extends StatelessWidget {
  const _CardGradientBg();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.indigoStrong, AppColors.violet],
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller, required this.onChanged});
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: const TextStyle(color: Colors.white, fontSize: 13.5),
        decoration: InputDecoration(
          isDense: true,
          border: InputBorder.none,
          hintText: 'Nomi bo\'yicha qidirish...',
          hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13.5),
          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 19),
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
        ),
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 30,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _statusFilters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, i) {
          final (val, label) = _statusFilters[i];
          final selected = val == value;
          return GestureDetector(
            onTap: () => onChanged(val),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? AppColors.indigo.withValues(alpha: 0.22) : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: selected ? AppColors.indigo : AppColors.cardBorder),
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: selected ? Colors.white : AppColors.textSecondary,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _CreateOrderFab extends StatelessWidget {
  const _CreateOrderFab({required this.expanded, required this.onPressed});
  final bool expanded;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      height: 56,
      width: expanded ? 200 : 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: const LinearGradient(colors: [AppColors.indigo, AppColors.violet]),
        boxShadow: [
          BoxShadow(
            color: AppColors.indigo.withValues(alpha: 0.45),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(28),
          onTap: onPressed,
          child: ClipRect(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(width: 16),
                const Icon(Icons.add_rounded, color: Colors.white, size: 24),
                const SizedBox(width: 8),
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 160),
                  opacity: expanded ? 1 : 0,
                  child: const Text(
                    'Buyurtma yaratish',
                    maxLines: 1,
                    softWrap: false,
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
                const SizedBox(width: 16),
              ],
            ),
          ),
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
