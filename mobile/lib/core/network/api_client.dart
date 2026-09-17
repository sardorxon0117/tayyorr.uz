import 'package:dio/dio.dart';

import '../constants.dart';
import '../storage/local_storage.dart';
import 'api_exception.dart';

/// Har bir so'rovga avtomatik "Authorization: Bearer TOKEN" qo'shadi
/// (token bo'lsa). tayyorr.uz backendi bilan gaplashadigan yagona joy.
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: kApiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        contentType: 'application/json',
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await LocalStorage.instance.readToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;

  Future<Map<String, dynamic>> get(String path,
      {Map<String, dynamic>? query}) async {
    return _unwrap(() => _dio.get(path, queryParameters: query));
  }

  Future<Map<String, dynamic>> post(String path, {Object? data}) async {
    return _unwrap(() => _dio.post(path, data: data));
  }

  Future<Map<String, dynamic>> delete(String path, {Object? data}) async {
    return _unwrap(() => _dio.delete(path, data: data));
  }

  Future<Map<String, dynamic>> patch(String path, {Object? data}) async {
    return _unwrap(() => _dio.patch(path, data: data));
  }

  Future<Map<String, dynamic>> _unwrap(
    Future<Response> Function() call,
  ) async {
    try {
      final res = await call();
      final data = res.data;
      if (data is Map<String, dynamic>) return data;
      return {'data': data};
    } on DioException catch (e) {
      final body = e.response?.data;
      final msg = (body is Map && body['error'] is String)
          ? body['error'] as String
          : _fallbackMessage(e);
      throw ApiException(msg, statusCode: e.response?.statusCode);
    }
  }

  String _fallbackMessage(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return "Internet sekin — qayta urinib ko'ring";
      case DioExceptionType.connectionError:
        return 'Internetga ulanib bo\'lmadi';
      default:
        return 'Nimadir xato ketdi';
    }
  }
}
