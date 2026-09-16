import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

class ComingSoon extends StatelessWidget {
  const ComingSoon({super.key, required this.emoji, required this.title});
  final String emoji;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 44)),
          const SizedBox(height: 14),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          const Text('Tez orada shu yerda boʻladi', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ],
      ),
    );
  }
}
