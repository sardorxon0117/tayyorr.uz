import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../core/theme/app_colors.dart';
import '../core/utils/format.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/data/user_model.dart';
import '../features/home/section_cubit.dart';
import '../features/wallet/presentation/top_up_sheet.dart';
import 'app_logo.dart';
import 'aurora_background.dart';
import 'user_avatar.dart';

/// Saytdagi desktop sidebar (`AppSidebar`) ko'rinishini takrorlaydi —
/// har bir bo'limdan hamburger ikonkasi orqali ochiladi.
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  void _go(BuildContext context, AppSection section) {
    context.read<SectionCubit>().select(section);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthBloc>().state.user;
    final isPreparer = user?.isPreparer ?? false;
    final section = context.watch<SectionCubit>().state;

    return Drawer(
      backgroundColor: Colors.transparent,
      elevation: 0,
      width: 300,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(28)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.horizontal(right: Radius.circular(28)),
        child: Stack(
          fit: StackFit.expand,
          children: [
            const AuroraBackground(),
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
              child: Container(color: AppColors.surface.withValues(alpha: 0.55)),
            ),
            _drawerContent(context, user, isPreparer, section),
          ],
        ),
      ),
    );
  }

  Widget _drawerContent(BuildContext context, UserModel? user, bool isPreparer, AppSection section) {
    return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                child: AppLogo(height: 20),
              ),
              const SizedBox(height: 10),
              if (user != null)
                _Tile(
                  onTap: () => _go(context, AppSection.profile),
                  selected: section == AppSection.profile,
                  child: Row(
                    children: [
                      UserAvatar(imageUrl: user.image, initial: _initial(user.displayName), size: 40),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(user.displayName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600)),
                            Text(user.roleLabel,
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              if (user != null) ...[
                const SizedBox(height: 8),
                _Tile(
                  onTap: () => _go(context, AppSection.wallet),
                  selected: section == AppSection.wallet,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Balans', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      const SizedBox(height: 2),
                      Text(formatSom(user.balance),
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                      if (isPreparer) ...[
                        const SizedBox(height: 3),
                        Text('${user.starBalance} ⭐',
                            style: const TextStyle(color: AppColors.amber, fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                      const SizedBox(height: 6),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).pop();
                          showTopUpSheet(context);
                        },
                        child: const Text("Hisobni to'ldirish →",
                            style: TextStyle(color: AppColors.indigo, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 14),
              _NavItem(
                icon: Icons.home_rounded,
                label: 'Bosh sahifa',
                selected: section == AppSection.dashboard,
                onTap: () => _go(context, AppSection.dashboard),
              ),
              if (isPreparer) ...[
                _NavItem(
                  icon: Icons.local_offer_rounded,
                  label: 'Mening takliflarim',
                  selected: section == AppSection.offers,
                  onTap: () => _go(context, AppSection.offers),
                ),
                _NavItem(
                  icon: Icons.card_giftcard_rounded,
                  label: 'Referal',
                  selected: section == AppSection.referral,
                  onTap: () => _go(context, AppSection.referral),
                ),
              ],
              _NavItem(
                icon: Icons.chat_bubble_rounded,
                label: 'Xabarlar',
                selected: section == AppSection.messages,
                onTap: () => _go(context, AppSection.messages),
              ),
              _NavItem(
                icon: Icons.account_balance_wallet_rounded,
                label: 'Hamyon',
                selected: section == AppSection.wallet,
                onTap: () => _go(context, AppSection.wallet),
              ),
              _NavItem(
                icon: Icons.person_rounded,
                label: 'Profil',
                selected: section == AppSection.profile,
                onTap: () => _go(context, AppSection.profile),
              ),
              const Spacer(),
              const Divider(color: AppColors.cardBorder, height: 1),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Text('tayyorr.uz', style: TextStyle(color: AppColors.textFaint, fontSize: 11)),
              ),
            ],
          ),
        ),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}

class _Tile extends StatelessWidget {
  const _Tile({required this.child, required this.onTap, required this.selected});
  final Widget child;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? AppColors.indigo.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.indigo.withValues(alpha: 0.4) : AppColors.cardBorder),
        ),
        child: child,
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final bool danger;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = danger ? AppColors.red : (selected ? Colors.white : AppColors.textSecondary);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
        decoration: BoxDecoration(
          color: selected ? AppColors.indigo.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 19, color: color),
            const SizedBox(width: 12),
            Text(label, style: TextStyle(color: color, fontSize: 13.5, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
