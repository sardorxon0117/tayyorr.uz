import 'package:flutter/material.dart';

import '../../core/storage/local_storage.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/aurora_background.dart';
import '../auth/presentation/login_screen.dart';

class _OnboardingPage {
  final String emoji;
  final String title;
  final String body;
  const _OnboardingPage(this.emoji, this.title, this.body);
}

const _pages = [
  _OnboardingPage(
    '👋',
    'tayyorr.uz ilovasiga xush kelibsiz',
    'Prezentatsiya, kurs ishi, referat, esse va diplom ishi — buyurtma bering yoki tayyorlab daromad qiling.',
  ),
  _OnboardingPage(
    '📝',
    'Bir marta buyurtma qoldiring',
    'Ishingiz shartlarini yozing — barcha tayyorlovchilar koʻradi. Kelgan takliflardan narx va reyting boʻyicha tanlaysiz.',
  ),
  _OnboardingPage(
    '💼',
    'Tayyorlovchimisiz? Daromad qiling',
    'Ochiq buyurtmalar lentasini real vaqtda koʻring, taklif yuboring, tanlansangiz — ishga kirishasiz.',
  ),
  _OnboardingPage(
    '🔒',
    'Xavfsiz toʻlov',
    'Mablagʹ kelishuv vaqtida hamyoningizdan bloklanadi, ish yakunlangach toʻliq (komissiyasiz) tayyorlovchiga oʻtadi.',
  ),
  _OnboardingPage(
    '🚀',
    'Boshlashga tayyormisiz?',
    'Hisob yarating yoki kiring — bir necha soniyada boshlaysiz.',
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  Future<void> _finish() async {
    await LocalStorage.instance.setSeenOnboarding();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void _next() {
    if (_index == _pages.length - 1) {
      _finish();
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _index == _pages.length - 1;
    return Scaffold(
      body: AuroraBackground(
        child: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: TextButton(
                    onPressed: _finish,
                    child: const Text("O'tkazib yuborish"),
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, i) {
                    final p = _pages[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 108,
                            height: 108,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.05),
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            alignment: Alignment.center,
                            child: Text(p.emoji, style: const TextStyle(fontSize: 44)),
                          ),
                          const SizedBox(height: 36),
                          Text(
                            p.title,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.headlineLarge,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            p.body,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 15,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_pages.length, (i) {
                        final active = i == _index;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: active ? 22 : 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: active
                                ? AppColors.indigo
                                : Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _next,
                        child: Text(isLast ? 'Boshlash' : 'Keyingisi'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
