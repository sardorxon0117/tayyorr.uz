import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_text_field.dart';
import '../data/wallet_repository.dart';

const _starPrice = 2000;
const _quickAmounts = [5, 10, 25, 50];

Future<bool?> showBuyStarsSheet(BuildContext context) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _BuyStarsSheet(),
  );
}

class _BuyStarsSheet extends StatefulWidget {
  const _BuyStarsSheet();

  @override
  State<_BuyStarsSheet> createState() => _BuyStarsSheetState();
}

class _BuyStarsSheetState extends State<_BuyStarsSheet> {
  final _stars = TextEditingController();
  final _repo = WalletRepository();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _stars.dispose();
    super.dispose();
  }

  int? get _n => int.tryParse(_stars.text.trim());

  Future<void> _submit() async {
    final n = _n;
    if (n == null || n <= 0) {
      setState(() => _error = "Star sonini kiriting");
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _repo.buyStars(n);
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final n = _n;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.cardBorder)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('⭐ Yulduz sotib olish',
                style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text(
              "Buyurtmaga taklif yuborish va navbatda yuqoriga chiqish uchun kerak. 1 ⭐ = 2 000 so'm, hamyon balansingizdan yechiladi.",
              style: TextStyle(color: AppColors.textMuted, fontSize: 12.5, height: 1.4),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickAmounts.map((q) {
                return GestureDetector(
                  onTap: () => setState(() => _stars.text = q.toString()),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Text('$q ⭐', style: const TextStyle(color: Colors.white, fontSize: 12.5)),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
            AppTextField(label: 'Nechta yulduz (dona)', controller: _stars, keyboardType: TextInputType.number),
            if (n != null && n > 0) ...[
              const SizedBox(height: 6),
              Text('Narxi: ${formatSom(n * _starPrice)}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            ],
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12.5)),
            ],
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.black54),
                    )
                  : const Text('Sotib olish'),
            ),
          ],
        ),
      ),
    );
  }
}
