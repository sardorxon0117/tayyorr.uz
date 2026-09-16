import '../../../core/network/api_client.dart';
import 'order_model.dart';

class OrdersRepository {
  final _api = ApiClient.instance;

  Future<List<OrderModel>> fetchOrders() async {
    final res = await _api.get('/mobile/orders');
    final list = (res['orders'] as List).cast<Map<String, dynamic>>();
    return list.map(OrderModel.fromJson).toList();
  }
}
