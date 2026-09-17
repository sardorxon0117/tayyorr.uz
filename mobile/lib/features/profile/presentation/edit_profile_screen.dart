import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/data/auth_repository.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _about;
  late final TextEditingController _login;
  final _newPassword = TextEditingController();
  final _newPassword2 = TextEditingController();
  final _repo = AuthRepository();
  bool _busy = false;
  bool _busyAccount = false;
  String? _error;
  String? _accountError;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthBloc>().state.user;
    _firstName = TextEditingController(text: user?.firstName ?? '');
    _lastName = TextEditingController(text: user?.lastName ?? '');
    _about = TextEditingController(text: user?.about ?? '');
    _login = TextEditingController(text: user?.login ?? '');
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _about.dispose();
    _login.dispose();
    _newPassword.dispose();
    _newPassword2.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_firstName.text.trim().length < 2 || _lastName.text.trim().length < 2) {
      setState(() => _error = "Ism va familiya kamida 2 ta belgidan iborat bo'lsin");
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await _repo.updateProfile(
        firstName: _firstName.text.trim(),
        lastName: _lastName.text.trim(),
        about: _about.text.trim(),
      );
      if (mounted) {
        context.read<AuthBloc>().add(const AuthMeRefreshRequested());
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitAccount() async {
    final user = context.read<AuthBloc>().state.user;
    final newLogin = _login.text.trim();
    final loginChanged = newLogin.isNotEmpty && newLogin != (user?.login ?? '');
    final wantsPasswordChange = _newPassword.text.isNotEmpty || _newPassword2.text.isNotEmpty;

    if (wantsPasswordChange) {
      if (_newPassword.text.length < 6) {
        setState(() => _accountError = "Parol kamida 6 ta belgidan iborat bo'lsin");
        return;
      }
      if (_newPassword.text != _newPassword2.text) {
        setState(() => _accountError = "Parollar mos kelmadi");
        return;
      }
    }
    if (!loginChanged && !wantsPasswordChange) {
      setState(() => _accountError = "O'zgarish yo'q");
      return;
    }

    setState(() {
      _busyAccount = true;
      _accountError = null;
    });
    try {
      await _repo.updateAccount(
        login: loginChanged ? newLogin : null,
        newPassword: wantsPasswordChange ? _newPassword.text : null,
      );
      if (mounted) {
        context.read<AuthBloc>().add(const AuthMeRefreshRequested());
        _newPassword.clear();
        _newPassword2.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saqlandi')),
        );
      }
    } on ApiException catch (e) {
      setState(() => _accountError = e.message);
    } finally {
      if (mounted) setState(() => _busyAccount = false);
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
                Text('Profilni tahrirlash', style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 20),
                GlassCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: AppTextField(label: 'Ism', controller: _firstName)),
                          const SizedBox(width: 12),
                          Expanded(child: AppTextField(label: 'Familiya', controller: _lastName)),
                        ],
                      ),
                      const SizedBox(height: 14),
                      AppTextField(label: "O'zingiz haqingizda", controller: _about, maxLines: 4),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12.5)),
                      ],
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _busy ? null : _submit,
                          child: _busy
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.black54),
                                )
                              : const Text('Saqlash'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text('Hisob sozlamalari', style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                const Text('Username va parolni bu yerdan o\'zgartirishingiz mumkin.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
                const SizedBox(height: 12),
                GlassCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppTextField(label: 'Username (login)', controller: _login),
                      const SizedBox(height: 14),
                      AppTextField(label: 'Yangi parol', controller: _newPassword, obscureText: true),
                      const SizedBox(height: 10),
                      AppTextField(label: 'Yangi parol (tasdiqlash)', controller: _newPassword2, obscureText: true),
                      const SizedBox(height: 4),
                      Text("Eski parolni kiritish shart emas.",
                          style: TextStyle(color: AppColors.textFaint, fontSize: 11.5)),
                      if (_accountError != null) ...[
                        const SizedBox(height: 12),
                        Text(_accountError!, style: const TextStyle(color: AppColors.red, fontSize: 12.5)),
                      ],
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _busyAccount ? null : _submitAccount,
                          child: _busyAccount
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.black54),
                                )
                              : const Text('Hisobni yangilash'),
                        ),
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
