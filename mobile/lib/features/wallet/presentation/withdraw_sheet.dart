import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_text_field.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../data/wallet_repository.dart';

Future<bool?> showWithdrawSheet(BuildContext context, {required int balance}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _WithdrawSheet(balance: balance),
  );
}


class _WithdrawSheet extends StatefulWidget {
  const _WithdrawSheet({required this.balance});
  final int balance;

  @override
  State<_WithdrawSheet> createState() => _WithdrawSheetState();
}

class _WithdrawSheetState extends State<_WithdrawSheet> {
  final _card = TextEditingController();
  final _cardName = TextEditingController();
  final _amount = TextEditingController();
  final _repo = WalletRepository();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _card.dispose();
    _cardName.dispose();
    _amount.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final digits = _card.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 16) {
      setState(() => _error = "Karta raqami 16 raqamdan iborat bo'lsin");
      return;
    }
    final amount = int.tryParse(_amount.text.trim());
    if (amount == null || amount < 1000) {
      setState(() => _error = "Kamida 1 000 so'm kiriting");
      return;
    }
    if (amount > widget.balance) {
      setState(() => _error = "Hisobda yetarli mablag' yo'q");
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _repo.payout(amount: amount, card: digits, cardName: _cardName.text.trim());
      if (mounted) {
        context.read<AuthBloc>().add(const AuthMeRefreshRequested());
        Navigator.of(context).pop(true);
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
        child: SingleChildScrollView(
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
              const Text('Kartaga yechib olish',
                  style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(
                "Mablag' darhol hisobdan yechiladi. Mavjud: ${formatSom(widget.balance)}.",
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5),
              ),
              const SizedBox(height: 16),
              AppTextField(label: 'Karta raqami', controller: _card, keyboardType: TextInputType.number),
              const SizedBox(height: 10),
              AppTextField(label: 'Karta egasi (ixtiyoriy)', controller: _cardName),
              const SizedBox(height: 10),
              AppTextField(label: "Summa, so'm", controller: _amount, keyboardType: TextInputType.number),
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
                    : const Text('Yechib olish'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
