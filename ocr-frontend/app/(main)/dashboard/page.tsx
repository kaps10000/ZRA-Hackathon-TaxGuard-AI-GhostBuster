"use client"

import React, { useState } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  BarChart3,
  Search,
  Filter,
  Download,
  Eye,
  XCircle
} from 'lucide-react';
import StatCard from "../../../components/dashboard/StatCard";
import Card from "../../../components/dashboard/Card";
import Modal from "@/components/ui/Modal";
import UploadForm from '@/components/UploadForm';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [uploadOpen, setUploadOpen] = useState(false);

  // Mock data - replace with real API calls
  const stats = [
    {
      title: 'Documents Processed',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: <FileText className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Pending Verification',
      value: '23',
      change: '-8.2%',
      trend: 'down',
      icon: <Clock className="w-6 h-6" />,
      color: 'yellow'
    },
    {
      title: 'Flagged Documents',
      value: '47',
      change: '+3.1%',
      trend: 'up',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'red'
    },
    {
      title: 'Verified & Cleared',
      value: '1,177',
      change: '+15.3%',
      trend: 'up',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green'
    }
  ];

  const recentDocuments = [
    {
      id: 'DOC-2024-1247',
      type: 'Commercial Invoice',
      importer: 'ABC Trading Ltd',
      value: 'ZMW 245,000',
      riskScore: 15,
      status: 'verified',
      uploadedAt: '2 hours ago',
      verifiedBy: 'AI System',
      blockchainTx: '0x7d3f...92a1'
    },
    {
      id: 'DOC-2024-1246',
      type: 'Bill of Lading',
      importer: 'XYZ Imports',
      value: 'ZMW 890,000',
      riskScore: 78,
      status: 'flagged',
      uploadedAt: '3 hours ago',
      verifiedBy: 'Pending Review',
      blockchainTx: null
    },
    {
      id: 'DOC-2024-1245',
      type: 'Customs Declaration',
      importer: 'Global Traders',
      value: 'ZMW 156,000',
      riskScore: 25,
      status: 'verified',
      uploadedAt: '5 hours ago',
      verifiedBy: 'AI System',
      blockchainTx: '0x9a2c...41b7'
    },
    {
      id: 'DOC-2024-1244',
      type: 'Commercial Invoice',
      importer: 'Tech Solutions',
      value: 'ZMW 523,000',
      riskScore: 92,
      status: 'flagged',
      uploadedAt: '6 hours ago',
      verifiedBy: 'Manual Review',
      blockchainTx: null
    },
    {
      id: 'DOC-2024-1243',
      type: 'Packing List',
      importer: 'FastTrack Logistics',
      value: 'ZMW 67,000',
      riskScore: 8,
      status: 'verified',
      uploadedAt: '8 hours ago',
      verifiedBy: 'AI System',
      blockchainTx: '0x3f1e...88c9'
    }
  ];

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500 bg-green-500/10';
    if (score < 70) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      verified: 'bg-green-500/10 text-green-500 border-green-500/30',
      flagged: 'bg-red-500/10 text-red-500 border-red-500/30',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
    };
    
    const icons = {
      verified: <CheckCircle className="w-3 h-3" />,
      flagged: <AlertTriangle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />
    };

    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Document Verification Dashboard</h1>
            <p className="text-blue-200 mt-1">AI-Powered Import/Export Proof Verification</p>
          </div>
          
          <button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-700/30 font-medium cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend as 'up' | 'down'}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Quick Actions & Filters */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative min-w-0 w-full sm:w-64 md:w-80 flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="text"
                  placeholder="Search by document ID, importer..."
                  className="w-full min-w-0 bg-blue-950/40 text-white placeholder:text-blue-300 pl-10 pr-4 py-2 text-sm border border-blue-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-blue-950/40 text-white border border-blue-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-blue-700/60 text-blue-200 rounded-lg hover:bg-blue-800/60 transition-colors whitespace-nowrap">
                <Filter className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Filter</span>
              </button>
              
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-blue-700/60 text-blue-200 rounded-lg hover:bg-blue-800/60 transition-colors whitespace-nowrap">
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Export</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Recent Documents Table */}
        <Card title="Recent Documents" subtitle="Latest verification activities">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-800/80 border-b border-blue-700/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Document ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Importer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-800/60">
                {recentDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-blue-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-300" />
                        <span className="text-sm font-medium text-white">{doc.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">{doc.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{doc.importer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{doc.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-blue-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              doc.riskScore < 30 ? 'bg-green-500' : 
                              doc.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${doc.riskScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getRiskColor(doc.riskScore)}`}>
                          {doc.riskScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">{doc.uploadedAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-blue-800 rounded-lg transition-colors group" title="View Details">
                          <Eye className="w-4 h-4 text-blue-300 group-hover:text-white" />
                        </button>
                        {doc.blockchainTx && (
                          <button className="p-2 hover:bg-blue-800 rounded-lg transition-colors group" title="View Blockchain Proof">
                            <Shield className="w-4 h-4 text-blue-300 group-hover:text-green-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-blue-700/60 flex items-center justify-between">
            <p className="text-sm text-blue-200">Showing 5 of 1,247 documents</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-blue-700/60 text-blue-200 rounded hover:bg-blue-800 text-sm">Previous</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Next</button>
            </div>
          </div>
        </Card>
      </div>
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document">
        <UploadForm />
      </Modal>
    </div>
  );
};

export default Dashboard;