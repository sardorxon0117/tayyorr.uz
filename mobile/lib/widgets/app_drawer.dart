import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../core/theme/app_colors.dart';
import '../core/utils/format.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/home/section_cubit.dart';
import '../features/wallet/presentation/top_up_sheet.dart';
import 'app_logo.dart';
import 'user_avatar.dart';

const _bannerHeight = 132.0;
const _avatarSize = 76.0;

/// Yopishtirilgan "cover photo" + ustma-ust chiquvchi avatar ko'rinishidagi
/// drawer — saytdagi oddiy sidebar'dan farqli, o'zgacha dizayn.
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
    final hasPhoto = (user?.image ?? '').isNotEmpty;

    return Drawer(
      backgroundColor: AppColors.surface,
      elevation: 0,
      width: 300,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(28)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.horizontal(right: Radius.circular(28)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: _bannerHeight + _avatarSize / 2,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  SizedBox(
                    height: _bannerHeight,
                    width: double.infinity,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (hasPhoto)
                          ImageFiltered(
                            imageFilter: ImageFilter.blur(sigmaX: 22, sigmaY: 22, tileMode: TileMode.decal),
                            child: Image.network(
                              user!.image!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const _BannerGradient(),
                            ),
                          )
                        else
                          const _BannerGradient(),
                        DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.15),
                                AppColors.surface,
                              ],
                            ),
                          ),
                        ),
                        Positioned(
                          top: 10,
                          left: 14,
                          child: AppLogo(height: 18),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Center(
                      child: UserAvatar(
                        imageUrl: user?.image,
                        initial: _initial(user?.displayName ?? '?'),
                        size: _avatarSize,
                        onTap: () => _go(context, AppSection.profile),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (user != null) ...[
              const SizedBox(height: 8),
              Text(user.displayName,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(user.roleLabel,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  onTap: () => _go(context, AppSection.wallet),
                  child: Row(
                    children: [
                      Expanded(
                        child: _Pill(
                          icon: Icons.account_balance_wallet_rounded,
                          label: formatSom(user.balance),
                          color: AppColors.indigo,
                        ),
                      ),
                      if (isPreparer) ...[
                        const SizedBox(width: 8),
                        Expanded(
                          child: _Pill(icon: Icons.star_rounded, label: '${user.starBalance}', color: AppColors.amber),
                        ),
                      ],
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).pop();
                          showTopUpSheet(context);
                        },
                        child: Container(
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: AppColors.indigo.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add_rounded, size: 16, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _NavItem(
                      icon: Icons.home_rounded,
                      color: AppColors.indigo,
                      label: 'Bosh sahifa',
                      selected: section == AppSection.dashboard,
                      onTap: () => _go(context, AppSection.dashboard),
                    ),
                    if (isPreparer) ...[
                      _NavItem(
                        icon: Icons.local_offer_rounded,
                        color: AppColors.violet,
                        label: 'Mening takliflarim',
                        selected: section == AppSection.offers,
                        onTap: () => _go(context, AppSection.offers),
                      ),
                      _NavItem(
                        icon: Icons.card_giftcard_rounded,
                        color: AppColors.emerald,
                        label: 'Referal',
                        selected: section == AppSection.referral,
                        onTap: () => _go(context, AppSection.referral),
                      ),
                    ],
                    _NavItem(
                      icon: Icons.chat_bubble_rounded,
                      color: AppColors.amber,
                      label: 'Xabarlar',
                      selected: section == AppSection.messages,
                      onTap: () => _go(context, AppSection.messages),
                    ),
                    _NavItem(
                      icon: Icons.account_balance_wallet_rounded,
                      color: AppColors.indigoStrong,
                      label: 'Hamyon',
                      selected: section == AppSection.wallet,
                      onTap: () => _go(context, AppSection.wallet),
                    ),
                    _NavItem(
                      icon: Icons.person_rounded,
                      color: AppColors.red,
                      label: 'Profil',
                      selected: section == AppSection.profile,
                      onTap: () => _go(context, AppSection.profile),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(color: AppColors.cardBorder, height: 1),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              child: Text('tayyorr.uz', style: TextStyle(color: AppColors.textFaint, fontSize: 11)),
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerGradient extends StatelessWidget {
  const _BannerGradient();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.indigoStrong, AppColors.violet],
        ),
      ),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.color,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 3),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? Colors.white.withValues(alpha: 0.06) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.cardBorder : Colors.transparent),
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: color.withValues(alpha: selected ? 0.28 : 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 17, color: selected ? Colors.white : color),
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.textSecondary,
                fontSize: 13.5,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
