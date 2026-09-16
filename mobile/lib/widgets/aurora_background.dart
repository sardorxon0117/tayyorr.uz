import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Saytdagi xira, rangli "blob" foniga o'xshab — bir nechta xiralashtirilgan
/// rangli doiralar orqa fonda suzib turadi.
class AuroraBackground extends StatelessWidget {
  const AuroraBackground({super.key, this.child});

  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(color: AppColors.bg),
        Positioned(
          top: -80,
          left: -60,
          child: _Blob(color: AppColors.indigo, size: 320, opacity: 0.35),
        ),
        Positioned(
          top: 60,
          right: -100,
          child: _Blob(color: AppColors.violet, size: 300, opacity: 0.28),
        ),
        Positioned(
          bottom: -100,
          left: -60,
          child: _Blob(color: AppColors.indigoStrong, size: 280, opacity: 0.22),
        ),
        if (child != null) child!,
      ],
    );
  }
}

class _Blob extends StatelessWidget {
  const _Blob({required this.color, required this.size, required this.opacity});

  final Color color;
  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color.withValues(alpha: opacity),
        ),
      ),
    );
  }
}
