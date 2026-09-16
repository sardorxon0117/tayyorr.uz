import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../widgets/aurora_background.dart';
import '../dashboard/presentation/dashboard_screen.dart';
import '../messages/presentation/messages_list_screen.dart';
import '../offers/presentation/offers_screen.dart';
import '../profile/presentation/profile_screen.dart';
import '../wallet/presentation/wallet_screen.dart';
import 'section_cubit.dart';

/// Saytda bo'lgani kabi — pastki navbar yo'q, bo'limlar orasida
/// har bir sahifaning app bar'idagi menyu (hamburger) tugmasi ochadigan
/// drawer orqali o'tiladi.
class HomeShell extends StatelessWidget {
  const HomeShell({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => SectionCubit(),
      child: const _HomeShellView(),
    );
  }
}

const _sectionOrder = [
  AppSection.dashboard,
  AppSection.offers,
  AppSection.messages,
  AppSection.wallet,
  AppSection.profile,
];

class _HomeShellView extends StatelessWidget {
  const _HomeShellView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SectionCubit, AppSection>(
      builder: (context, section) {
        return AuroraBackground(
          child: IndexedStack(
            index: _sectionOrder.indexOf(section),
            children: const [
              DashboardScreen(),
              OffersScreen(),
              MessagesListScreen(),
              WalletScreen(),
              ProfileScreen(),
            ],
          ),
        );
      },
    );
  }
}
