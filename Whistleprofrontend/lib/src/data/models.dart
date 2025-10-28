// Report Model
class ReportModel {
  final String? id;
  final String caseId;
  final String category;
  final String description;
  final String location;
  final List<String> evidenceUrls;
  final DateTime submittedAt;
  final String status;

  ReportModel({
    this.id,
    required this.caseId,
    required this.category,
    required this.description,
    required this.location,
    required this.evidenceUrls,
    required this.submittedAt,
    this.status = 'pending',
  });

  Map<String, dynamic> toJson() {
    return {
      'case_id': caseId,
      'category': category,
      'description': description,
      'location': location,
      'evidence_urls': evidenceUrls,
      'submitted_at': submittedAt.toIso8601String(),
      'status': status,
    };
  }

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: json['id'],
      caseId: json['case_id'],
      category: json['category'],
      description: json['description'],
      location: json['location'],
      evidenceUrls: List<String>.from(json['evidence_urls'] ?? []),
      submittedAt: DateTime.parse(json['submitted_at']),
      status: json['status'] ?? 'pending',
    );
  }
}

// Case Model
class CaseModel {
  final String caseId;
  final String status;
  final String category;
  final DateTime submittedAt;
  final DateTime? lastUpdated;
  final List<CaseMessage> messages;
  final List<BlockchainEvent> auditTrail;

  CaseModel({
    required this.caseId,
    required this.status,
    required this.category,
    required this.submittedAt,
    this.lastUpdated,
    this.messages = const [],
    this.auditTrail = const [],
  });

  factory CaseModel.fromJson(Map<String, dynamic> json) {
    return CaseModel(
      caseId: json['case_id'],
      status: json['status'],
      category: json['category'],
      submittedAt: DateTime.parse(json['submitted_at']),
      lastUpdated: json['last_updated'] != null
          ? DateTime.parse(json['last_updated'])
          : null,
      messages: (json['messages'] as List?)
          ?.map((m) => CaseMessage.fromJson(m))
          .toList() ?? [],
      auditTrail: (json['audit_trail'] as List?)
          ?.map((e) => BlockchainEvent.fromJson(e))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'case_id': caseId,
      'status': status,
      'category': category,
      'submitted_at': submittedAt.toIso8601String(),
      'last_updated': lastUpdated?.toIso8601String(),
      'messages': messages.map((m) => m.toJson()).toList(),
      'audit_trail': auditTrail.map((e) => e.toJson()).toList(),
    };
  }
}

// Message Model
class CaseMessage {
  final String id;
  final String sender; // 'user' or 'zra'
  final String message;
  final DateTime timestamp;
  final bool isEncrypted;

  CaseMessage({
    required this.id,
    required this.sender,
    required this.message,
    required this.timestamp,
    this.isEncrypted = true,
  });

  factory CaseMessage.fromJson(Map<String, dynamic> json) {
    return CaseMessage(
      id: json['id'],
      sender: json['sender'],
      message: json['message'],
      timestamp: DateTime.parse(json['timestamp']),
      isEncrypted: json['is_encrypted'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender': sender,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'is_encrypted': isEncrypted,
    };
  }
}

// Blockchain Event Model
class BlockchainEvent {
  final String eventType;
  final String description;
  final DateTime timestamp;
  final String blockchainHash;

  BlockchainEvent({
    required this.eventType,
    required this.description,
    required this.timestamp,
    required this.blockchainHash,
  });

  factory BlockchainEvent.fromJson(Map<String, dynamic> json) {
    return BlockchainEvent(
      eventType: json['event_type'],
      description: json['description'],
      timestamp: DateTime.parse(json['timestamp']),
      blockchainHash: json['blockchain_hash'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'event_type': eventType,
      'description': description,
      'timestamp': timestamp.toIso8601String(),
      'blockchain_hash': blockchainHash,
    };
  }
}

// API Response Model
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final String? error;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.error,
  });

  factory ApiResponse.fromJson(
      Map<String, dynamic> json,
      T Function(dynamic)? fromJsonT,
      ) {
    return ApiResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      error: json['error'],
    );
  }
}
