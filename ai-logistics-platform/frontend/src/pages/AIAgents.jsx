import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, MessageSquare, Truck, ClipboardCheck, Receipt, Sparkles, CheckCircle, TrendingUp, Clock, Zap, Brain } from 'lucide-react';
import { dashboardAPI } from '../services/api';

const AIAgents = () => {
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const res = await dashboardAPI.getAgentPerformance();
      setAgentData(res.data.data);
    } catch (error) {
      setAgentData({
        onboarding_agent: { name: 'Smart Partner Onboarding & Compliance Agent', partners_processed: 45, compliance_rate: 84.4, time_reduction: '70%', error_reduction: '90%' },
        communication_agent: { name: 'AI-Powered Demand & Customer Communication Router', communications_processed: 1250, resolution_rate: 89.2, response_time_improvement: '80%', customer_satisfaction: '+25% NPS' },
        tracking_agent: { name: 'Autonomous Execution & Predictive Tracking Agent', on_time_improvement: '+20%', delay_prediction_accuracy: '95%', fuel_optimization: '12%' },
        pod_agent: { name: 'Digital Proof-of-Delivery Automation Agent', pods_processed: 312, validation_rate: 93.1, dispute_reduction: '85%', manned_hours_saved: '70%' },
        billing_agent: { name: 'Intelligent Financial Reconciliation & Billing Agent', invoices_processed: 580, auto_approval_rate: 76.5, processing_speed: '75% faster', error_reduction: '90%' },
      });
    } finally {
      setLoading(false);
    }
  };

  const agents = [
    {
      key: 'onboarding_agent',
      icon: Users,
      color: 'blue',
      description: 'AI-driven Intelligent Document Processing (IDP) for partner onboarding and compliance validation.',
      features: ['Extract contract terms from PDFs', 'Automate digital signatures', 'Real-time compliance alerts', 'Credential validation'],
      metrics: [
        { label: 'Time Reduction', value: '70%', subtext: 'From 5 days to 1.5 days' },
        { label: 'Error Reduction', value: '90%', subtext: 'Fewer compliance misses' },
        { label: 'Cost Savings', value: '35%', subtext: 'Reduction in admin overhead' },
      ],
    },
    {
      key: 'communication_agent',
      icon: MessageSquare,
      color: 'green',
      description: 'Agentic AI that classifies and routes customer communications with predictive responses.',
      features: ['Email classification', 'CRM/TMS routing', 'Predictive response engine', 'Exception handling'],
      metrics: [
        { label: 'Response Time', value: '80%', subtext: 'Faster resolution' },
        { label: 'Customer Satisfaction', value: '+25%', subtext: 'NPS improvement' },
        { label: 'Churn Reduction', value: '10%', subtext: 'Better communication' },
      ],
    },
    {
      key: 'tracking_agent',
      icon: Truck,
      color: 'purple',
      description: 'IoT-powered tracking with AI route optimization and predictive ETA.',
      features: ['GPS & temperature monitoring', 'Route deviation detection', 'Dynamic rerouting', 'Unified visibility dashboard'],
      metrics: [
        { label: 'On-Time Delivery', value: '+20%', subtext: 'Improvement' },
        { label: 'Delay Prediction', value: '95%', subtext: 'Accuracy' },
        { label: 'Fuel Savings', value: '12%', subtext: 'Route optimization' },
      ],
    },
    {
      key: 'pod_agent',
      icon: ClipboardCheck,
      color: 'orange',
      description: 'Digital proof-of-delivery with AI validation and automated dispute resolution.',
      features: ['E-signature capture', 'Photo & GPS evidence', 'Billing sync', 'Dispute automation'],
      metrics: [
        { label: 'Dispute Reduction', value: '85%', subtext: 'Fewer billing disputes' },
        { label: 'Invoice Speed', value: '60%', subtext: 'Faster cycle' },
        { label: 'Manual Hours', value: '70%', subtext: 'Reduction saved' },
      ],
    },
    {
      key: 'billing_agent',
      icon: Receipt,
      color: 'red',
      description: 'OCR-powered invoice processing with intelligent reconciliation and cash flow prediction.',
      features: ['OCR data extraction', 'Exception flagging', 'Auto-approval', 'Cash flow dashboard'],
      metrics: [
        { label: 'Processing Speed', value: '75%', subtext: 'Faster invoicing' },
        { label: 'Error Reduction', value: '90%', subtext: 'Fewer incorrect invoices' },
        { label: 'DSO Improvement', value: '20%', subtext: 'Days Sales Outstanding' },
      ],
    },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
        <p className="text-gray-600">5 intelligent agents powering your logistics operations</p>
      </div>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI-Powered Operations</h2>
            <p className="text-primary-100">All 5 agents are active and processing data in real-time</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {agents.map((agent, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-primary-100">{agent.key.split('_')[0]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Agent Cards */}
      <div className="space-y-6">
        {agents.map((agent, index) => {
          const colors = colorMap[agent.color];
          const data = agentData?.[agent.key] || {};
          
          return (
            <motion.div
              key={agent.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Header */}
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <agent.icon className={`w-8 h-8 ${colors.text}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{data.name || agent.key}</h3>
                  <p className="text-gray-600 mb-4">{agent.description}</p>

                  {/* Features */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {agent.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    {agent.metrics.map((metric, i) => (
                      <div key={i} className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className={`w-4 h-4 ${colors.text}`} />
                          <span className={`text-2xl font-bold ${colors.text}`}>{metric.value}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                        <p className="text-xs text-gray-500">{metric.subtext}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Active
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AIAgents;
