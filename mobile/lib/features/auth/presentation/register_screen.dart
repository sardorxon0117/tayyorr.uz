import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../../home/home_shell.dart';
import '../bloc/auth_bloc.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _login = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _about = TextEditingController();
  String _role = 'ORDERER';

  @override
  void dispose() {
    for (final c in [_firstName, _lastName, _login, _email, _password, _about]) {
      c.dispose();
    }
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    // ignore: avoid_print
    print('DEBUG RegisterScreen submit, bloc=${identityHashCode(context.read<AuthBloc>())}');
    context.read<AuthBloc>().add(
          AuthRegisterRequested(
            role: _role,
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            login: _login.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            about: _about.text.trim(),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
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
                Text("Ro'yxatdan o'tish", style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 4),
                const Text(
                  "Bir necha maydonni to'ldiring — shu bilan tamom.",
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const SizedBox(height: 20),
                GlassCard(
                  padding: const EdgeInsets.all(20),
                  child: BlocConsumer<AuthBloc, AuthState>(
                    listenWhen: (p, c) =>
                        (c.error != null && c.error != p.error) ||
                        c.status == AuthStatus.authenticated,
                    listener: (context, state) {
                      if (state.status == AuthStatus.authenticated) {
                        // _RootGate'ning reaktiv qayta chizilishiga
                        // tayanmaymiz (push qilingan sahifa ostida u bilan
                        // poyga holati yuzaga kelishi mumkin) — shu o'rniga
                        // butun navigatsiya stekini to'g'ridan-to'g'ri
                        // HomeShell bilan almashtiramiz.
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(builder: (_) => const HomeShell()),
                          (route) => false,
                        );
                        return;
                      }
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
                            label: 'Email',
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: const [AutofillHints.email],
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
                          const SizedBox(height: 20),
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
                                : const Text("Hisob yaratish"),
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
