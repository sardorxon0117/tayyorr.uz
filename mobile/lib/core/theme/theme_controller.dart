import 'package:flutter/foundation.dart';

import '../network/api_client.dart';
import '../storage/local_storage.dart';

/// Yorug'/qorong'i rejimni butun ilova bo'ylab boshqaradi. Hisobda
/// saqlanadi (server — barcha qurilmalarda bir xil bo'lishi uchun),
/// lekin ilova ochilganda darhol to'g'ri ko'rinish uchun avval mahalliy
/// keshdagi qiymat ishlatiladi.
class ThemeController extends ChangeNotifier {
  ThemeController._();
  static final ThemeController instance = ThemeController._();

  bool _isLight = false;
  bool get isLight => _isLight;

  /// Ilova ishga tushganda — mahalliy keshdan darhol o'qiydi.
  void loadCached() {
    final cached = LocalStorage.instance.cachedTheme;
    if (cached == 'light') {
      _isLight = true;
    }
  }

  /// Serverdan (login/`/mobile/me` javobidan) kelgan qiymat bilan sinxronlaydi.
  void syncFromServer(String? theme) {
    final light = theme == 'light';
    if (light != _isLight) {
      _isLight = light;
      notifyListeners();
    }
    LocalStorage.instance.setCachedTheme(light ? 'light' : 'dark');
  }

  Future<void> setLight(bool light) async {
    if (light == _isLight) return;
    _isLight = light;
    notifyListeners();
    await LocalStorage.instance.setCachedTheme(light ? 'light' : 'dark');
    try {
      await ApiClient.instance.post('/mobile/me/theme', data: {'theme': light ? 'light' : 'dark'});
    } catch (_) {
      // jim — internet uzilib qolsa ham mahalliy tanlov saqlanadi
    }
  }
}
