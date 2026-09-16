import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_text_field.dart';
import '../data/wallet_repository.dart';

const _quickAmounts = [20000, 50000, 100000, 300000];

/// Hisobni to'ldirish uchun quyidan chiquvchi panel — Dashboard'dagi
/// qisqa hamyon kartasidan ham, Hamyon sahifasidan ham ochiladi.
Future<void> showTopUpSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _TopUpSheet(),
  );
}

class _TopUpSheet extends StatefulWidget {
  const _TopUpSheet();

  @override
  State<_TopUpSheet> createState() => _TopUpSheetState();
}

class _TopUpSheetState extends State<_TopUpSheet> {
  final _amountController = TextEditingController();
  final _repo = WalletRepository();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submit(int amount) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final payUrl = await _repo.topUp(amount);
      final uri = Uri.parse(payUrl);
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && mounted) {
        setState(() => _error = "To'lov sahifasini ochib bo'lmadi");
      } else if (mounted) {
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
            Row(
              children: [
                const Expanded(
                  child: Text(
                    "Hisobni to'ldirish",
                    style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('Click orqali',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              "Summani kiriting — Click'ning xavfsiz to'lov sahifasiga o'tasiz.",
              style: TextStyle(color: AppColors.textMuted, fontSize: 12.5),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickAmounts.map((a) {
                return GestureDetector(
                  onTap: () => _amountController.text = a.toString(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Text(formatSom(a), style: const TextStyle(color: Colors.white, fontSize: 12.5)),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: "Summa (so'm)",
              controller: _amountController,
              keyboardType: TextInputType.number,
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12.5)),
            ],
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: _busy
                  ? null
                  : () {
                      final amount = int.tryParse(_amountController.text.trim());
                      if (amount == null || amount < 1000) {
                        setState(() => _error = "Kamida 1 000 so'm kiriting");
                        return;
                      }
                      _submit(amount);
                    },
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.black54),
                    )
                  : const Text("To'lovga o'tish"),
            ),
          ],
        ),
      ),
    );
  }
}
