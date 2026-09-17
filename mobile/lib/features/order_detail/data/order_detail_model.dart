class OrderPartyModel {
  final String id;
  final String? name;
  final String? login;
  final String? image;

  const OrderPartyModel({required this.id, this.name, this.login, this.image});

  factory OrderPartyModel.fromJson(Map<String, dynamic> json) {
    return OrderPartyModel(
      id: json['id'] as String,
      name: json['name'] as String?,
      login: json['login'] as String?,
      image: (json['avatarUrl'] as String?) ?? (json['image'] as String?),
    );
  }

  String get displayName {
    if ((name ?? '').isNotEmpty) return name!;
    if (login != null) return '@$login';
    return 'Foydalanuvchi';
  }
}

class OrderOfferModel {
  final String id;
  final int price;
  final String? message;
  final String status;
  final DateTime createdAt;
  final OrderPartyModel preparer;
  final bool preparerAvailable;
  final double? preparerRating;
  final int preparerRatingCount;

  const OrderOfferModel({
    required this.id,
    required this.price,
    this.message,
    required this.status,
    required this.createdAt,
    required this.preparer,
    required this.preparerAvailable,
    this.preparerRating,
    required this.preparerRatingCount,
  });

  factory OrderOfferModel.fromJson(Map<String, dynamic> json) {
    final p = json['preparer'] as Map<String, dynamic>;
    return OrderOfferModel(
      id: json['id'] as String,
      price: (json['price'] as num).toInt(),
      message: json['message'] as String?,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      preparer: OrderPartyModel(id: p['id'] as String, name: p['name'] as String?, login: p['login'] as String?, image: p['image'] as String?),
      preparerAvailable: p['isAvailable'] as bool? ?? true,
      preparerRating: (p['rating'] as num?)?.toDouble(),
      preparerRatingCount: (p['ratingCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class OrderDetailModel {
  final String id;
  final String title;
  final String description;
  final String type;
  final String status;
  final int? budget;
  final DateTime? deadline;
  final DateTime createdAt;
  final bool deleted;
  final OrderPartyModel orderer;
  final OrderPartyModel? preparer;
  final List<OrderOfferModel> offers;

  const OrderDetailModel({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.status,
    this.budget,
    this.deadline,
    required this.createdAt,
    required this.deleted,
    required this.orderer,
    this.preparer,
    required this.offers,
  });

  factory OrderDetailModel.fromJson(Map<String, dynamic> json) {
    return OrderDetailModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      type: json['type'] as String,
      status: json['status'] as String,
      budget: (json['budget'] as num?)?.toInt(),
      deadline: json['deadline'] != null ? DateTime.parse(json['deadline'] as String) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      deleted: json['deletedAt'] != null,
      orderer: OrderPartyModel.fromJson(json['orderer'] as Map<String, dynamic>),
      preparer: json['preparer'] != null ? OrderPartyModel.fromJson(json['preparer'] as Map<String, dynamic>) : null,
      offers: (json['offers'] as List).cast<Map<String, dynamic>>().map(OrderOfferModel.fromJson).toList(),
    );
  }
}
