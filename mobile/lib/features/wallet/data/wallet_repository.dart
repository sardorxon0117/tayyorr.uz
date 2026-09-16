import '../../../core/network/api_client.dart';
import 'wallet_model.dart';

class WalletRepository {
  final _api = ApiClient.instance;

  Future<WalletModel> fetchWallet() async {
    final res = await _api.get('/mobile/wallet');
    return WalletModel.fromJson(res);
  }

  Future<String> topUp(int amount) async {
    final res = await _api.post('/mobile/wallet/topup', data: {'amount': amount});
    return res['payUrl'] as String;
  }
}
