import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/theme_controller.dart';

/// Yorug'/qorong'i rejim almashtirgichi — saytdagi ikki tugmali segment
/// bilan bir xil (☀️ Yorug' / 🌙 Qorong'i).
class ThemeToggle extends StatelessWidget {
  const ThemeToggle({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeController.instance,
      builder: (context, _) {
        final isLight = ThemeController.instance.isLight;
        return Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: isLight ? 0.04 : 0.03),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Row(
            children: [
              Expanded(
                child: _Segment(
                  label: 'Yorug\'',
                  icon: Icons.light_mode_rounded,
                  selected: isLight,
                  onTap: () => ThemeController.instance.setLight(true),
                ),
              ),
              Expanded(
                child: _Segment(
                  label: 'Qorong\'i',
                  icon: Icons.dark_mode_rounded,
                  selected: !isLight,
                  onTap: () => ThemeController.instance.setLight(false),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({required this.label, required this.icon, required this.selected, required this.onTap});
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.indigo.withValues(alpha: 0.22) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 15, color: selected ? Colors.white : AppColors.textFaint),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.textFaint,
                fontSize: 12,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
