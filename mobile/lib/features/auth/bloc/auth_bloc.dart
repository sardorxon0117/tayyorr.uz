import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../data/auth_repository.dart';
import '../data/user_model.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this._repo) : super(const AuthState()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginRequested>(_onLogin);
    on<AuthGoogleSignInRequested>(_onGoogleSignIn);
    on<AuthOnboardingCompleted>(_onOnboardingCompleted);
    on<AuthLoggedOut>(_onLoggedOut);
    on<AuthMeRefreshRequested>(_onRefresh);
  }

  final AuthRepository _repo;

  AuthStatus _statusFor(UserModel user) =>
      user.needsOnboarding ? AuthStatus.onboarding : AuthStatus.authenticated;

  Future<void> _onStarted(AuthStarted event, Emitter<AuthState> emit) async {
    final user = await _repo.tryRestoreSession();
    // Shu orada foydalanuvchi allaqachon kirgan/ro'yxatdan o'tgan bo'lishi
    // mumkin (sekin tokenni o'qish tugaguncha) — bu holda eski natijani
    // qo'llamaymiz, aks holda yangi sessiyani ustidan bosib qo'yamiz.
    if (state.status != AuthStatus.unknown) return;
    emit(user != null
        ? state.copyWith(status: _statusFor(user), user: user)
        : state.copyWith(status: AuthStatus.unauthenticated));
  }

  Future<void> _onLogin(
      AuthLoginRequested event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.authenticating, clearError: true));
    try {
      final user =
          await _repo.login(login: event.login, password: event.password);
      emit(state.copyWith(status: _statusFor(user), user: user));
    } on ApiException catch (e) {
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.message,
      ));
    }
  }

  Future<void> _onGoogleSignIn(
      AuthGoogleSignInRequested event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.authenticating, clearError: true));
    try {
      final user = await _repo.signInWithGoogle();
      if (user == null) {
        // Foydalanuvchi hisob tanlashni bekor qildi — xatosiz avvalgi holatga.
        emit(state.copyWith(status: AuthStatus.unauthenticated));
        return;
      }
      emit(state.copyWith(status: _statusFor(user), user: user));
    } on ApiException catch (e) {
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.message,
      ));
    }
  }

  Future<void> _onOnboardingCompleted(
      AuthOnboardingCompleted event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.authenticating, clearError: true));
    try {
      final user = await _repo.completeOnboarding(
        role: event.role,
        firstName: event.firstName,
        lastName: event.lastName,
        login: event.login,
        password: event.password,
        about: event.about,
      );
      emit(state.copyWith(status: AuthStatus.authenticated, user: user));
    } on ApiException catch (e) {
      emit(state.copyWith(
        status: AuthStatus.onboarding,
        error: e.message,
      ));
    }
  }

  Future<void> _onLoggedOut(
      AuthLoggedOut event, Emitter<AuthState> emit) async {
    await _repo.logout();
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  Future<void> _onRefresh(
      AuthMeRefreshRequested event, Emitter<AuthState> emit) async {
    try {
      final user = await _repo.refreshMe();
      emit(state.copyWith(user: user));
    } catch (_) {
      // jim — vaqtinchalik tarmoq xatosi bo'lishi mumkin, sessiyani uzmaymiz
    }
  }
}
