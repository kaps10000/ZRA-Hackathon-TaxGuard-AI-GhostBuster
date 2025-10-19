"use client";

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Lock,
  FileCheck,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Upload,
  Search,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  Sparkles,
  Database,
  Globe
} from 'lucide-react';
import FeatureCard from "@/components/home/FeatureCard";
import BenefitStat from "@/components/home/BenefitStat";
import StepCard from "@/components/home/StepCard";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Verification",
      description: "AI-powered OCR extracts and verifies document data in seconds, eliminating manual processing delays.",
      color: "blue"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Blockchain Security",
      description: "Every verification is immutably recorded on blockchain, ensuring tamper-proof audit trails.",
      color: "green"
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "Smart Fraud Detection",
      description: "Advanced algorithms automatically flag suspicious documents with risk scoring.",
      color: "red"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-Time Analytics",
      description: "Comprehensive dashboards provide insights into processing trends and compliance metrics.",
      color: "purple"
    }
  ];

  const benefits = [
    {
      stat: "85%",
      label: "Reduction in Processing Time",
      icon: <Clock className="w-8 h-8" />
    },
    {
      stat: "99.2%",
      label: "Accuracy Rate",
      icon: <CheckCircle className="w-8 h-8" />
    },
    {
      stat: "10k+",
      label: "Documents Processed Daily",
      icon: <FileCheck className="w-8 h-8" />
    },
    {
      stat: "24/7",
      label: "Automated Monitoring",
      icon: <Globe className="w-8 h-8" />
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Upload Documents",
      description: "Simply upload invoices, bills of lading, or customs declarations in PDF or image format.",
      icon: <Upload className="w-6 h-6" />
    },
    {
      step: "02",
      title: "AI Extraction",
      description: "Our OCR engine extracts key data points and cross-references with ZRA systems.",
      icon: <Search className="w-6 h-6" />
    },
    {
      step: "03",
      title: "Risk Assessment",
      description: "Machine learning algorithms analyze patterns and assign risk scores automatically.",
      icon: <AlertTriangle className="w-6 h-6" />
    },
    {
      step: "04",
      title: "Blockchain Verification",
      description: "Verified documents are sealed on blockchain with unique transaction IDs for proof.",
      icon: <Lock className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen text-white overflow-hidden">
      
      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-950/30 rounded-full blur-2xl opacity-40"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-950/20 rounded-full blur-2xl opacity-30"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">ZRA OCR Suite</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="hover:text-blue-300 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-300 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-blue-300 transition-colors">Benefits</a>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all">
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">AI-Powered Document Verification</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Transform Import/Export
                <br />Verification Process
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-200/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                Automate document verification with AI-powered OCR and blockchain security. 
                Reduce processing time by 85% while ensuring fraud-proof compliance.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-semibold">
                  Start Verification
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all font-semibold">
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="relative z-10 container mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((b, idx) => (
              <BenefitStat key={idx} icon={b.icon} stat={b.stat} label={b.label} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-blue-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
              Built for modern customs and tax administration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((f, idx) => (
              <FeatureCard key={idx} icon={f.icon} title={f.title} description={f.description} color={f.color as any} />
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-20 bg-blue-950/70">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
              Simple, automated workflow from upload to verification
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {steps.map((s, idx) => (
                <StepCard key={idx} step={s.step} title={s.title} description={s.description} icon={s.icon} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-950">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join ZRA in revolutionizing import/export verification with cutting-edge AI technology.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg transition-all shadow-xl font-semibold flex items-center gap-2 group">
                  Get Started Now
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg transition-all font-semibold">
                  Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-blue-950 border-t border-blue-900/60">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">ZRA OCR Suite</span>
            </div>
            <p className="text-blue-200/80 text-sm">
              © 2024 Zambia Revenue Authority. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-blue-200/80 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-blue-200/80 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-blue-200/80 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}