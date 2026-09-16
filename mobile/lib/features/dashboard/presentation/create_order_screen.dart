import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../data/order_model.dart';
import '../data/orders_repository.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _budget = TextEditingController();
  final _repo = OrdersRepository();
  String _type = 'OTHER';
  DateTime? _deadline;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _budget.dispose();
    super.dispose();
  }

  Future<void> _pickDeadline() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 3)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.indigo,
            surface: AppColors.surface,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _deadline = picked);
  }

  Future<void> _submit() async {
    if (_title.text.trim().length < 5) {
      setState(() => _error = "Nomi kamida 5 ta belgidan iborat bo'lsin");
      return;
    }
    if (_description.text.trim().length < 10) {
      setState(() => _error = "Tavsif kamida 10 ta belgidan iborat bo'lsin");
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _repo.createOrder(
        title: _title.text.trim(),
        type: _type,
        description: _description.text.trim(),
        budget: _budget.text.trim().isEmpty ? null : int.tryParse(_budget.text.trim()),
        deadline: _deadline,
      );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                    ),
                  ],
                ),
                Text('Buyurtma yaratish', style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 4),
                const Text(
                  'Ish shartini yozing — tayyorlovchilar taklif yuboradi.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const SizedBox(height: 20),
                GlassCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppTextField(label: 'Nomi', controller: _title),
                      const SizedBox(height: 14),
                      const Text('Turi', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: kOrderTypeLabel.entries.map((e) {
                          final selected = _type == e.key;
                          return GestureDetector(
                            onTap: () => setState(() => _type = e.key),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 160),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                              decoration: BoxDecoration(
                                color: selected
                                    ? AppColors.indigo.withValues(alpha: 0.2)
                                    : Colors.white.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: selected ? AppColors.indigo : AppColors.cardBorder,
                                ),
                              ),
                              child: Text(
                                e.value,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: selected ? Colors.white : AppColors.textSecondary,
                                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 14),
                      AppTextField(label: 'Tavsif', controller: _description, maxLines: 5),
                      const SizedBox(height: 14),
                      AppTextField(
                        label: "Byudjet, so'm (ixtiyoriy)",
                        controller: _budget,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 14),
                      GestureDetector(
                        onTap: _pickDeadline,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.04),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.textMuted),
                              const SizedBox(width: 10),
                              Text(
                                _deadline != null
                                    ? '${_deadline!.day}.${_deadline!.month}.${_deadline!.year}'
                                    : 'Muddat (ixtiyoriy)',
                                style: TextStyle(
                                  color: _deadline != null ? Colors.white : AppColors.textMuted,
                                  fontSize: 13.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12.5)),
                      ],
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _busy ? null : _submit,
                        child: _busy
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.black54),
                              )
                            : const Text('E\'lon qilish'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
