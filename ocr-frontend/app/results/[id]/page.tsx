"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResult } from "../../../lib/api";
import type { VerificationResult } from "../../../lib/types";
import RiskBadge from "../../../components/RiskBadge";
import { QRCodeCanvas } from "qrcode.react";

export default function ResultDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await getResult(id);
        setData(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Result #{data.id}</h1>
        <RiskBadge level={data.riskLevel} score={data.riskScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-white/70 dark:bg-neutral-900/50">
          <h2 className="text-lg font-medium mb-2">Extracted Fields</h2>
          <ul className="text-sm space-y-1">
            <li><strong>Invoice:</strong> {data.invoiceNumber || "—"}</li>
            <li><strong>Importer:</strong> {data.importerName || "—"}</li>
            <li><strong>HS Code:</strong> {data.hsCode || "—"}</li>
            <li><strong>Declared Value:</strong> {data.declaredValue ?? "—"}</li>
            <li><strong>Extracted Value:</strong> {data.extractedValue ?? "—"}</li>
          </ul>
          <div className="mt-3">
            <h3 className="font-medium">Anomalies</h3>
            <ul className="list-disc ml-5 text-sm">
              {data.anomalies?.length ? data.anomalies.map((a, i) => <li key={i}>{a}</li>) : <li>None</li>}
            </ul>
          </div>
        </div>
        <div className="border rounded p-4 bg-white/70 dark:bg-neutral-900/50">
          <h2 className="text-lg font-medium mb-2">Blockchain Proof</h2>
          {data.blockchainUrl ? (
            <div className="flex items-center gap-4">
              <QRCodeCanvas value={data.blockchainUrl} size={128} />
              <div className="text-sm">
                <div><strong>Tx ID:</strong> {data.blockchainTxId}</div>
                <a className="text-blue-600" href={data.blockchainUrl} target="_blank" rel="noreferrer">View on chain</a>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70">No blockchain proof available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
