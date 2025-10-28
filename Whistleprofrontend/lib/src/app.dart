import 'package:flutter/material.dart';
import 'core/theme.dart';
import 'router.dart';

class WhistleProApp extends StatelessWidget {
  const WhistleProApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'WhistlePro',
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
