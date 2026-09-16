import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import 'user_model.dart';

class AuthRepository {
  final _api = ApiClient.instance;
  final _storage = LocalStorage.instance;

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

  Future<void> logout() => _storage.clearToken();
}
