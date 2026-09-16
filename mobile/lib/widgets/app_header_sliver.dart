import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import 'app_logo.dart';
import 'user_avatar.dart';

/// Har bir asosiy sahifaning yuqori qismi: chapda logo, o'ngda profil
/// rasmi — bular scroll bo'lganda ham doim ko'rinib turadi (pinned).
/// Pastida ixtiyoriy qidirish/filtr qatori bo'lsa — u scroll bilan
/// yig'ilib, faqat yuqori qator qoladi. Scroll paytida rang o'zgarmaydi.
class AppHeaderSliver extends StatelessWidget {
  const AppHeaderSliver({
    super.key,
    required this.avatarUrl,
    required this.avatarInitial,
    this.onAvatarTap,
    this.onRefresh,
    this.bottom,
  });

  final String? avatarUrl;
  final String avatarInitial;
  final VoidCallback? onAvatarTap;
  final VoidCallback? onRefresh;
  final Widget? bottom;

  @override
  Widget build(BuildContext context) {
    final hasBottom = bottom != null;
    return SliverAppBar(
      pinned: true,
      floating: false,
      backgroundColor: AppColors.bg,
      surfaceTintColor: Colors.transparent,
      scrolledUnderElevation: 0,
      elevation: 0,
      toolbarHeight: 56,
      expandedHeight: hasBottom ? 136 : 56,
      titleSpacing: 16,
      title: Row(
        children: [
          const AppLogo(height: 20),
          const Spacer(),
          if (onRefresh != null)
            IconButton(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textSecondary),
            ),
          UserAvatar(
            imageUrl: avatarUrl,
            initial: avatarInitial,
            size: 32,
            onTap: onAvatarTap,
          ),
        ],
      ),
      flexibleSpace: hasBottom
          ? FlexibleSpaceBar(
              background: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                child: Align(alignment: Alignment.bottomCenter, child: bottom),
              ),
            )
          : null,
    );
  }
}
