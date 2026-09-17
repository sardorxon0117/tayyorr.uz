import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Saytdagi haqiqiy "tayyorr.uz" logotipi. Asset oq rangda chizilgan —
/// yorug' rejimda o'qilishi uchun matn rangiga moslab bo'yaladi.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.height = 22});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/logo.png',
      height: height,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      color: AppColors.textPrimary,
      colorBlendMode: BlendMode.srcIn,
    );
  }
}
