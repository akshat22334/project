import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Upload,
  Loader2,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { onboardingAPI } from '../services/api';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [summary, setSummary] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const [partnersRes, summaryRes] = await Promise.all([
        onboardingAPI.getPartners(1, 50, statusFilter || null),
        onboardingAPI.getComplianceSummary(),
      ]);
      setPartners(partnersRes.data.data.items || []);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      // Demo data
      setPartners([
        { _id: '1', company_name: 'Swift Logistics', email: 'contact@swift.com', compliance_status: 'approved', compliance_score: 95, created_at: '2024-01-15' },
        { _id: '2', company_name: 'Global Transport Co', email: 'info@globaltransport.com', compliance_status: 'pending', compliance_score: 65, created_at: '2024-01-18' },
        { _id: '3', company_name: 'Express Carriers', email: 'hello@expresscarriers.com', compliance_status: 'in_review', compliance_score: 80, created_at: '2024-01-20' },
        { _id: '4', company_name: 'Prime Freight', email: 'support@primefreight.com', compliance_status: 'approved', compliance_score: 92, created_at: '2024-01-22' },
      ]);
      setSummary({
        by_status: {
          approved: { count: 38, avg_score: 92 },
          pending: { count: 5, avg_score: 45 },
          in_review: { count: 2, avg_score: 75 },
        },
        total_partners: 45,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    const config = {
      approved: { icon: CheckCircle, class: 'badge-success', label: 'Approved' },
      pending: { icon: Clock, class: 'badge-warning', label: 'Pending' },
      in_review: { icon: AlertTriangle, class: 'badge-info', label: 'In Review' },
      rejected: { icon: XCircle, class: 'badge-danger', label: 'Rejected' },
    };
    const { icon: Icon, class: className, label } = config[status] || config.pending;
    return (
      <span className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const filteredPartners = partners.filter(p =>
    p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Onboarding</h1>
          <p className="text-gray-600">Manage partners and compliance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Partner
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.total_partners || 0}</p>
              <p className="text-sm text-gray-600">Total Partners</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.by_status?.approved?.count || 0}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.by_status?.pending?.count || 0}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.by_status?.in_review?.count || 0}</p>
              <p className="text-sm text-gray-600">In Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
            placeholder="Search partners..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Partners List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Partner</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Compliance Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPartners.map((partner) => (
                  <motion.tr
                    key={partner._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-medium text-gray-900">{partner.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {partner.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(partner.compliance_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              partner.compliance_score >= 80 ? 'bg-green-500' :
                              partner.compliance_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${partner.compliance_score}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{partner.compliance_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/partners/${partner._id}`}
                        className="btn-secondary text-sm py-1.5 px-3 inline-flex items-center gap-1"
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPartners.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No partners found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPartners();
            toast.success('Partner added successfully');
          }}
        />
      )}
    </div>
  );
};

const AddPartnerModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    business_type: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onboardingAPI.createPartner(formData);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Partner</h2>
          <p className="text-gray-600 mt-1">Enter partner details to begin onboarding</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Company Name *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Business Type</label>
            <select
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
              className="input"
            >
              <option value="">Select type</option>
              <option value="carrier">Carrier</option>
              <option value="broker">Broker</option>
              <option value="shipper">Shipper</option>
              <option value="warehouse">Warehouse</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Partner'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Partners;


// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   Users,
//   Plus,
//   Search,
//   Filter,
//   CheckCircle,
//   Clock,
//   AlertTriangle,
//   XCircle,
//   ChevronRight,
//   Upload,
//   Loader2,
//   Building,
//   Mail,
//   Phone,
//   MapPin,
//   Briefcase,
//   TrendingUp,
//   Award,
//   Shield,
//   Star,
//   MoreVertical,
//   Eye,
//   Edit,
//   Trash2,
//   X,
//   Sparkles,
//   ArrowUpRight,
//   UserPlus,
//   Activity,
//   Target,
//   Zap,
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { onboardingAPI } from '../services/api';

// const Partners = () => {
//   const [partners, setPartners] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [summary, setSummary] = useState(null);
//   const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

//   const fetchPartners = async () => {
//     setLoading(true);
//     try {
//       const [partnersRes, summaryRes] = await Promise.all([
//         onboardingAPI.getPartners(1, 50, statusFilter || null),
//         onboardingAPI.getComplianceSummary(),
//       ]);
//       setPartners(partnersRes.data.data.items || []);
//       setSummary(summaryRes.data.data);
//     } catch (error) {
//       console.error('Error fetching partners:', error);
//       // Demo data
//       setPartners([
//         { _id: '1', company_name: 'Swift Logistics', email: 'contact@swift.com', phone: '+91 98765 43210', compliance_status: 'approved', compliance_score: 95, created_at: '2024-01-15', business_type: 'carrier', address: 'Mumbai, Maharashtra' },
//         { _id: '2', company_name: 'Global Transport Co', email: 'info@globaltransport.com', phone: '+91 87654 32109', compliance_status: 'pending', compliance_score: 65, created_at: '2024-01-18', business_type: 'broker', address: 'Delhi, NCR' },
//         { _id: '3', company_name: 'Express Carriers', email: 'hello@expresscarriers.com', phone: '+91 76543 21098', compliance_status: 'in_review', compliance_score: 80, created_at: '2024-01-20', business_type: 'carrier', address: 'Bangalore, Karnataka' },
//         { _id: '4', company_name: 'Prime Freight', email: 'support@primefreight.com', phone: '+91 65432 10987', compliance_status: 'approved', compliance_score: 92, created_at: '2024-01-22', business_type: 'shipper', address: 'Chennai, Tamil Nadu' },
//         { _id: '5', company_name: 'Metro Movers', email: 'info@metromovers.com', phone: '+91 54321 09876', compliance_status: 'approved', compliance_score: 88, created_at: '2024-01-25', business_type: 'warehouse', address: 'Hyderabad, Telangana' },
//       ]);
//       setSummary({
//         by_status: {
//           approved: { count: 38, avg_score: 92 },
//           pending: { count: 5, avg_score: 45 },
//           in_review: { count: 2, avg_score: 75 },
//         },
//         total_partners: 45,
//         growth_rate: 12.5,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPartners();
//   }, [statusFilter]);

//   const getStatusConfig = (status) => {
//     const config = {
//       approved: { 
//         icon: CheckCircle, 
//         bgColor: 'bg-emerald-50', 
//         textColor: 'text-emerald-700',
//         borderColor: 'border-emerald-200',
//         dotColor: 'bg-emerald-500',
//         label: 'Approved' 
//       },
//       pending: { 
//         icon: Clock, 
//         bgColor: 'bg-amber-50', 
//         textColor: 'text-amber-700',
//         borderColor: 'border-amber-200',
//         dotColor: 'bg-amber-500',
//         label: 'Pending' 
//       },
//       in_review: { 
//         icon: AlertTriangle, 
//         bgColor: 'bg-blue-50', 
//         textColor: 'text-blue-700',
//         borderColor: 'border-blue-200',
//         dotColor: 'bg-blue-500',
//         label: 'In Review' 
//       },
//       rejected: { 
//         icon: XCircle, 
//         bgColor: 'bg-red-50', 
//         textColor: 'text-red-700',
//         borderColor: 'border-red-200',
//         dotColor: 'bg-red-500',
//         label: 'Rejected' 
//       },
//     };
//     return config[status] || config.pending;
//   };

//   const getStatusBadge = (status) => {
//     const config = getStatusConfig(status);
//     const Icon = config.icon;
//     return (
//       <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
//         <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
//         {config.label}
//       </span>
//     );
//   };

//   const getScoreColor = (score) => {
//     if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-100' };
//     if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100' };
//     return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
//   };

//   const filteredPartners = partners.filter(p =>
//     p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     p.email?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
//       {/* Decorative Background */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
//         <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
//         <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
//       </div>

//       <div className="relative z-10 p-6 space-y-6 max-w-7xl mx-auto">
//         {/* Header Section */}
//         <motion.div 
//           initial={{ y: -20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
//         >
//           <div className="flex items-center gap-4">
//             <motion.div 
//               initial={{ scale: 0, rotate: -180 }}
//               animate={{ scale: 1, rotate: 0 }}
//               transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
//               className="relative"
//             >
//               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
//                 <Users className="w-7 h-7 text-white" />
//               </div>
//               <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
//                 <Zap className="w-3 h-3 text-white" />
//               </div>
//             </motion.div>
//             <div>
//               <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
//                 Partner Onboarding
//               </h1>
//               <p className="text-gray-500 mt-0.5">Manage partners and compliance verification</p>
//             </div>
//           </div>
          
//           <motion.button
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             onClick={() => setShowAddModal(true)}
//             className="px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2 font-semibold"
//           >
//             <UserPlus className="w-5 h-5" />
//             Add Partner
//           </motion.button>
//         </motion.div>

//         {/* Summary Cards */}
//         <motion.div 
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.1 }}
//           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
//         >
//           {/* Total Partners */}
//           <motion.div 
//             whileHover={{ y: -2, scale: 1.01 }}
//             className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100/50 group"
//           >
//             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
//             <div className="relative flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Partners</p>
//                 <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.total_partners || 0}</p>
//                 <div className="flex items-center gap-1 mt-2">
//                   <TrendingUp className="w-4 h-4 text-emerald-500" />
//                   <span className="text-sm font-medium text-emerald-600">+{summary?.growth_rate || 12.5}%</span>
//                   <span className="text-xs text-gray-400">this month</span>
//                 </div>
//               </div>
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
//                 <Users className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </motion.div>

//           {/* Approved */}
//           <motion.div 
//             whileHover={{ y: -2, scale: 1.01 }}
//             className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100/50 group"
//           >
//             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
//             <div className="relative flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Approved</p>
//                 <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.by_status?.approved?.count || 0}</p>
//                 <div className="flex items-center gap-1 mt-2">
//                   <Award className="w-4 h-4 text-emerald-500" />
//                   <span className="text-sm text-gray-500">Avg Score: {summary?.by_status?.approved?.avg_score || 0}%</span>
//                 </div>
//               </div>
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
//                 <CheckCircle className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </motion.div>

//           {/* Pending */}
//           <motion.div 
//             whileHover={{ y: -2, scale: 1.01 }}
//             className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100/50 group"
//           >
//             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
//             <div className="relative flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</p>
//                 <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.by_status?.pending?.count || 0}</p>
//                 <div className="flex items-center gap-1 mt-2">
//                   <Clock className="w-4 h-4 text-amber-500" />
//                   <span className="text-sm text-gray-500">Needs attention</span>
//                 </div>
//               </div>
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
//                 <Clock className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </motion.div>

//           {/* In Review */}
//           <motion.div 
//             whileHover={{ y: -2, scale: 1.01 }}
//             className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100/50 group"
//           >
//             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
//             <div className="relative flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">In Review</p>
//                 <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.by_status?.in_review?.count || 0}</p>
//                 <div className="flex items-center gap-1 mt-2">
//                   <Activity className="w-4 h-4 text-purple-500" />
//                   <span className="text-sm text-gray-500">Being processed</span>
//                 </div>
//               </div>
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
//                 <AlertTriangle className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </motion.div>
//         </motion.div>

//         {/* Filters Section */}
//         <motion.div 
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.2 }}
//           className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100/50"
//         >
//           <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
//             <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
//               {/* Search */}
//               <div className="relative flex-1 lg:w-80">
//                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="text"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
//                   placeholder="Search partners..."
//                 />
//               </div>
              
//               {/* Status Filter */}
//               <div className="relative">
//                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer min-w-[160px]"
//                 >
//                   <option value="">All Status</option>
//                   <option value="approved">Approved</option>
//                   <option value="pending">Pending</option>
//                   <option value="in_review">In Review</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
//                 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
//               </div>
//             </div>

//             {/* View Toggle */}
//             <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
//               <button
//                 onClick={() => setViewMode('table')}
//                 className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
//                   viewMode === 'table' 
//                     ? 'bg-white text-gray-900 shadow-sm' 
//                     : 'text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 Table
//               </button>
//               <button
//                 onClick={() => setViewMode('grid')}
//                 className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
//                   viewMode === 'grid' 
//                     ? 'bg-white text-gray-900 shadow-sm' 
//                     : 'text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 Grid
//               </button>
//             </div>
//           </div>
//         </motion.div>

//         {/* Partners List */}
//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <div className="relative">
//                 <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-ping absolute inset-0"></div>
//                 <div className="w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
//               </div>
//               <p className="text-gray-500 mt-4 font-medium">Loading partners...</p>
//             </div>
//           </div>
//         ) : viewMode === 'table' ? (
//           /* Table View */
//           <motion.div 
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.3 }}
//             className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden"
//           >
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner</th>
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance</th>
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
//                     <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {filteredPartners.map((partner, index) => {
//                     const scoreColor = getScoreColor(partner.compliance_score);
//                     return (
//                       <motion.tr
//                         key={partner._id}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: index * 0.05 }}
//                         className="group hover:bg-blue-50/30 transition-colors"
//                       >
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-4">
//                             <div className="relative">
//                               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
//                                 {partner.company_name?.charAt(0)}
//                               </div>
//                               {partner.compliance_score >= 90 && (
//                                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
//                                   <Star className="w-3 h-3 text-white fill-white" />
//                                 </div>
//                               )}
//                             </div>
//                             <div>
//                               <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
//                                 {partner.company_name}
//                               </p>
//                               <p className="text-sm text-gray-500 flex items-center gap-1">
//                                 <Briefcase className="w-3 h-3" />
//                                 {partner.business_type || 'Carrier'}
//                               </p>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="space-y-1">
//                             <p className="text-sm text-gray-600 flex items-center gap-2">
//                               <Mail className="w-4 h-4 text-gray-400" />
//                               {partner.email}
//                             </p>
//                             {partner.phone && (
//                               <p className="text-sm text-gray-500 flex items-center gap-2">
//                                 <Phone className="w-4 h-4 text-gray-400" />
//                                 {partner.phone}
//                               </p>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           {getStatusBadge(partner.compliance_status)}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-3">
//                             <div className="flex-1 max-w-[100px]">
//                               <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                                 <motion.div
//                                   initial={{ width: 0 }}
//                                   animate={{ width: `${partner.compliance_score}%` }}
//                                   transition={{ duration: 1, delay: index * 0.1 }}
//                                   className={`h-full ${scoreColor.bg} rounded-full`}
//                                 />
//                               </div>
//                             </div>
//                             <span className={`text-sm font-bold ${scoreColor.text}`}>
//                               {partner.compliance_score}%
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <p className="text-sm text-gray-600">
//                             {new Date(partner.created_at).toLocaleDateString('en-US', {
//                               month: 'short',
//                               day: 'numeric',
//                               year: 'numeric'
//                             })}
//                           </p>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center justify-end gap-2">
//                             <Link
//                               to={`/partners/${partner._id}`}
//                               className="px-4 py-2 bg-gray-100 hover:bg-blue-500 text-gray-600 hover:text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 group/btn"
//                             >
//                               View
//                               <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
//                             </Link>
//                           </div>
//                         </td>
//                       </motion.tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
            
//             {filteredPartners.length === 0 && (
//               <div className="text-center py-16">
//                 <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                   <Users className="w-10 h-10 text-gray-400" />
//                 </div>
//                 <p className="text-gray-500 font-medium">No partners found</p>
//                 <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
//               </div>
//             )}
//           </motion.div>
//         ) : (
//           /* Grid View */
//           <motion.div 
//             initial={{ y: 20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.3 }}
//             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
//           >
//             {filteredPartners.map((partner, index) => {
//               const scoreColor = getScoreColor(partner.compliance_score);
//               const statusConfig = getStatusConfig(partner.compliance_status);
//               return (
//                 <motion.div
//                   key={partner._id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   whileHover={{ y: -4 }}
//                   className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100/50 hover:shadow-lg hover:border-blue-200/50 transition-all group"
//                 >
//                   {/* Header */}
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex items-center gap-3">
//                       <div className="relative">
//                         <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
//                           {partner.company_name?.charAt(0)}
//                         </div>
//                         {partner.compliance_score >= 90 && (
//                           <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
//                             <Star className="w-3 h-3 text-white fill-white" />
//                           </div>
//                         )}
//                       </div>
//                       <div>
//                         <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
//                           {partner.company_name}
//                         </h3>
//                         <p className="text-xs text-gray-500 flex items-center gap-1 capitalize">
//                           <Briefcase className="w-3 h-3" />
//                           {partner.business_type || 'Carrier'}
//                         </p>
//                       </div>
//                     </div>
//                     {getStatusBadge(partner.compliance_status)}
//                   </div>

//                   {/* Contact Info */}
//                   <div className="space-y-2 mb-4">
//                     <p className="text-sm text-gray-600 flex items-center gap-2">
//                       <Mail className="w-4 h-4 text-gray-400" />
//                       {partner.email}
//                     </p>
//                     {partner.address && (
//                       <p className="text-sm text-gray-500 flex items-center gap-2">
//                         <MapPin className="w-4 h-4 text-gray-400" />
//                         {partner.address}
//                       </p>
//                     )}
//                   </div>

//                   {/* Compliance Score */}
//                   <div className="p-3 bg-gray-50 rounded-xl mb-4">
//                     <div className="flex items-center justify-between mb-2">
//                       <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Compliance Score</span>
//                       <span className={`text-lg font-bold ${scoreColor.text}`}>{partner.compliance_score}%</span>
//                     </div>
//                     <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                       <motion.div
//                         initial={{ width: 0 }}
//                         animate={{ width: `${partner.compliance_score}%` }}
//                         transition={{ duration: 1, delay: index * 0.1 }}
//                         className={`h-full ${scoreColor.bg} rounded-full`}
//                       />
//                     </div>
//                   </div>

//                   {/* Footer */}
//                   <div className="flex items-center justify-between pt-3 border-t border-gray-100">
//                     <span className="text-xs text-gray-400">
//                       Joined {new Date(partner.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                     </span>
//                     <Link
//                       to={`/partners/${partner._id}`}
//                       className="px-3 py-1.5 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1"
//                     >
//                       View Details
//                       <ChevronRight className="w-4 h-4" />
//                     </Link>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </motion.div>
//         )}
//       </div>

//       {/* Add Partner Modal */}
//       <AnimatePresence>
//         {showAddModal && (
//           <AddPartnerModal
//             onClose={() => setShowAddModal(false)}
//             onSuccess={() => {
//               setShowAddModal(false);
//               fetchPartners();
//               toast.success('Partner added successfully');
//             }}
//           />
//         )}
//       </AnimatePresence>

//       {/* Custom Styles */}
//       <style jsx>{`
//         @keyframes blob {
//           0%, 100% { transform: translate(0, 0) scale(1); }
//           25% { transform: translate(20px, -30px) scale(1.1); }
//           50% { transform: translate(-20px, 20px) scale(0.9); }
//           75% { transform: translate(30px, 30px) scale(1.05); }
//         }
//         .animate-blob { animation: blob 8s infinite ease-in-out; }
//         .animation-delay-2000 { animation-delay: 2s; }
//         .animation-delay-4000 { animation-delay: 4s; }
//       `}</style>
//     </div>
//   );
// };

// const AddPartnerModal = ({ onClose, onSuccess }) => {
//   const [formData, setFormData] = useState({
//     company_name: '',
//     email: '',
//     phone: '',
//     address: '',
//     business_type: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [step, setStep] = useState(1);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await onboardingAPI.createPartner(formData);
//       onSuccess();
//     } catch (error) {
//       // Demo success for now
//       setTimeout(() => {
//         onSuccess();
//       }, 1000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const businessTypes = [
//     { value: 'carrier', label: 'Carrier', icon: Truck, color: 'blue' },
//     { value: 'broker', label: 'Broker', icon: Users, color: 'purple' },
//     { value: 'shipper', label: 'Shipper', icon: Package, color: 'green' },
//     { value: 'warehouse', label: 'Warehouse', icon: Building, color: 'amber' },
//   ];

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.9, y: 20 }}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//         className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 p-6 text-white">
//           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
//           <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
//           <button 
//             onClick={onClose}
//             className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//           <div className="relative">
//             <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
//               <UserPlus className="w-7 h-7 text-white" />
//             </div>
//             <h2 className="text-2xl font-bold">Add New Partner</h2>
//             <p className="text-blue-100 mt-1">Enter partner details to begin onboarding</p>
//           </div>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
//           {/* Company Name */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Company Name <span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 value={formData.company_name}
//                 onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
//                 className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//                 placeholder="Enter company name"
//                 required
//               />
//             </div>
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Email <span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                 className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//                 placeholder="contact@company.com"
//                 required
//               />
//             </div>
//           </div>

