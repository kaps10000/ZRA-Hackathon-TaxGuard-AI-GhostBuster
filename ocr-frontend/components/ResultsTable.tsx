"use client";
import Link from "next/link";
import RiskBadge from "./RiskBadge";
import { useUploadsStore } from "../store/useUploadsStore";

export default function ResultsTable() {
  const results = useUploadsStore((s) => s.results);
  if (!results.length) return <div className="text-sm opacity-70">No results yet.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead className="bg-neutral-100 dark:bg-neutral-800">
          <tr>
            <th className="p-2 text-left">Invoice</th>
            <th className="p-2 text-left">Importer</th>
            <th className="p-2 text-left">HS Code</th>
            <th className="p-2 text-left">Risk</th>
            <th className="p-2 text-left">Created</th>
            <th className="p-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.invoiceNumber || "—"}</td>
              <td className="p-2">{r.importerName || "—"}</td>
              <td className="p-2">{r.hsCode || "—"}</td>
              <td className="p-2"><RiskBadge level={r.riskLevel} score={r.riskScore} /></td>
              <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
              <td className="p-2"><Link href={`/results/${r.id}`} className="text-blue-600">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
