import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import 'app_logo.dart';

/// Har bir asosiy sahifaning yuqori qismi: chapda logo, o'ngda drawer'ni
/// ochadigan menyu tugmasi — bular scroll bo'lganda ham doim ko'rinib
/// turadi (pinned). Pastida ixtiyoriy qidirish/filtr/hamyon qatori bo'lsa —
/// u scroll bilan yig'ilib, faqat yuqori qator qoladi. Fon qattiq rang
/// emas — shisha (blur) panel; `heroImageUrl` berilsa, faqat KENGAYGAN
/// (expanded) holatda o'sha rasm xiralashtirilgan fon sifatida ko'rinadi —
/// scroll bilan kichrayib pinned holatga o'tganda rasm so'nib, faqat
/// tiniq (blur) panel qoladi.
class AppHeaderSliver extends StatelessWidget {
  const AppHeaderSliver({
    super.key,
    this.onRefresh,
    this.bottom,
    this.bottomHeight = 80,
    this.heroImageUrl,
  });

  final VoidCallback? onRefresh;
  final Widget? bottom;
  final String? heroImageUrl;

  /// `bottom` widgetining balandligi — SliverAppBar kengaygan holatining
  /// umumiy bo'yini shu asosida hisoblanadi.
  final double bottomHeight;

  @override
  Widget build(BuildContext context) {
    final hasBottom = bottom != null;
    final hasHero = (heroImageUrl ?? '').isNotEmpty;
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
        child: Builder(
          builder: (context) {
            // Kengaygan/pinned oralig'idagi progress (1 = to'liq kengaygan,
            // 0 = pinned/kichraygan) — rasmni faqat kengaygan holatda
            // ko'rsatish uchun.
            final settings = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
            double t = 1;
            if (settings != null && settings.maxExtent > settings.minExtent) {
              t = ((settings.currentExtent - settings.minExtent) /
                      (settings.maxExtent - settings.minExtent))
                  .clamp(0.0, 1.0);
            }
            return Stack(
              fit: StackFit.expand,
              children: [
                if (hasHero)
                  Opacity(
                    opacity: t,
                    child: Image.network(
                      heroImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: AppColors.bg),
                    ),
                  ),
                BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: hasHero ? 16 * t + 10 : 12,
                    sigmaY: hasHero ? 16 * t + 10 : 12,
                  ),
                  child: Container(
                    color: AppColors.bg.withValues(alpha: hasHero ? 0.38 * t + 0.3 : 0.3),
                    child: hasBottom
                        ? Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                            child: Align(alignment: Alignment.bottomCenter, child: bottom),
                          )
                        : null,
                  ),
                ),
              ],
            );
          },
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
