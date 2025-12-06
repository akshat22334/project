import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Truck,
  ClipboardCheck,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState(null);
  const [agentPerformance, setAgentPerformance] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, insightsRes, trendsRes, agentRes, alertsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getAIInsights(),
        dashboardAPI.getTrends(30),
        dashboardAPI.getAgentPerformance(),
        dashboardAPI.getAlerts(10),
      ]);

      setOverview(overviewRes.data.data);
      setInsights(insightsRes.data.data);
      setTrends(trendsRes.data.data);
      setAgentPerformance(agentRes.data.data);
      setAlerts(alertsRes.data.data.alerts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default data for demo
      setOverview({
        total_partners: 45,
        compliant_partners: 38,
        compliance_rate: 84.4,
        pending_communications: 12,
        active_shipments: 156,
        on_time_delivery_rate: 94.5,
        pending_pods: 23,
        validated_pods: 312,
        pending_invoices: 18,
        total_revenue: 1250000,
        disputes_count: 3,
      });
      setInsights({
        insights: [
          { category: 'operations', title: 'Optimize delivery routes', description: 'AI detected 15% improvement potential', impact: 'high', confidence: 0.92 },
          { category: 'compliance', title: '3 certifications expiring', description: 'Partner documents need renewal', impact: 'medium', confidence: 0.88 },
        ],
        overall_health_score: 87,
        priority_actions: ['Review delayed shipments', 'Process pending invoices'],
      });
      setTrends({
        shipments: [
          { _id: '2024-01-01', count: 45, delivered: 42 },
          { _id: '2024-01-02', count: 52, delivered: 48 },
          { _id: '2024-01-03', count: 38, delivered: 36 },
          { _id: '2024-01-04', count: 61, delivered: 58 },
          { _id: '2024-01-05', count: 55, delivered: 52 },
          { _id: '2024-01-06', count: 48, delivered: 45 },
          { _id: '2024-01-07', count: 67, delivered: 64 },
        ],
      });
      setAgentPerformance({
        onboarding_agent: { name: 'Onboarding Agent', compliance_rate: 84.4, time_reduction: '70%' },
        communication_agent: { name: 'Communication Agent', resolution_rate: 89.2, response_time_improvement: '80%' },
        tracking_agent: { name: 'Tracking Agent', on_time_improvement: '+20%', delay_prediction_accuracy: '95%' },
        pod_agent: { name: 'POD Agent', validation_rate: 93.1, dispute_reduction: '85%' },
        billing_agent: { name: 'Billing Agent', auto_approval_rate: 76.5, processing_speed: '75% faster' },
      });
      setAlerts([
        { type: 'shipment_delayed', severity: 'high', title: 'Shipment Delayed', message: 'TRK123456 delayed in transit' },
        { type: 'invoice_overdue', severity: 'medium', title: 'Invoice Overdue', message: 'INV-2024-001 past due date' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Active Shipments', value: overview?.active_shipments || 0, icon: Truck, color: 'blue', change: '+12%' },
    { label: 'On-Time Delivery', value: `${overview?.on_time_delivery_rate || 0}%`, icon: Clock, color: 'green', change: '+2.5%' },
    { label: 'Pending Communications', value: overview?.pending_communications || 0, icon: MessageSquare, color: 'yellow', change: '-8%' },
    { label: 'Revenue', value: `$${((overview?.total_revenue || 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'purple', change: '+15%' },
  ];

  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">AI-powered logistics overview</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* AI Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-primary-100">System Health Score</h2>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">{insights?.overall_health_score || 87}</span>
                <span className="text-primary-200">/100</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-primary-100 text-sm mb-2">Priority Actions</p>
            {insights?.priority_actions?.slice(0, 2).map((action, i) => (
              <p key={i} className="text-sm text-white/80">• {action}</p>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl ${colorMap[stat.color]} bg-opacity-10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <span className={`flex items-center text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change.startsWith('+') ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.shipments || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} tickFormatter={(v) => v.split('-')[2]} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Total" />
                <Area type="monotone" dataKey="delivered" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Delivered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Agent Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Agent Performance</h3>
          <div className="space-y-4">
            {agentPerformance && Object.entries(agentPerformance).slice(0, 5).map(([key, agent], i) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{agent.name || key}</span>
                    <span className="text-sm text-gray-600">
                      {agent.compliance_rate || agent.resolution_rate || agent.validation_rate || agent.auto_approval_rate || '95'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${agent.compliance_rate || agent.resolution_rate || agent.validation_rate || agent.auto_approval_rate || 95}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Alerts & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.length > 0 ? alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  alert.severity === 'high' ? 'bg-red-50' :
                  alert.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                  alert.severity === 'high' ? 'text-red-500' :
                  alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
          <div className="space-y-3">
            {insights?.insights?.map((insight, i) => (
              <div key={i} className="p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge ${
                    insight.impact === 'high' ? 'badge-danger' :
                    insight.impact === 'medium' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {insight.impact} impact
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round((insight.confidence || 0.9) * 100)}% confidence
                  </span>
                </div>
                <p className="font-medium text-gray-900">{insight.title}</p>
                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
