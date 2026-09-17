import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/app_header_sliver.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/skeleton.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../order_detail/presentation/order_detail_screen.dart';
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

const _offerBuckets = [
  ('lt5', '5 tadan kam', 0, 4),
  ('5-10', '5 – 10 ta', 5, 10),
  ('10-50', '10 – 50 ta', 11, 50),
  ('gt50', "50 tadan ko'p", 51, 1 << 30),
];

enum _SortKey { newest, oldest, offers, budget }

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
  final Set<String> _types = {};
  final Set<String> _buckets = {};
  _SortKey _sort = _SortKey.newest;
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
    final list = orders.where((o) {
      if (_statusFilter != 'ALL' && o.status != _statusFilter) return false;
      if (_types.isNotEmpty && !_types.contains(o.type)) return false;
      if (_buckets.isNotEmpty) {
        final matches = _buckets.any((key) {
          final b = _offerBuckets.firstWhere((b) => b.$1 == key);
          return o.offers >= b.$3 && o.offers <= b.$4;
        });
        if (!matches) return false;
      }
      if (_query.trim().isNotEmpty &&
          !o.title.toLowerCase().contains(_query.trim().toLowerCase())) {
        return false;
      }
      return true;
    }).toList();

    switch (_sort) {
      case _SortKey.newest:
        list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      case _SortKey.oldest:
        list.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      case _SortKey.offers:
        list.sort((a, b) => b.offers.compareTo(a.offers));
      case _SortKey.budget:
        list.sort((a, b) => (b.budget ?? 0).compareTo(a.budget ?? 0));
    }
    return list;
  }

  bool get _hasExtraFilters => _types.isNotEmpty || _buckets.isNotEmpty || _sort != _SortKey.newest;

  Future<void> _openFilterSheet() async {
    var types = Set<String>.from(_types);
    var buckets = Set<String>.from(_buckets);
    var sort = _sort;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
              child: Container(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  border: Border(top: BorderSide(color: AppColors.cardBorder)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                    const Text('Ish turi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: kOrderTypeLabel.entries.map((e) {
                        final selected = types.contains(e.key);
                        return _SheetChip(
                          label: e.value,
                          selected: selected,
                          onTap: () => setSheetState(() {
                            selected ? types.remove(e.key) : types.add(e.key);
                          }),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 18),
                    const Text('Takliflar soni', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _offerBuckets.map((b) {
                        final selected = buckets.contains(b.$1);
                        return _SheetChip(
                          label: b.$2,
                          selected: selected,
                          onTap: () => setSheetState(() {
                            selected ? buckets.remove(b.$1) : buckets.add(b.$1);
                          }),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 18),
                    const Text('Saralash', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: const [
                        (_SortKey.newest, 'Yangi'),
                        (_SortKey.oldest, 'Eski'),
                        (_SortKey.offers, 'Takliflar'),
                        (_SortKey.budget, 'Byudjet'),
                      ].map((e) {
                        final selected = sort == e.$1;
                        return _SheetChip(
                          label: e.$2,
                          selected: selected,
                          onTap: () => setSheetState(() => sort = e.$1),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setSheetState(() {
                              types = {};
                              buckets = {};
                              sort = _SortKey.newest;
                            }),
                            style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.cardBorder)),
                            child: const Text('Tozalash'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _types
                                  ..clear()
                                  ..addAll(types);
                                _buckets
                                  ..clear()
                                  ..addAll(buckets);
                                _sort = sort;
                              });
                              Navigator.of(sheetContext).pop();
                            },
                            child: const Text("Qo'llash"),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
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
              heroImageUrl: user?.image,
              bottomHeight: user != null ? 228 : 92,
              bottom: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (user != null) ...[
                    _WalletMiniCard(balance: user.balance, stars: user.starBalance),
                    const SizedBox(height: 10),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: _SearchField(controller: _searchController, onChanged: (v) => setState(() => _query = v)),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _openFilterSheet,
                        child: Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: _hasExtraFilters
                                ? AppColors.indigo.withValues(alpha: 0.25)
                                : Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(13),
                            border: Border.all(color: _hasExtraFilters ? AppColors.indigo : AppColors.cardBorder),
                          ),
                          child: const Icon(Icons.tune_rounded, size: 19, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
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
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    sliver: SliverList.list(children: const [
                      SCard(),
                      SizedBox(height: 10),
                      SCard(),
                      SizedBox(height: 10),
                      SCard(),
                    ]),
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
                return SliverMainAxisGroup(
                  slivers: [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                      sliver: SliverList.separated(
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) => _OrderCard(order: filtered[i]),
                      ),
                    ),
                    // ro'yxat qisqa bo'lsa ham (masalan 1ta buyurtma) app bar
                    // to'liq kichrayguncha scroll qilib bo'lishi uchun
                    // minimal bo'sh joy qoldiramiz.
                    SliverToBoxAdapter(
                      child: SizedBox(height: MediaQuery.of(context).size.height * 0.7),
                    ),
                  ],
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
  const _WalletMiniCard({required this.balance, required this.stars});
  final int balance;
  final int stars;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white.withValues(alpha: 0.08),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
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
    return GestureDetector(
      onTap: () async {
        final changed = await Navigator.of(context).push<bool>(
          MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
        );
        if (changed == true && context.mounted) {
          context.read<DashboardCubit>().load();
        }
      },
      child: Opacity(
        opacity: order.deleted ? 0.55 : 1,
        child: GlassCard(
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
              if (order.deleted)
                Container(
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.textFaint.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text("O'chirilgan", style: TextStyle(color: AppColors.textFaint, fontSize: 10.5)),
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
      ),
      ),
    );
  }
}

class _SheetChip extends StatelessWidget {
  const _SheetChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.indigo.withValues(alpha: 0.22) : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? AppColors.indigo : AppColors.cardBorder),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            color: selected ? Colors.white : AppColors.textSecondary,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
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
