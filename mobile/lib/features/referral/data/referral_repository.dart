import '../../../core/network/api_client.dart';
import 'referral_model.dart';

class ReferralRepository {
  final _api = ApiClient.instance;

  Future<ReferralModel> fetchReferral() async {
    final res = await _api.get('/mobile/referral');
    return ReferralModel.fromJson(res);
  }
}
