class ReferredUserModel {
  final String id;
  final String? login;
  final String? name;
  final DateTime createdAt;

  const ReferredUserModel({
    required this.id,
    this.login,
    this.name,
    required this.createdAt,
  });

  factory ReferredUserModel.fromJson(Map<String, dynamic> json) {
    return ReferredUserModel(
      id: json['id'] as String,
      login: json['login'] as String?,
      name: json['name'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class ReferralModel {
  final int starBalance;
  final List<ReferredUserModel> referredUsers;

  const ReferralModel({required this.starBalance, required this.referredUsers});

  factory ReferralModel.fromJson(Map<String, dynamic> json) {
    return ReferralModel(
      starBalance: (json['starBalance'] as num).toInt(),
      referredUsers: (json['referredUsers'] as List)
          .cast<Map<String, dynamic>>()
          .map(ReferredUserModel.fromJson)
          .toList(),
    );
  }
}
