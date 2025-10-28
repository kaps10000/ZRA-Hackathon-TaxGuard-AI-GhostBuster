import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../core/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final String _baseUrl = AppConstants.baseUrl + AppConstants.apiVersion;

  // Health Check
  Future<bool> checkHealth() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.healthCheckEndpoint}'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'healthy';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Submit Report
  Future<Map<String, dynamic>> submitReport(Map<String, dynamic> reportData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl${AppConstants.submitReportEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(reportData),
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Handle different possible response structures
        dynamic data = jsonResponse['data'] ?? jsonResponse;
        String? caseId;
        String? blockchainHash;

        // Try to extract case_id from different possible structures
        if (data is Map) {
          caseId = data['case_id']?.toString() ??
                   data['caseId']?.toString() ??
                   data['id']?.toString();
          blockchainHash = data['blockchain_hash']?.toString() ??
                          data['blockchainHash']?.toString();
        }

        return {
          'success': true,
          'caseId': caseId ?? 'Unknown',
          'message': jsonResponse['message']?.toString() ?? 'Report submitted successfully',
          'blockchainHash': blockchainHash ?? '',
        };
      } else {
        // Handle error responses
        String errorMessage = 'Failed to submit report';
        dynamic errorDetails;

        if (jsonResponse is Map) {
          // Check if 'error' is a string or an object
          var error = jsonResponse['error'];
          if (error is String) {
            errorMessage = error;
          } else if (error is Map) {
            errorMessage = error['message']?.toString() ?? errorMessage;
            errorDetails = error['details'];
          }

          // Also check for direct 'message' field
          if (jsonResponse['message'] != null) {
            errorMessage = jsonResponse['message'].toString();
          }

          // Check for 'code' field
          if (jsonResponse['code'] != null) {
            errorDetails = jsonResponse['code'];
          }
        }

        return {
          'success': false,
          'message': errorMessage,
          'details': errorDetails,
        };
      }
    } on SocketException {
      return {
        'success': false,
        'message': 'No internet connection. Please check your network.',
      };
    } on FormatException catch (e) {
      return {
        'success': false,
        'message': 'Invalid response format from server: $e',
      };
    } catch (e) {
      print('Error in submitReport: $e');
      return {
        'success': false,
        'message': 'An error occurred: $e',
      };
    }
  }

}
