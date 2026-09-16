import '../../../core/network/api_client.dart';
import 'order_model.dart';

class OrdersRepository {
  final _api = ApiClient.instance;

  Future<List<OrderModel>> fetchOrders() async {
    final res = await _api.get('/mobile/orders');
    final list = (res['orders'] as List).cast<Map<String, dynamic>>();
    return list.map(OrderModel.fromJson).toList();
  }

  Future<void> createOrder({
    required String title,
    required String type,
    required String description,
    int? budget,
    DateTime? deadline,
  }) async {
    await _api.post('/mobile/orders', data: {
      'title': title,
      'type': type,
      'description': description,
      if (budget != null) 'budget': budget,
      if (deadline != null) 'deadline': deadline.toUtc().toIso8601String(),
    });
  }
}
