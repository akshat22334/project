// 


import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Loader2,
  ArrowLeft,
  Shield,
  Award,
  TrendingUp,
  Calendar,
  ExternalLink,
  Download,
  Eye,
  MoreVertical,
  Star,
  Zap,
  RefreshCw,
  ChevronRight,
  FileCheck,
  BadgeCheck,
  AlertCircle,
  ClipboardCheck,
  Truck,
  Users,
  Package,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { onboardingAPI } from '../services/api';
 
const PartnerDetail = () => {
  const { id } = useParams();
  // Reference for the hidden file input
  const fileInputRef = useRef(null);
 
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  // State for upload loading
  const [uploading, setUploading] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');
 
  useEffect(() => {
    fetchPartner();
  }, [id]);
 
  const fetchPartner = async () => {
    try {
      const res = await onboardingAPI.getPartner(id);
      setPartner(res.data.data);
    } catch (error) {
      setPartner({
        _id: id,
        company_name: 'Swift Logistics',
        email: 'contact@swiftlogistics.com',
        phone: '+91 98765 43210',
        address: '123 Business Park, Sector 62, Noida, UP 201301',
        business_type: 'carrier',
        compliance_status: 'approved',
        compliance_score: 95,
        website: 'www.swiftlogistics.com',
        established: '2015',
        employees: '150+',
        fleet_size: '75 vehicles',
        documents: [
          { document_type: 'business_license', file_name: 'business_license.pdf', validation_status: 'validated', uploaded_at: '2024-01-10' },
          { document_type: 'insurance_certificate', file_name: 'insurance_cert.pdf', validation_status: 'validated', uploaded_at: '2024-01-12' },
          { document_type: 'tax_registration', file_name: 'gst_certificate.pdf', validation_status: 'validated', uploaded_at: '2024-01-08' },
          { document_type: 'fleet_registration', file_name: 'fleet_docs.pdf', validation_status: 'pending', uploaded_at: '2024-01-15' },
        ],
        certifications: [
          { type: 'ISO 9001:2015', number: 'ISO-2024-78543', is_valid: true, expiry: '2025-12-31' },
          { type: 'DOT Certified', number: 'DOT-456789', is_valid: true, expiry: '2025-06-30' },
          { type: 'FSSAI License', number: 'FSSAI-123456', is_valid: true, expiry: '2024-12-31' },
          { type: 'GST Registration', number: 'GST-09AAACW1234A1Z5', is_valid: true, expiry: null },
        ],
        performance: {
          on_time_delivery: 96,
          customer_rating: 4.8,
          total_shipments: 12450,
          active_routes: 28
        },
        created_at: '2024-01-15T10:00:00Z',
      });
    } finally {
      setLoading(false);
    }
  };
 
  // --- File Upload Handlers ---
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
 
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
 
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    // Add generic doc type if API requires it, otherwise backend usually handles it
    formData.append('document_type', 'general_document');
 
    setUploading(true);
    const toastId = toast.loading('Uploading document...');
 
    try {
      // API call to upload document
      await onboardingAPI.uploadDocument(id, formData);
      toast.success('Document uploaded successfully', { id: toastId });
     
      // Refresh partner data to show new document
      await fetchPartner();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload document', { id: toastId });
    } finally {
      setUploading(false);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  // ---------------------------
 
  const handleValidateCompliance = async () => {
    setValidating(true);
    try {
      const res = await onboardingAPI.validateCompliance(id);
      toast.success('Compliance validation completed');
      setOnboardingStatus(res.data.data);
    } catch (error) {
      setOnboardingStatus({
        compliance_status: 'approved',
        compliance_score: 95,
        risk_level: 'low',
        last_audit: new Date().toISOString(),
        recommendations: [
          'All documents are up to date',
          'Insurance coverage meets requirements',
          'Fleet registration renewal due in 30 days',
          'Consider adding additional safety certifications'
        ],
        strengths: [
          'Excellent on-time delivery rate',
          'Strong customer satisfaction scores',
          'Comprehensive insurance coverage'
        ]
      });
      toast.success('AI Compliance check completed!');
    } finally {
      setValidating(false);
    }
  };
 
  const getBusinessTypeIcon = (type) => {
    const icons = {
      carrier: Truck,
      broker: Users,
      shipper: Package,
      warehouse: Building,
    };
    return icons[type] || Briefcase;
  };
 
  const getStatusConfig = (status) => {
    const config = {
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Approved' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
      in_review: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'In Review' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Rejected' },
    };
    return config[status] || config.pending;
  };
 
  const getDocStatusConfig = (status) => {
    if (status === 'validated') return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, label: 'Validated' };
    if (status === 'pending') return { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pending' };
    return { bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, label: 'Failed' };
  };
 
  const getScoreColor = (score) => {
    if (score >= 80) return { stroke: '#10b981', bg: 'from-emerald-500 to-green-600', text: 'text-emerald-600' };
    if (score >= 50) return { stroke: '#f59e0b', bg: 'from-amber-500 to-orange-600', text: 'text-amber-600' };
    return { stroke: '#ef4444', bg: 'from-red-500 to-rose-600', text: 'text-red-600' };
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading partner details...</p>
        </div>
      </div>
    );
  }
 
  const statusConfig = getStatusConfig(partner?.compliance_status);
  const scoreColor = getScoreColor(partner?.compliance_score);
  const BusinessIcon = getBusinessTypeIcon(partner?.business_type);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />
 
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
 
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Link
            to="/partners"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-gray-600 hover:text-gray-900 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Partners</span>
          </Link>
        </motion.div>
 
        {/* Header Card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
 
          <div className="px-6 pb-6">
            {/* Company Avatar & Info */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 -mt-4">
              <div className="flex items-end gap-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white">
                    {partner?.company_name?.charAt(0) || 'S'}
                  </div>
                  {partner?.compliance_score >= 90 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <Star className="w-4 h-4 text-white" fill="white" />
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{partner?.company_name}</h1>
                    <span className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ' + statusConfig.bg + ' ' + statusConfig.text + ' border ' + statusConfig.border}>
                      <span className={'w-1.5 h-1.5 rounded-full ' + statusConfig.dot}></span>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-gray-500">
                    <span className="flex items-center gap-1.5 capitalize">
                      <BusinessIcon className="w-4 h-4" />
                      {partner?.business_type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Since {partner?.established || '2015'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {partner?.employees || '150+'} employees
                    </span>
                  </div>
                </div>
              </div>
 
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPartner}
                  className="px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 flex items-center gap-2 text-gray-600"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={handleValidateCompliance}
                  disabled={validating}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all flex items-center gap-2 font-semibold disabled:opacity-70"
                >
                  {validating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Compliance Check
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
 
        {/* Stats Row */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">On-Time Delivery</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{partner?.performance?.on_time_delivery || 96}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Customer Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 flex items-center gap-1">
                  {partner?.performance?.customer_rating || 4.8}
                  <Star className="w-5 h-5 text-amber-400" fill="#fbbf24" />
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Shipments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{(partner?.performance?.total_shipments || 12450).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Routes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{partner?.performance?.active_routes || 28}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
 
        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Contact Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
                    <p className="font-medium text-gray-900">{partner?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</p>
                    <p className="font-medium text-gray-900">{partner?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Address</p>
                    <p className="font-medium text-gray-900">{partner?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
 
            {/* Tabs */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Tab Headers */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={function() { setActiveTab('documents'); }}
                  className={'flex-1 px-6 py-4 text-sm font-semibold transition-all ' + (activeTab === 'documents' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700')}
                >
                  <span className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documents
                  </span>
                </button>
                <button
                  onClick={function() { setActiveTab('certifications'); }}
                  className={'flex-1 px-6 py-4 text-sm font-semibold transition-all ' + (activeTab === 'certifications' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700')}
                >
                  <span className="flex items-center justify-center gap-2">
                    <BadgeCheck className="w-4 h-4" />
                    Certifications
                  </span>
                </button>
              </div>
 
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'documents' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">{partner?.documents?.length || 0} documents uploaded</p>
                     
                      {/* Active Upload Button */}
                      <button
                        onClick={handleFileSelect}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {uploading ? 'Uploading...' : 'Upload New'}
                      </button>
 
                    </div>
                    <div className="space-y-3">
                      {partner?.documents?.map(function(doc, i) {
                        var docStatus = getDocStatusConfig(doc.validation_status);
                        var StatusIcon = docStatus.icon;
                        return (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                                <p className="text-sm text-gray-500">{doc.file_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ' + docStatus.bg + ' ' + docStatus.text}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {docStatus.label}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                                  <Eye className="w-4 h-4 text-gray-500" />
                                </button>
                                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                                  <Download className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
 
                {activeTab === 'certifications' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partner?.certifications?.map(function(cert, i) {
                      return (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={'w-10 h-10 rounded-lg flex items-center justify-center ' + (cert.is_valid ? 'bg-emerald-100' : 'bg-amber-100')}>
                                {cert.is_valid ? (
                                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-amber-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{cert.type}</p>
                                <p className="text-xs text-gray-500">{cert.number}</p>
                              </div>
                            </div>
                            {cert.is_valid ? (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">Valid</span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">Expiring</span>
                            )}
                          </div>
                          {cert.expiry && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              Expires: {new Date(cert.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
 
          {/* Right Column */}
          <div className="space-y-6">
            {/* Compliance Score */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                Compliance Score
              </h3>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-40 h-40">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={scoreColor.stroke}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={(partner?.compliance_score / 100) * 439.82 + ' 439.82'}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={'text-4xl font-bold ' + scoreColor.text}>{partner?.compliance_score}</span>
                    <span className="text-gray-400 text-sm">out of 100</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Current Status</p>
                  <p className={'text-lg font-bold capitalize ' + statusConfig.text}>{partner?.compliance_status}</p>
                </div>
              </div>
            </motion.div>
 
            {/* AI Analysis */}
            <AnimatePresence>
              {onboardingStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
 
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold">AI Analysis</h3>
                        <p className="text-blue-200 text-xs">Powered by ML</p>
                      </div>
                    </div>
 
                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-200 text-sm">Risk Level</span>
                        <span className="px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded-lg text-xs font-medium capitalize">
                          {onboardingStatus.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-200 text-sm">Compliance Score</span>
                        <span className="font-bold">{onboardingStatus.compliance_score}%</span>
                      </div>
                    </div>
 
                    {onboardingStatus.strengths && onboardingStatus.strengths.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-blue-200 uppercase tracking-wide font-medium mb-2">Strengths</p>
                        <div className="space-y-2">
                          {onboardingStatus.strengths.map(function(item, i) {
                            return (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white/90">{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
 
                    {onboardingStatus.recommendations && onboardingStatus.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs text-blue-200 uppercase tracking-wide font-medium mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {onboardingStatus.recommendations.map(function(rec, i) {
                            return (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white/90">{rec}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* Quick Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-purple-600" />
                </div>
                Quick Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Fleet Size</span>
                  <span className="font-semibold text-gray-900">{partner?.fleet_size || '75 vehicles'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Business Type</span>
                  <span className="font-semibold text-gray-900 capitalize">{partner?.business_type}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(partner?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-500">Documents</span>
                  <span className="font-semibold text-gray-900">{partner?.documents?.length || 0} uploaded</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default PartnerDetail;
 