import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/app_logo.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/google_logo.dart';
import '../bloc/auth_bloc.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _login = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _login.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    context.read<AuthBloc>().add(
          AuthLoginRequested(
            login: _login.text.trim(),
            password: _password.text,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: AppLogo(height: 30)),
                    const SizedBox(height: 28),
                    GlassCard(
                      padding: const EdgeInsets.all(22),
                      child: BlocConsumer<AuthBloc, AuthState>(
                        // Navigatsiya (muvaffaqiyatli kirishdan keyin) endi
                        // markazlashtirilgan — qara: app.dart'dagi
                        // BlocListener. Bu yerda faqat xatoni ko'rsatamiz.
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
                              Text('Kirish', style: Theme.of(context).textTheme.headlineMedium),
                              const SizedBox(height: 4),
                              const Text(
                                'Login va parolingiz bilan kiring.',
                                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                              ),
                              const SizedBox(height: 20),
                              AppTextField(
                                label: 'Login',
                                controller: _login,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.username],
                              ),
                              const SizedBox(height: 14),
                              AppTextField(
                                label: 'Parol',
                                controller: _password,
                                obscureText: true,
                                textInputAction: TextInputAction.done,
                                autofillHints: const [AutofillHints.password],
                              ),
                              const SizedBox(height: 22),
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
                                    : const Text('Kirish'),
                              ),
                              const SizedBox(height: 18),
                              Row(
                                children: [
                                  const Expanded(child: Divider(color: AppColors.cardBorder)),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 10),
                                    child: Text('yoki',
                                        style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                  ),
                                  const Expanded(child: Divider(color: AppColors.cardBorder)),
                                ],
                              ),
                              const SizedBox(height: 18),
                              OutlinedButton(
                                onPressed: busy
                                    ? null
                                    : () => context
                                        .read<AuthBloc>()
                                        .add(const AuthGoogleSignInRequested()),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: AppColors.cardBorder),
                                  padding: const EdgeInsets.symmetric(vertical: 13),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const GoogleLogo(size: 18),
                                    const SizedBox(width: 10),
                                    Text('Google bilan kirish',
                                        style: TextStyle(color: Colors.white.withValues(alpha: 0.9))),
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Saytdagi kabi — ro'yxatdan o'tish faqat Google orqali
                    // (email tasdiqlangan bo'lishi shart, shuning uchun
                    // alohida login/parol bilan ro'yxatdan o'tish yo'q).
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Hisobingiz yo'qmi?",
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13.5),
                        ),
                        TextButton(
                          onPressed: () => context
                              .read<AuthBloc>()
                              .add(const AuthGoogleSignInRequested()),
                          child: const Text("Google bilan ro'yxatdan o'tish"),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

