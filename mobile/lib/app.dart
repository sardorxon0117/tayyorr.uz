import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/storage/local_storage.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/home/home_shell.dart';
import 'features/onboarding/onboarding_screen.dart';

class TayyorrApp extends StatelessWidget {
  const TayyorrApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AuthBloc(AuthRepository())..add(const AuthStarted()),
      child: MaterialApp(
        title: 'tayyorr.uz',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: const _RootGate(),
      ),
    );
  }
}

/// Ilova ochilganda qayerga borishni hal qiladi:
/// token bor -> Home; yo'q va tanishtiruv ko'rilmagan -> Onboarding;
/// yo'q va tanishtiruv ko'rilgan -> to'g'ridan Login.
class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        switch (state.status) {
          case AuthStatus.unknown:
            return const _SplashScreen();
          case AuthStatus.authenticated:
            return const HomeShell();
          case AuthStatus.authenticating:
          case AuthStatus.unauthenticated:
            return LocalStorage.instance.hasSeenOnboarding
                ? const LoginScreen()
                : const OnboardingScreen();
        }
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: CircularProgressIndicator(color: AppColors.indigo),
      ),
    );
  }
}
