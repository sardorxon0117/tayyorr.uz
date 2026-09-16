import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import 'app_logo.dart';

/// Har bir asosiy sahifaning yuqori qismi: chapda logo, o'ngda drawer'ni
/// ochadigan menyu tugmasi — bular scroll bo'lganda ham doim ko'rinib
/// turadi (pinned). Pastida ixtiyoriy qidirish/filtr/hamyon qatori bo'lsa —
/// u scroll bilan yig'ilib, faqat yuqori qator qoladi. Fon qattiq rang
/// emas — orqadagi ro'yxat xira (blur) ko'rinib turadigan shisha panel,
/// scroll paytida rangi o'zgarmaydi.
class AppHeaderSliver extends StatelessWidget {
  const AppHeaderSliver({
    super.key,
    this.onRefresh,
    this.bottom,
    this.bottomHeight = 80,
  });

  final VoidCallback? onRefresh;
  final Widget? bottom;

  /// `bottom` widgetining balandligi — SliverAppBar kengaygan holatining
  /// umumiy bo'yini shu asosida hisoblanadi.
  final double bottomHeight;

  @override
  Widget build(BuildContext context) {
    final hasBottom = bottom != null;
    return SliverAppBar(
      pinned: true,
      floating: false,
      automaticallyImplyLeading: false,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      scrolledUnderElevation: 0,
      elevation: 0,
      toolbarHeight: 56,
      expandedHeight: hasBottom ? 56 + bottomHeight + 14 : 56,
      titleSpacing: 16,
      flexibleSpace: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            color: AppColors.bg.withValues(alpha: 0.55),
            child: hasBottom
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                    child: Align(alignment: Alignment.bottomCenter, child: bottom),
                  )
                : null,
          ),
        ),
      ),
      title: Row(
        children: [
          const AppLogo(height: 20),
          const Spacer(),
          if (onRefresh != null)
            IconButton(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textSecondary),
            ),
          Builder(
            builder: (context) => IconButton(
              onPressed: () => Scaffold.of(context).openDrawer(),
              icon: const Icon(Icons.menu_rounded, size: 24, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
