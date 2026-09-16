class ChatMessageModel {
  final String id;
  final String senderId;
  final String body;
  final bool system;
  final int createdAt; // epoch ms
  final int updatedAt; // epoch ms
  final bool mine;
  final bool deleted;

  const ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.body,
    required this.system,
    required this.createdAt,
    required this.updatedAt,
    required this.mine,
    required this.deleted,
  });

  DateTime get createdAtDate => DateTime.fromMillisecondsSinceEpoch(createdAt);

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      body: json['body'] as String? ?? '',
      system: json['system'] as bool? ?? false,
      createdAt: (json['createdAt'] as num).toInt(),
      updatedAt: (json['updatedAt'] as num).toInt(),
      mine: json['mine'] as bool? ?? false,
      deleted: json['deleted'] as bool? ?? false,
    );
  }
}

class ChatOtherUser {
  final String id;
  final String name;
  final String? login;
  final String? image;
  final bool isSupport;

  const ChatOtherUser({
    required this.id,
    required this.name,
    this.login,
    this.image,
    required this.isSupport,
  });

  factory ChatOtherUser.fromJson(Map<String, dynamic> json) {
    return ChatOtherUser(
      id: json['id'] as String,
      name: json['name'] as String,
      login: json['login'] as String?,
      image: json['image'] as String?,
      isSupport: json['isSupport'] as bool? ?? false,
    );
  }
}

class ConversationModel {
  final String id;
  final ChatOtherUser other;
  final String? lastMessageBody;
  final bool? lastMessageMine;
  final DateTime lastMessageAt;
  final int unread;

  const ConversationModel({
    required this.id,
    required this.other,
    this.lastMessageBody,
    this.lastMessageMine,
    required this.lastMessageAt,
    required this.unread,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final last = json['lastMessage'] as Map<String, dynamic>?;
    return ConversationModel(
      id: json['id'] as String,
      other: ChatOtherUser.fromJson(json['other'] as Map<String, dynamic>),
      lastMessageBody: last?['body'] as String?,
      lastMessageMine: last?['mine'] as bool?,
      lastMessageAt: DateTime.parse(json['lastMessageAt'] as String),
      unread: (json['unread'] as num?)?.toInt() ?? 0,
    );
  }
}
