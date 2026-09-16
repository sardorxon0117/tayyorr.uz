import 'package:intl/intl.dart';

final _somFormat = NumberFormat.decimalPattern('en');

String formatSom(int amount) =>
    "${_somFormat.format(amount).replaceAll(',', ' ')} so'm";

const _months = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyun',
  'iyul', 'avg', 'sen', 'okt', 'noy', 'dek',
];

String timeAgo(DateTime d) {
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'hozir';
  if (diff.inMinutes < 60) return "${diff.inMinutes} daq oldin";
  if (diff.inHours < 24) return "${diff.inHours} soat oldin";
  if (diff.inDays < 7) return "${diff.inDays} kun oldin";
  return '${d.day}-${_months[d.month - 1]}';
}
