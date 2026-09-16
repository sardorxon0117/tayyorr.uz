import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../widgets/app_header_sliver.dart';
import '../../widgets/coming_soon.dart';
import '../auth/bloc/auth_bloc.dart';
import '../profile/presentation/profile_screen.dart';

/// Hali to'liq qurilmagan bo'limlar (Xabarlar, Hamyon) uchun — bir xil
/// yuqori sarlavha (logo + profil) bilan "tez orada" ko'rinishi.
class PlaceholderTabScreen extends StatelessWidget {
  const PlaceholderTabScreen({super.key, required this.emoji, required this.title});

  final String emoji;
  final String title;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthBloc>().state.user;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CustomScrollView(
        slivers: [
          AppHeaderSliver(
            avatarUrl: user?.image,
            avatarInitial: _initial(user?.displayName ?? '?'),
            onAvatarTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ProfilePage()),
            ),
          ),
          SliverFillRemaining(
            child: ComingSoon(emoji: emoji, title: title),
          ),
        ],
      ),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}
