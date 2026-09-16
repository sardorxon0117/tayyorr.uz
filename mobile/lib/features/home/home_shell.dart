import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/theme/app_colors.dart';
import '../../widgets/aurora_background.dart';
import '../../widgets/coming_soon.dart';
import '../auth/bloc/auth_bloc.dart';
import '../dashboard/presentation/dashboard_screen.dart';
import '../profile/presentation/profile_screen.dart';

const _titles = ['tayyorr.uz', 'Xabarlar', 'Hamyon', 'Profil'];

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = const [
      DashboardScreen(),
      ComingSoon(emoji: '💬', title: 'Xabarlar'),
      ComingSoon(emoji: '💳', title: 'Hamyon'),
      ProfileScreen(),
    ];

    return Scaffold(
      extendBody: true,
      appBar: AppBar(
        title: Text(
          _titles[_index],
          style: Theme.of(context).textTheme.titleLarge,
        ),
        actions: [
          if (_index == 3)
            const SizedBox.shrink()
          else
            IconButton(
              onPressed: () => context.read<AuthBloc>().add(const AuthMeRefreshRequested()),
              icon: const Icon(Icons.refresh_rounded, size: 20),
            ),
        ],
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: IndexedStack(index: _index, children: pages),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surface.withValues(alpha: 0.96),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Bosh sahifa',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_rounded),
            label: 'Xabarlar',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_rounded),
            label: 'Hamyon',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
