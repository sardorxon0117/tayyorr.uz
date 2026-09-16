import '../../../core/network/api_client.dart';
import 'message_model.dart';

class MessagesRepository {
  final _api = ApiClient.instance;

  Future<List<ConversationModel>> fetchConversations() async {
    final res = await _api.get('/mobile/messages');
    final list = (res['conversations'] as List).cast<Map<String, dynamic>>();
    return list.map(ConversationModel.fromJson).toList();
  }

  Future<(ChatOtherUser?, List<ChatMessageModel>)> fetchConversation(
    String id, {
    int? since,
  }) async {
    final res = await _api.get('/mobile/messages/$id', query: since != null ? {'since': since} : null);
    final other = res['other'] != null ? ChatOtherUser.fromJson(res['other'] as Map<String, dynamic>) : null;
    final messages = (res['messages'] as List)
        .cast<Map<String, dynamic>>()
        .map(ChatMessageModel.fromJson)
        .toList();
    return (other, messages);
  }

  Future<ChatMessageModel> sendMessage(String conversationId, String body) async {
    final res = await _api.post('/mobile/messages/$conversationId', data: {'body': body});
    return ChatMessageModel.fromJson(res['message'] as Map<String, dynamic>);
  }

  Future<void> markRead(String conversationId) async {
    await _api.post('/mobile/messages/$conversationId/read');
  }
}
