import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/app_header_sliver.dart';
import '../../../widgets/glass_card.dart';
import '../cubit/wallet_cubit.dart';
import '../data/wallet_model.dart';
import '../data/wallet_repository.dart';
import 'top_up_sheet.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => WalletCubit(WalletRepository())..load(),
      child: const _WalletView(),
    );
  }
}

class _WalletView extends StatelessWidget {
  const _WalletView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: () => context.read<WalletCubit>().load(),
        color: AppColors.indigo,
        backgroundColor: AppColors.surface,
        child: CustomScrollView(
          slivers: [
            AppHeaderSliver(
              onRefresh: () => context.read<WalletCubit>().load(),
            ),
            BlocBuilder<WalletCubit, WalletState>(
              builder: (context, state) {
                if (state.status == WalletStatus.loading && state.wallet == null) {
                  return const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: AppColors.indigo)),
                  );
                }
                if (state.status == WalletStatus.failure && state.wallet == null) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Text(state.error ?? 'Xatolik', style: const TextStyle(color: AppColors.textMuted)),
                    ),
                  );
                }
                final wallet = state.wallet;
                if (wallet == null) return const SliverToBoxAdapter(child: SizedBox.shrink());

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      _BalanceCard(wallet: wallet),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: _MiniStat(label: 'Yulduzlar', value: '${wallet.starBalance} ⭐')),
                          const SizedBox(width: 10),
                          Expanded(child: _MiniStat(label: 'Hisob kodi', value: wallet.walletCode)),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const Text('Tarix',
                          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 10),
                      if (wallet.transactions.isEmpty && wallet.payouts.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 30),
                          child: Center(
                            child: Text("Hali tranzaksiya yo'q", style: TextStyle(color: AppColors.textMuted)),
                          ),
                        )
                      else
                        ..._mergedHistory(wallet).map((w) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: w,
                            )),
                    ]),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _mergedHistory(WalletModel wallet) {
    final items = <(DateTime, Widget)>[
      ...wallet.transactions.map((t) => (t.createdAt, _TxnTile(txn: t))),
      ...wallet.payouts.map((p) => (p.createdAt, _PayoutTile(payout: p))),
    ];
    items.sort((a, b) => b.$1.compareTo(a.$1));
    return items.map((e) => e.$2).toList();
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.wallet});
  final WalletModel wallet;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.indigoStrong, AppColors.violet],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Joriy balans', style: TextStyle(color: Colors.white70, fontSize: 12.5)),
          const SizedBox(height: 6),
          Text(
            formatSom(wallet.balance),
            style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => showTopUpSheet(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
              ),
              child: const Text("Hisobni to'ldirish"),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _TxnTile extends StatelessWidget {
  const _TxnTile({required this.txn});
  final WalletTransactionModel txn;

  @override
  Widget build(BuildContext context) {
    final isOut = kOutflowTypes.contains(txn.type);
    final color = txn.status == 'PENDING'
        ? AppColors.amber
        : (isOut ? AppColors.red : AppColors.emerald);
    return GlassCard(
      blur: false,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(kTxnTypeLabel[txn.type] ?? txn.type,
                    style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '${timeAgo(txn.createdAt)}${txn.status == 'PENDING' ? " · kutilmoqda" : ""}',
                  style: const TextStyle(color: AppColors.textFaint, fontSize: 11.5),
                ),
              ],
            ),
          ),
          Text(
            '${isOut ? '-' : '+'}${formatSom(txn.amount)}',
            style: TextStyle(color: color, fontSize: 13.5, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _PayoutTile extends StatelessWidget {
  const _PayoutTile({required this.payout});
  final PayoutModel payout;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(kPayoutStatusLabel[payout.status] ?? payout.status,
                    style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(timeAgo(payout.createdAt), style: const TextStyle(color: AppColors.textFaint, fontSize: 11.5)),
              ],
            ),
          ),
          Text('-${formatSom(payout.amount)}',
              style: const TextStyle(color: AppColors.red, fontSize: 13.5, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
