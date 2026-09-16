import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/storage/local_storage.dart';
import 'user_model.dart';

class AuthRepository {
  final _api = ApiClient.instance;
  final _storage = LocalStorage.instance;
  final _google = GoogleSignIn(
    serverClientId: kGoogleServerClientId,
    scopes: const ['email'],
  );

  Future<UserModel> login({
    required String login,
    required String password,
  }) async {
    final res = await _api.post('/mobile/auth/login', data: {
      'login': login,
      'password': password,
    });
    await _storage.saveToken(res['token'] as String);
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<UserModel> register({
    required String role,
    required String firstName,
    required String lastName,
    required String login,
    required String email,
    required String password,
    required String about,
  }) async {
    final res = await _api.post('/mobile/auth/register', data: {
      'role': role,
      'acceptTerms': true,
      'firstName': firstName,
      'lastName': lastName,
      'login': login,
      'email': email,
      'password': password,
      'about': about,
    });
    await _storage.saveToken(res['token'] as String);
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  /// Google orqali kirish/ro'yxatdan o'tish. Foydalanuvchi hisob tanlashni
  /// bekor qilsa `null` qaytaradi (xato emas).
  Future<UserModel?> signInWithGoogle() async {
    final account = await _google.signIn();
    if (account == null) return null;

    final googleAuth = await account.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw ApiException("Google'dan token olinmadi — qayta urinib ko'ring");
    }

    final res = await _api.post('/mobile/auth/google', data: {
      'idToken': idToken,
    });
    await _storage.saveToken(res['token'] as String);
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  /// Google bilan birinchi marta kirgan foydalanuvchi uchun profilni
  /// tugallash (rol, login, parol).
  Future<UserModel> completeOnboarding({
    required String role,
    required String firstName,
    required String lastName,
    required String login,
    required String password,
    required String about,
  }) async {
    final res = await _api.post('/mobile/onboarding', data: {
      'role': role,
      'acceptTerms': true,
      'firstName': firstName,
      'lastName': lastName,
      'login': login,
      'password': password,
      'about': about,
    });
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<UserModel?> tryRestoreSession() async {
    final token = await _storage.readToken();
    if (token == null) return null;
    try {
      final res = await _api.get('/mobile/me');
      return UserModel.fromJson(res['user'] as Map<String, dynamic>);
    } catch (_) {
      await _storage.clearToken();
      return null;
    }
  }

  Future<UserModel> refreshMe() async {
    final res = await _api.get('/mobile/me');
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _storage.clearToken();
    try {
      await _google.signOut();
    } catch (_) {
      // jim — Google sessiyasi bo'lmasligi mumkin
    }
  }
}
