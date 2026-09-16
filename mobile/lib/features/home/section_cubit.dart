import 'package:flutter_bloc/flutter_bloc.dart';

enum AppSection { dashboard, offers, messages, wallet, profile }

/// HomeShell ichidagi joriy bo'lim — drawer'dan tanlanadi.
class SectionCubit extends Cubit<AppSection> {
  SectionCubit() : super(AppSection.dashboard);

  void select(AppSection section) => emit(section);
}