//           {/* Phone */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
//             <div className="relative">
//               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="tel"
//                 value={formData.phone}
//                 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                 className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//                 placeholder="+91 98765 43210"
//               />
//             </div>
//           </div>

//           {/* Address */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
//             <div className="relative">
//               <MapPin className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 value={formData.address}
//                 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//                 className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
//                 placeholder="City, State"
//               />
//             </div>
//           </div>

//           {/* Business Type */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-3">Business Type</label>
//             <div className="grid grid-cols-2 gap-3">
//               {businessTypes.map((type) => {
//                 const Icon = type.icon;
//                 const isSelected = formData.business_type === type.value;
//                 return (
//                   <button
//                     key={type.value}
//                     type="button"
//                     onClick={() => setFormData({ ...formData, business_type: type.value })}
//                     className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
//                       isSelected 
//                         ? 'border-blue-500 bg-blue-50 text-blue-700' 
//                         : 'border-gray-200 hover:border-gray-300 text-gray-600'
//                     }`}
//                   >
//                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
//                       isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100'
//                     }`}>
//                       <Icon className="w-5 h-5" />
//                     </div>
//                     <span className="font-medium">{type.label}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-3 pt-4">
//             <button 
//               type="button" 
//               onClick={onClose} 
//               className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={loading} 
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Adding...
//                 </>
//               ) : (
//                 <>
//                   <Sparkles className="w-5 h-5" />
//                   Add Partner
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </motion.div>
//     </motion.div>
//   );
// };

// // Add Truck and Package icons for business types
// const Truck = ({ className }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
//   </svg>
// );

// const Package = ({ className }) => (
//   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//   </svg>
// );

// export default Partners;