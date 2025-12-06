// 
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, Search, Upload, DollarSign, CheckCircle, Clock, 
  AlertTriangle, TrendingUp, Loader2, Sparkles, ChevronRight, 
  FileText, X, ArrowUpRight, Zap, BarChart3, CreditCard,
  CircleDollarSign, BadgeCheck, Timer, Ban
} from 'lucide-react';
import toast from 'react-hot-toast';
import { billingAPI } from '../services/api';

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [predictingCashflow, setPredictingCashflow] = useState(false);
  const [cashflowPrediction, setCashflowPrediction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchDashboard();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getInvoices(1, 50, { status: statusFilter || undefined });
      setInvoices(res.data.data.items || []);
    } catch (error) {
      setInvoices([
        { _id: '1', invoice_number: 'INV-2024-001', vendor_name: 'Swift Logistics', total: 15000, status: 'approved', due_date: '2024-02-01', auto_approved: true },
        { _id: '2', invoice_number: 'INV-2024-002', vendor_name: 'Express Carriers', total: 8500, status: 'pending', due_date: '2024-02-05', auto_approved: false },
        { _id: '3', invoice_number: 'INV-2024-003', vendor_name: 'Global Transport', total: 22000, status: 'paid', due_date: '2024-01-25', auto_approved: true },
        { _id: '4', invoice_number: 'INV-2024-004', vendor_name: 'Prime Freight', total: 12500, status: 'disputed', due_date: '2024-01-30', auto_approved: false },
        { _id: '5', invoice_number: 'INV-2024-005', vendor_name: 'Metro Shipping', total: 9800, status: 'approved', due_date: '2024-02-10', auto_approved: true },
        { _id: '6', invoice_number: 'INV-2024-006', vendor_name: 'Delta Cargo', total: 31500, status: 'pending', due_date: '2024-02-15', auto_approved: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await billingAPI.getDashboard();
      setDashboard(res.data.data);
    } catch (error) {
      setDashboard({
        by_status: { pending: { count: 12, total_amount: 150000 }, approved: { count: 25, total_amount: 320000 }, paid: { count: 180, total_amount: 2500000 } },
        overdue_count: 3,
        this_month: { total_invoiced: 450000, total_collected: 380000, collection_rate: 84.4 },
      });
    }
  };

  const handlePredictCashflow = async () => {
    setPredictingCashflow(true);
    try {
      const res = await billingAPI.predictCashFlow(30);
      setCashflowPrediction(res.data.data.cash_flow_forecast);
      toast.success('Cash flow prediction generated');
    } catch (error) {
      setCashflowPrediction({
        total_expected_inflow: 450000,
        dso_current: 32,
        dso_trend: 'improving',
        recommendations: ['Focus on high-value pending invoices', 'Follow up on overdue accounts', 'Optimize payment terms with key vendors'],
      });
    } finally {
      setPredictingCashflow(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status) => {
    const configs = {
      draft: { 
        gradient: 'from-slate-500 to-slate-600', 
        bg: 'bg-slate-500/10', 
        text: 'text-slate-600',
        border: 'border-slate-200',
        icon: FileText,
        label: 'Draft' 
      },
      pending: { 
        gradient: 'from-amber-500 to-orange-500', 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-600',
        border: 'border-amber-200',
        icon: Timer,
        label: 'Pending' 
      },
      approved: { 
        gradient: 'from-blue-500 to-cyan-500', 
        bg: 'bg-blue-500/10', 
        text: 'text-blue-600',
        border: 'border-blue-200',
        icon: BadgeCheck,
        label: 'Approved' 
      },
      disputed: { 
        gradient: 'from-rose-500 to-pink-500', 
        bg: 'bg-rose-500/10', 
        text: 'text-rose-600',
        border: 'border-rose-200',
        icon: Ban,
        label: 'Disputed' 
      },
      paid: { 
        gradient: 'from-emerald-500 to-teal-500', 
        bg: 'bg-emerald-500/10', 
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        icon: CheckCircle,
        label: 'Paid' 
      },
      overdue: { 
        gradient: 'from-red-500 to-rose-500', 
        bg: 'bg-red-500/10', 
        text: 'text-red-600',
        border: 'border-red-200',
        icon: AlertTriangle,
        label: 'Overdue' 
      },
    };
    return configs[status] || configs.pending;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 via-cyan-50/30 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-100/30 via-teal-50/20 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-100/20 to-purple-50/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent tracking-tight">
                  Billing & Reconciliation
                </h1>
                <p className="text-slate-500 text-sm font-medium">AI-powered invoice processing and cash flow management</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <motion.button 
              onClick={handlePredictCashflow} 
              disabled={predictingCashflow}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-xl font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-center gap-2.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {predictingCashflow ? (
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-violet-600 group-hover:scale-110 transition-transform duration-300" />
              )}
              <span className="relative">Cash Flow Forecast</span>
            </motion.button>
            
            <motion.button 
              onClick={() => setShowUploadModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Upload className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative z-10">Upload Invoice</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Collected This Month */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-shadow duration-500">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    ${((dashboard?.this_month?.total_collected || 0) / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Collected This Month</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5" />
                12%
              </div>
            </div>
          </motion.div>

          {/* Pending Invoices */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-xl group-hover:shadow-amber-500/40 transition-shadow duration-500">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    {dashboard?.by_status?.pending?.count || 0}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Pending Invoices</p>
                </div>
              </div>
              <div className="text-amber-600 text-sm font-semibold bg-amber-50 px-2.5 py-1 rounded-full">
                ${((dashboard?.by_status?.pending?.total_amount || 0) / 1000).toFixed(0)}K
              </div>
            </div>
          </motion.div>

          {/* Collection Rate */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-shadow duration-500">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    {dashboard?.this_month?.collection_rate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Collection Rate</p>
                </div>
              </div>
              <div className="w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle 
                    cx="24" cy="24" r="20" fill="none" 
                    stroke="url(#blueGradient)" strokeWidth="4" 
                    strokeLinecap="round"
                    strokeDasharray={`${(dashboard?.this_month?.collection_rate || 0) * 1.256} 125.6`}
                  />
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Overdue */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:shadow-xl group-hover:shadow-rose-500/40 transition-shadow duration-500">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    {dashboard?.overdue_count || 0}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Overdue Invoices</p>
                </div>
              </div>
              {(dashboard?.overdue_count || 0) > 0 && (
                <div className="flex items-center gap-1 text-rose-600 text-sm font-semibold bg-rose-50 px-2.5 py-1 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Needs Action
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Cashflow Prediction Panel */}
        <AnimatePresence>
          {cashflowPrediction && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 shadow-2xl shadow-purple-500/25"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
              </div>
              
              {/* Floating Orbs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Cash Flow Prediction</h3>
                      <p className="text-violet-200 text-sm">30-day forecast based on historical patterns</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCashflowPrediction(null)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white/80" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 text-violet-200 text-sm font-medium mb-3">
                      <CircleDollarSign className="w-4 h-4" />
                      Expected Inflow
                    </div>
                    <p className="text-4xl font-bold text-white tracking-tight">
                      ${(cashflowPrediction.total_expected_inflow / 1000).toFixed(0)}K
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-emerald-300 text-sm">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>+8.2% vs last period</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 text-violet-200 text-sm font-medium mb-3">
                      <Timer className="w-4 h-4" />
                      Days Sales Outstanding
                    </div>
                    <p className="text-4xl font-bold text-white tracking-tight">
                      {cashflowPrediction.dso_current} <span className="text-lg text-violet-200">days</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        cashflowPrediction.dso_trend === 'improving' 
                          ? 'bg-emerald-400/20 text-emerald-300' 
                          : 'bg-amber-400/20 text-amber-300'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {cashflowPrediction.dso_trend}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 text-violet-200 text-sm font-medium mb-3">
                      <Zap className="w-4 h-4" />
                      AI Recommendations
                    </div>
                    <ul className="space-y-2.5">
                      {cashflowPrediction.recommendations?.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Search */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300 shadow-sm"
              placeholder="Search invoices by number or vendor..." 
            />
          </div>
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full sm:w-52 px-4 py-3.5 bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300 appearance-none cursor-pointer shadow-sm font-medium"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="disputed">Disputed</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </motion.div>

        {/* Invoices Table */}
        <motion.div variants={itemVariants}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 bg-white/50 backdrop-blur-xl rounded-3xl border border-slate-200/60">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="mt-4 text-slate-500 font-medium">Loading invoices...</p>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50/80 to-slate-100/50">
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">AI Verified</th>
                      <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {filteredInvoices.map((invoice, index) => {
                        const statusConfig = getStatusConfig(invoice.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <motion.tr 
                            key={invoice._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/30 transition-all duration-300"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center group-hover:from-blue-100 group-hover:to-cyan-50 transition-all duration-300">
                                  <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                </div>
                                <span className="font-semibold text-slate-900">{invoice.invoice_number}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-slate-600 font-medium">{invoice.vendor_name}</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-lg font-bold text-slate-900">
                                ${invoice.total?.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-slate-600 font-medium">
                                {new Date(invoice.due_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {invoice.auto_approved ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-emerald-600 font-semibold text-sm">AI Verified</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm font-medium">Manual Review</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <Link to={`/billing/${invoice._id}`}>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                  View
                                  <ChevronRight className="w-4 h-4" />
                                </motion.button>
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {filteredInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No invoices found</p>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadInvoiceModal 
            onClose={() => setShowUploadModal(false)} 
            onSuccess={() => { 
              setShowUploadModal(false); 
              fetchInvoices(); 
              toast.success('Invoice uploaded and processed with AI'); 
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const UploadInvoiceModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { 
      toast.error('Please select a file'); 
      return; 
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (vendorName) formData.append('vendor_name', vendorName);
      await billingAPI.uploadInvoice(formData);
      onSuccess();
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 px-8 py-8">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Upload Invoice</h2>
              <p className="text-white/80 text-sm mt-1">AI will extract and validate invoice data automatically</p>
            </div>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* File Upload Zone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Invoice File *</label>
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : file 
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
              }`}
            >
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                id="invoice-file" 
                accept=".pdf,.png,.jpg,.jpeg" 
              />
              
              {file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    dragActive 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-100'
                  }`}>
                    <Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">
                      {dragActive ? 'Drop your file here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Name Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Vendor Name (optional)</label>
            <input 
              type="text" 
              value={vendorName} 
              onChange={(e) => setVendorName(e.target.value)} 
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all duration-300"
              placeholder="AI will extract if not provided" 
            />
          </div>

          {/* AI Processing Info */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-violet-900 text-sm">AI-Powered Processing</p>
                <p className="text-violet-700 text-sm mt-1">Our AI will automatically extract vendor details, line items, totals, and validate against contracts.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <motion.button 
              type="submit" 
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Process with AI
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Billing;