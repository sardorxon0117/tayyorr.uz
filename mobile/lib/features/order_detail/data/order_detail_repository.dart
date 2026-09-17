import '../../../core/network/api_client.dart';
import 'order_detail_model.dart';

class OrderDetailRepository {
  final _api = ApiClient.instance;

  Future<OrderDetailModel> fetchOrder(String id) async {
    final res = await _api.get('/mobile/orders/$id');
    return OrderDetailModel.fromJson(res['order'] as Map<String, dynamic>);
  }

  Future<void> submitOffer(String orderId, {required int price, String? message}) async {
    await _api.post('/mobile/orders/$orderId/offers', data: {
      'price': price,
      if (message != null && message.isNotEmpty) 'message': message,
    });
  }

  Future<void> respondToOffer(String offerId, {required bool accept}) async {
    await _api.patch('/mobile/offers/$offerId', data: {'action': accept ? 'ACCEPT' : 'REJECT'});
  }

  Future<void> setOrderStatus(String orderId, String status) async {
    await _api.patch('/mobile/orders/$orderId', data: {'status': status});
  }
}
