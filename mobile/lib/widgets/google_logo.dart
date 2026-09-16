import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Google'ning rasmiy 4-rangli "G" belgisini vektor shakllar bilan
/// chizadi (tashqi rasm/asset kerak emas).
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key, this.size = 18});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  static const _blue = Color(0xFF4285F4);
  static const _green = Color(0xFF34A853);
  static const _yellow = Color(0xFFFBBC05);
  static const _red = Color(0xFFEA4335);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;
    final strokeWidth = r * 0.82;
    final ringRadius = r - strokeWidth / 2;
    final rect = Rect.fromCircle(center: center, radius: ringRadius);

    void arc(double startDeg, double sweepDeg, Color color) {
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;
      canvas.drawArc(
        rect,
        startDeg * math.pi / 180,
        sweepDeg * math.pi / 180,
        false,
        paint,
      );
    }

    // to'rtta segment — soat yo'nalishi bo'yicha, kichik bo'shliqlar bilan
    arc(-50, 95, _blue);
    arc(47, 90, _green);
    arc(139, 88, _yellow);
    arc(229, 89, _red);

    // "G" ning gorizontal ustunchasi (o'ng tomonda markazga qarab)
    final barPaint = Paint()..color = _blue;
    final barWidth = size.width * 0.46;
    final barHeight = strokeWidth * 0.62;
    canvas.drawRect(
      Rect.fromLTWH(
        center.dx - barWidth * 0.06,
        center.dy - barHeight / 2,
        barWidth,
        barHeight,
      ),
      barPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
