import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({Key? key}) : super(key: key);

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with TickerProviderStateMixin {
  late AnimationController _iconController;
  late AnimationController _titleController;
  late AnimationController _subtitleController;
  late AnimationController _button1Controller;

  late Animation<double> _iconAnimation;
  late Animation<double> _titleAnimation;
  late Animation<double> _subtitleAnimation;
  late Animation<double> _button1Animation;

  @override
  void initState() {
    super.initState();

    // Initialize animation controllers with durations
    _iconController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _titleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _subtitleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _button1Controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    // Create fade-in animations
    _iconAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _iconController, curve: Curves.easeIn),
    );

    _titleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _titleController, curve: Curves.easeIn),
    );

    _subtitleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _subtitleController, curve: Curves.easeIn),
    );

    _button1Animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _button1Controller, curve: Curves.easeIn),
    );

    // Start animations with staggered delays
    _startAnimations();
  }

  void _startAnimations() async {
    await Future.delayed(const Duration(milliseconds: 100));
    _iconController.forward();

    await Future.delayed(const Duration(milliseconds: 200));
    _titleController.forward();

    await Future.delayed(const Duration(milliseconds: 200));
    _subtitleController.forward();

    await Future.delayed(const Duration(milliseconds: 300));
    _button1Controller.forward();
  }

  @override
  void dispose() {
    _iconController.dispose();
    _titleController.dispose();
    _subtitleController.dispose();
    _button1Controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final minHeight = (mediaQuery.size.height -
                      mediaQuery.padding.top -
                      mediaQuery.padding.bottom - 48)
                      .clamp(0.0, double.infinity);
    
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: minHeight,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FadeTransition(
                    opacity: _iconAnimation,
                    child: const Icon(
                      Icons.security,
                      size: 80,
                      color: Color(0xFF1E3A8A),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FadeTransition(
                    opacity: _titleAnimation,
                    child: const Text(
                      'WhistlePro',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FadeTransition(
                    opacity: _subtitleAnimation,
                    child: const Text(
                      'Report Tax Evasion Anonymously',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  FadeTransition(
                    opacity: _button1Animation,
                    child: ElevatedButton(
                      onPressed: () => context.go('/report'),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 56),
                      ),
                      child: const Text('Submit Report'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
