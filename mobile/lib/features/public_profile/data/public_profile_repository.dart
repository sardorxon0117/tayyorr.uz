import '../../../core/network/api_client.dart';
import 'public_profile_model.dart';

class PublicProfileRepository {
  final _api = ApiClient.instance;

  Future<PublicProfileModel> fetch(String userId) async {
    final res = await _api.get('/mobile/users/$userId');
    return PublicProfileModel.fromJson(res['user'] as Map<String, dynamic>);
  }
}
