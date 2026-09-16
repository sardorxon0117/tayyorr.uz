import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../data/message_model.dart';
import '../data/messages_repository.dart';

enum ChatStatus { initial, loading, success, failure }

class ChatState extends Equatable {
  const ChatState({
    this.status = ChatStatus.initial,
    this.other,
    this.messages = const [],
    this.error,
    this.sending = false,
  });

  final ChatStatus status;
  final ChatOtherUser? other;
  final List<ChatMessageModel> messages;
  final String? error;
  final bool sending;

  ChatState copyWith({
    ChatStatus? status,
    ChatOtherUser? other,
    List<ChatMessageModel>? messages,
    String? error,
    bool? sending,
  }) {
    return ChatState(
      status: status ?? this.status,
      other: other ?? this.other,
      messages: messages ?? this.messages,
      error: error,
      sending: sending ?? this.sending,
    );
  }

  @override
  List<Object?> get props => [status, other?.id, messages.length, error, sending];
}

class ChatCubit extends Cubit<ChatState> {
  ChatCubit(this._repo, this.conversationId) : super(const ChatState());

  final MessagesRepository _repo;
  final String conversationId;
  Timer? _pollTimer;

  Future<void> load() async {
    emit(state.copyWith(status: ChatStatus.loading));
    try {
      final (other, messages) = await _repo.fetchConversation(conversationId);
      emit(state.copyWith(status: ChatStatus.success, other: other, messages: messages));
      unawaited(_repo.markRead(conversationId).catchError((_) {}));
      _startPolling();
    } on ApiException catch (e) {
      emit(state.copyWith(status: ChatStatus.failure, error: e.message));
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _poll());
  }

  Future<void> _poll() async {
    if (state.messages.isEmpty) return;
    final since = state.messages.map((m) => m.updatedAt).reduce((a, b) => a > b ? a : b);
    try {
      final (_, fresh) = await _repo.fetchConversation(conversationId, since: since);
      if (fresh.isEmpty) return;
      final merged = Map<String, ChatMessageModel>.fromEntries(
        state.messages.map((m) => MapEntry(m.id, m)),
      );
      for (final m in fresh) {
        merged[m.id] = m;
      }
      final list = merged.values.toList()..sort((a, b) => a.createdAt.compareTo(b.createdAt));
      emit(state.copyWith(messages: list));
      if (fresh.any((m) => !m.mine)) {
        unawaited(_repo.markRead(conversationId).catchError((_) {}));
      }
    } catch (_) {
      // jim — poyga vaqtida internet uzilib qolishi mumkin
    }
  }

  Future<void> send(String body) async {
    final text = body.trim();
    if (text.isEmpty) return;
    emit(state.copyWith(sending: true, error: null));
    try {
      final msg = await _repo.sendMessage(conversationId, text);
      emit(state.copyWith(sending: false, messages: [...state.messages, msg]));
    } on ApiException catch (e) {
      emit(state.copyWith(sending: false, error: e.message));
    }
  }

  @override
  Future<void> close() {
    _pollTimer?.cancel();
    return super.close();
  }
}
