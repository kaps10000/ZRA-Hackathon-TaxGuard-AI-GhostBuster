export type RiskLevel = "green" | "yellow" | "red";

export interface VerificationResult {
  id: string;
  invoiceNumber?: string;
  hsCode?: string;
  importerName?: string;
  declaredValue?: number;
  extractedValue?: number;
  riskScore: number;
  riskLevel: RiskLevel;
  anomalies: string[];
  blockchainTxId?: string;
  blockchainUrl?: string;
  createdAt: string; // ISO string
}

export interface UploadItem {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultId?: string;
  riskLevel?: RiskLevel;
  riskScore?: number;
  createdAt: string; // ISO
}
