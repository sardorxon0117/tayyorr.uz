import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../widgets/app_bottom_nav.dart';
import '../../widgets/aurora_background.dart';
import '../auth/bloc/auth_bloc.dart';
import '../dashboard/presentation/dashboard_screen.dart';
import '../messages/presentation/messages_list_screen.dart';
import '../offers/presentation/offers_screen.dart';
import '../profile/presentation/profile_screen.dart';
import '../wallet/presentation/wallet_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final isPreparer = context.select((AuthBloc b) => b.state.user?.isPreparer ?? false);

    // Dashboard/Xabarlar/Hamyon barcha rollar uchun bir xil; 4-o'rin esa
    // rolga qarab — buyurtma beruvchi uchun Profil, tayyorlovchi uchun
    // "Men yuborgan takliflar" (profilga esa app bardagi rasmdan kiradi).
    final pages = [
      const DashboardScreen(),
      const MessagesListScreen(),
      const WalletScreen(),
      isPreparer ? const OffersScreen() : const ProfileScreen(),
    ];

    final items = [
      const NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Bosh sahifa'),
      const NavItem(
        icon: Icons.chat_bubble_outline_rounded,
        activeIcon: Icons.chat_bubble_rounded,
        label: 'Xabarlar',
      ),
      const NavItem(
        icon: Icons.account_balance_wallet_outlined,
        activeIcon: Icons.account_balance_wallet_rounded,
        label: 'Hamyon',
      ),
      isPreparer
          ? const NavItem(
              icon: Icons.local_offer_outlined,
              activeIcon: Icons.local_offer_rounded,
              label: 'Takliflarim',
            )
          : const NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profil'),
    ];

    return Scaffold(
      extendBody: true,
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          bottom: false,
          child: IndexedStack(index: _index, children: pages),
        ),
      ),
      bottomNavigationBar: AppBottomNav(
        items: items,
        index: _index,
        onTap: (i) => setState(() => _index = i),
      ),
    );
  }
}
