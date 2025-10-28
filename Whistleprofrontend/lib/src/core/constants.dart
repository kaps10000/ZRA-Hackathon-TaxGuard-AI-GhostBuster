// App Constants
class AppConstants {
  // App Info
  static const String appName = 'ZRA WhistlePro';
  static const String appTagline = 'Zambia Revenue Authority - Confidential Reporting System';
  static const String organizationName = 'Zambia Revenue Authority';
  static const String organizationWebsite = 'www.zra.org.zm';

  // API Configuration
  static const String baseUrl = 'http://172.16.200.136:4000'; // Your WiFi IP for phone access
  static const String apiVersion = '/api';

  // API Endpoints
  static const String submitReportEndpoint = '/reports';
  static const String loginEndpoint = '/auth/login';
  static const String getReportsEndpoint = '/reports';
  static const String healthCheckEndpoint = '/health';

  // Report Categories (matching backend)

  static const List<String> reportCategories = [
    'tax_evasion',
    'fraud',
    'corruption',
    'phantom_employees',
    'ghost_companies',
    'money_laundering',
    'bribery',
    'other',
  ];

  // Report Category Display Names
  static const Map<String, String> categoryDisplayNames = {
    'tax_evasion': 'Tax Evasion',
    'fraud': 'Fraud',
    'corruption': 'Corruption',
    'phantom_employees': 'Phantom Employees',
    'ghost_companies': 'Ghost Companies',
    'money_laundering': 'Money Laundering',
    'bribery': 'Bribery',
    'other': 'Other',
  };

  // Priority Levels
  static const List<String> priorityLevels = [
    'low',
    'medium',
    'high',
    'critical',
  ];

  // Case Status
  static const String statusPending = 'pending';
  static const String statusUnderReview = 'under_review';
  static const String statusInvestigating = 'investigating';
  static const String statusClosed = 'closed';

  // Validation
  static const int minTitleLength = 10;
  static const int maxTitleLength = 200;
  static const int minDescriptionLength = 50;
  static const int maxDescriptionLength = 5000;

  // UI
  static const double defaultPadding = 16.0;
  static const double borderRadius = 12.0;
  static const double buttonHeight = 56.0;

  // Secure Storage Keys
  static const String encryptionKeyKey = 'whistlepro_encryption_key';
  static const String caseIdKey = 'whistlepro_case_id';
}

// Route Names
class Routes {
  static const String welcome = '/';
  static const String report = '/report';
}
