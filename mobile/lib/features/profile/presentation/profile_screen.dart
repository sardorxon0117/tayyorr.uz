import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/format.dart';
import '../../../widgets/aurora_background.dart';
import '../../../widgets/glass_card.dart';
import '../../auth/bloc/auth_bloc.dart';

/// Profil rasmiga bosilganda ochiladigan mustaqil sahifa (orqaga tugmasi
/// bilan) — pastki navbardagi "Profil" bo'limidan mustaqil ishlaydi.
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
        ),
      ),
      body: const AuroraBackground(child: ProfileScreen()),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final user = state.user;
          if (user == null) return const SizedBox.shrink();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GlassCard(
                blur: false,
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white.withValues(alpha: 0.06),
                      backgroundImage:
                          user.image != null ? NetworkImage(user.image!) : null,
                      child: user.image == null
                          ? Text(
                              _initial(user.displayName),
                              style: const TextStyle(fontSize: 22, color: Colors.white),
                            )
                          : null,
                    ),
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
                  ],
                ),
              ),
              const SizedBox(height: 12),
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
              const SizedBox(height: 12),
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
