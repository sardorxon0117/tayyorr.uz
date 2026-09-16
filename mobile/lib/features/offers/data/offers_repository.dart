import '../../../core/network/api_client.dart';
import 'offer_model.dart';

class OffersRepository {
  final _api = ApiClient.instance;

  Future<List<OfferModel>> fetchMyOffers() async {
    final res = await _api.get('/mobile/offers/mine');
    final list = (res['offers'] as List).cast<Map<String, dynamic>>();
    return list.map(OfferModel.fromJson).toList();
  }
}
