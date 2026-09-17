import 'package:flutter/material.dart';

import 'theme_controller.dart';

/// tayyorr.uz veb-saytining rang palitrasi bilan bir xil. Neytral
/// (fon/matn/chegara) ranglar yorug'/qorong'i rejimga qarab o'zgaradi —
/// saytdagi `html.light` CSS ustunlashtirishlari bilan bir xil qiymatlar.
/// Brend/aksent ranglar (indigo, amber va h.k.) ikkala rejimda ham bir xil.
class AppColors {
  AppColors._();

  static bool get isLight => ThemeController.instance.isLight;
  static bool get _light => isLight;

  static Color get bg => _light ? const Color(0xFFF3F3F5) : const Color(0xFF07070C);
  static Color get surface => _light ? const Color(0xFFFFFFFF) : const Color(0xFF0B0B12);
  static const surfaceAlt = Color(0xFF0E0E16);
  static const card = Color(0x0DFFFFFF); // white / 5%
  static Color get cardBorder => _light ? const Color(0x14000000) : const Color(0x1AFFFFFF);

  static const indigo = Color(0xFF6366F1);
  static const indigoStrong = Color(0xFF4F46E5);
  static const violet = Color(0xFF7C3AED);

  static Color get textPrimary => _light ? const Color(0xFF18181B) : Colors.white;
  static Color get textSecondary => _light ? const Color(0xFF52525B) : const Color(0xFFA1A1AA);
  static const textMuted = Color(0xFF71717A); // zinc-500 — ikkala rejimda ham o'qiladi
  static Color get textFaint => _light ? const Color(0xFFA1A1AA) : const Color(0xFF52525B);

  static const emerald = Color(0xFF34D399);
  static const amber = Color(0xFFFBBF24);
  static const red = Color(0xFFF87171);

  /// Chip/input/bubble kabi joylarda ishlatiladigan xira neytral fon —
  /// avval hamma joyda qattiq kodlangan `Colors.white.withValues(alpha:
  /// ...)` edi (faqat qorong'i fonda ko'rinardi). Endi rejimga qarab
  /// asosiy rang (oq yoki qora) almashadi, alpha darajasi bir xil qoladi.
  static Color tint([double alpha = 0.05]) => (_light ? Colors.black : Colors.white).withValues(alpha: alpha);
}
