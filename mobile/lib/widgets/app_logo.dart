import 'package:flutter/material.dart';

/// Saytdagi haqiqiy "tayyorr.uz" logotipi (oq versiya, qorong'u fon uchun).
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
    );
  }
}
