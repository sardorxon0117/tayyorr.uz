import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Token — xavfsiz (shifrlangan) saqlashda; oddiy bayroqlar (masalan
/// "tanishtiruvni ko'rdimi") — Hive'da, chunki ular sir emas.
class LocalStorage {
  LocalStorage._();
  static final LocalStorage instance = LocalStorage._();

  static const _tokenKey = 'auth_token';
  static const _flagsBox = 'flags';
  static const _seenOnboardingKey = 'seen_onboarding';
  static const _themeKey = 'theme';

  final _secure = const FlutterSecureStorage();
  Box? _box;

  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_flagsBox);
  }

  Future<void> saveToken(String token) => _secure.write(key: _tokenKey, value: token);
  Future<String?> readToken() => _secure.read(key: _tokenKey);
  Future<void> clearToken() => _secure.delete(key: _tokenKey);

  bool get hasSeenOnboarding => _box?.get(_seenOnboardingKey, defaultValue: false) as bool;
  Future<void> setSeenOnboarding() => _box!.put(_seenOnboardingKey, true);

  /// Ilova ochilishida serverdan javob kutmasdan darhol to'g'ri mavzuni
  /// ko'rsatish uchun — oxirgi bilingan qiymat mahalliy keshda saqlanadi.
  String? get cachedTheme => _box?.get(_themeKey) as String?;
  Future<void> setCachedTheme(String theme) => _box!.put(_themeKey, theme);
}
