import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/app_drawer.dart';
import '../../../widgets/app_header_sliver.dart';
import '../../../widgets/glass_card.dart';
import '../../../widgets/user_avatar.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/data/auth_repository.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _repo = AuthRepository();
  bool _togglingAvailability = false;

  Future<void> _toggleAvailability() async {
    setState(() => _togglingAvailability = true);
    try {
      await _repo.toggleAvailability();
      if (mounted) context.read<AuthBloc>().add(const AuthMeRefreshRequested());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("O'zgartirib bo'lmadi — qayta urinib ko'ring")),
        );
      }
    } finally {
      if (mounted) setState(() => _togglingAvailability = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      drawer: const AppDrawer(),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final user = state.user;
          return CustomScrollView(
            slivers: [
              const AppHeaderSliver(),
              if (user == null)
                const SliverToBoxAdapter(child: SizedBox.shrink())
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      GlassCard(
                        blur: false,
                        child: Row(
                          children: [
                            UserAvatar(imageUrl: user.image, initial: _initial(user.displayName), size: 58),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user.displayName,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '@${user.login ?? "—"} · ${user.roleLabel}',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                              ),
                              icon: const Icon(Icons.edit_outlined, color: AppColors.textSecondary, size: 20),
                            ),
                          ],
                        ),
                      ),
                      if (user.isPreparer) ...[
                        const SizedBox(height: 10),
                        GlassCard(
                          blur: false,
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      user.isAvailable ? 'Bo\'sh — buyurtma qabul qilyapsiz' : 'Band — ko\'rinmaysiz',
                                      style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text('Holatingizni bir bosishda yangilang',
                                        style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                                  ],
                                ),
                              ),
                              _togglingAvailability
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2.2, color: AppColors.indigo),
                                    )
                                  : Switch(
                                      value: user.isAvailable,
                                      activeThumbColor: AppColors.emerald,
                                      onChanged: (_) => _toggleAvailability(),
                                    ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(child: _StatCard(label: 'Balans', value: formatSom(user.balance))),
                          if (user.isPreparer) ...[
                            const SizedBox(width: 10),
                            Expanded(child: _StatCard(label: 'Star', value: '${user.starBalance} ⭐')),
                          ],
                        ],
                      ),
                      if (user.isPreparer) ...[
                        const SizedBox(height: 10),
                        _StatCard(
                          label: 'Reyting',
                          value: user.rating != null
                              ? '${user.rating!.toStringAsFixed(1)} · ${user.ratingCount} baho'
                              : "Hali baho yo'q",
                        ),
                      ],
                      if ((user.walletCode ?? '').isNotEmpty) ...[
                        const SizedBox(height: 10),
                        _StatCard(label: 'Hisob kodi', value: user.walletCode!),
                      ],
                      const SizedBox(height: 10),
                      if ((user.about ?? '').isNotEmpty)
                        GlassCard(
                          blur: false,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("O'zi haqida",
                                  style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                              const SizedBox(height: 6),
                              Text(user.about!,
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4)),
                            ],
                          ),
                        ),
                      const SizedBox(height: 24),
                      OutlinedButton(
                        onPressed: () => context.read<AuthBloc>().add(const AuthLoggedOut()),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.red,
                          side: const BorderSide(color: Color(0x33F87171)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('Chiqish'),
                      ),
                    ]),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      blur: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

String _initial(String name) {
  final clean = name.replaceFirst('@', '').trim();
  return clean.isEmpty ? '?' : clean.substring(0, 1).toUpperCase();
}
