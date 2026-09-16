import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../bloc/auth_bloc.dart';

/// Google bilan birinchi marta kirgan (lekin hali rol/login tanlamagan)
/// foydalanuvchi uchun profilni tugallash sahifasi.
class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _login = TextEditingController();
  final _password = TextEditingController();
  final _about = TextEditingController();
  String _role = 'ORDERER';
  bool _acceptTerms = false;

  @override
  void dispose() {
    for (final c in [_firstName, _lastName, _login, _password, _about]) {
      c.dispose();
    }
    super.dispose();
  }

  void _submit() {
    if (!_acceptTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Oferta shartlariga rozilik bering")),
      );
      return;
    }
    FocusScope.of(context).unfocus();
    context.read<AuthBloc>().add(
          AuthOnboardingCompleted(
            role: _role,
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            login: _login.text.trim(),
            password: _password.text,
            about: _about.text.trim(),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.select((AuthBloc b) => b.state.user);
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () =>
                          context.read<AuthBloc>().add(const AuthLoggedOut()),
                      child: const Text('Chiqish'),
                    ),
                  ],
                ),
                Text('Profilni tugallang',
                    style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 4),
                Text(
                  user?.email != null
                      ? "${user!.email} bilan kirdingiz — davom etish uchun quyidagilarni to'ldiring."
                      : "Davom etish uchun quyidagilarni to'ldiring.",
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const SizedBox(height: 20),
                GlassCard(
                  padding: const EdgeInsets.all(20),
                  child: BlocConsumer<AuthBloc, AuthState>(
                    // Navigatsiya (muvaffaqiyatli yakunlangandan keyin) endi
                    // markazlashtirilgan — qara: app.dart'dagi BlocListener.
                    listenWhen: (p, c) => c.error != null && c.error != p.error,
                    listener: (context, state) {
                      if (state.error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(state.error!),
                            backgroundColor: AppColors.red.withValues(alpha: 0.9),
                          ),
                        );
                      }
                    },
                    builder: (context, state) {
                      final busy = state.status == AuthStatus.authenticating;
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('Kim sifatida?',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: _RoleChip(
                                  label: 'Buyurtma beruvchi',
                                  selected: _role == 'ORDERER',
                                  onTap: () => setState(() => _role = 'ORDERER'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _RoleChip(
                                  label: 'Tayyorlovchi',
                                  selected: _role == 'PREPARER',
                                  onTap: () => setState(() => _role = 'PREPARER'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: AppTextField(label: 'Ism', controller: _firstName),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: AppTextField(label: 'Familiya', controller: _lastName),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          AppTextField(
                            label: 'Login',
                            controller: _login,
                            keyboardType: TextInputType.text,
                          ),
                          const SizedBox(height: 14),
                          AppTextField(
                            label: 'Parol',
                            controller: _password,
                            obscureText: true,
                            autofillHints: const [AutofillHints.newPassword],
                          ),
                          const SizedBox(height: 14),
                          AppTextField(
                            label: "O'zingiz haqingizda",
                            controller: _about,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 14),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Checkbox(
                                value: _acceptTerms,
                                onChanged: (v) =>
                                    setState(() => _acceptTerms = v ?? false),
                              ),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(
                                    "Ommaviy oferta shartlariga roziman",
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ElevatedButton(
                            onPressed: busy ? null : _submit,
                            child: busy
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.4,
                                      color: Colors.black54,
                                    ),
                                  )
                                : const Text("Davom etish"),
                          ),
                        ],
                      );
                    },
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

class _RoleChip extends StatelessWidget {
  const _RoleChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? AppColors.indigo.withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.indigo : AppColors.cardBorder,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
