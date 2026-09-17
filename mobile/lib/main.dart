import 'package:flutter/material.dart';

import 'app.dart';
import 'core/storage/local_storage.dart';
import 'core/theme/theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorage.instance.init();
  ThemeController.instance.loadCached();
  runApp(const TayyorrApp());
}
