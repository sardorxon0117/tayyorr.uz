import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import 'app_logo.dart';

/// Har bir asosiy sahifaning yuqori qismi: chapda logo, o'ngda drawer'ni
/// ochadigan menyu tugmasi — bular scroll bo'lganda ham doim ko'rinib
/// turadi (pinned). Pastida ixtiyoriy qidirish/filtr/hamyon qatori bo'lsa —
/// u scroll bilan yig'ilib, faqat yuqori qator qoladi. `heroImageUrl`
/// berilsa, faqat KENGAYGAN holatda o'sha rasm xira fon sifatida ko'rinadi;
/// to'liq kichraygan (pinned) holatda esa hech qanday rang qolmaydi —
/// faqat shaffof, xira (blur) panel, logo va drawer tugmasi bilan.
class AppHeaderSliver extends StatelessWidget {
  const AppHeaderSliver({
    super.key,
    this.bottom,
    this.bottomHeight = 80,
    this.heroImageUrl,
  });

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
            // 0 = pinned/to'liq kichraygan).
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
                if (hasHero && t > 0)
                  Opacity(
                    opacity: t,
                    child: Image.network(
                      heroImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                  child: Container(
                    // t=0 (to'liq pinned) bo'lganda rang butunlay yo'qoladi —
                    // faqat shaffof blur qoladi.
                    color: AppColors.bg.withValues(alpha: (hasHero ? 0.4 : 0.32) * t),
                  ),
                ),
                // Pastki kontent 56dp'lik toolbar qatoridan darhol pastda,
                // QOTIB turadi (pastga tekislanmaydi) — shu bois kichrayish
                // paytida sarlavha qatoriga "yopishib" qolmaydi, faqat
                // asta-sekin xiralashib, chetdan kesilib boradi.
                if (hasBottom)
                  Positioned(
                    top: 56,
                    left: 0,
                    right: 0,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                      child: Opacity(opacity: t, child: bottom),
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
