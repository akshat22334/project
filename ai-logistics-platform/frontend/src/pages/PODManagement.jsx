import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Search, Plus, CheckCircle, Clock, AlertTriangle, Camera, MapPin, Pen, Loader2, Sparkles, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { podAPI } from '../services/api';

const PODManagement = () => {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPod, setSelectedPod] = useState(null);
  const [validating, setValidating] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPODs();
    fetchStats();
  }, [statusFilter]);

  const fetchPODs = async () => {
    setLoading(true);
    try {
      const res = await podAPI.getPODs(1, 50, { status: statusFilter || undefined });
      setPods(res.data.data.items || []);
    } catch (error) {
      setPods([
        { _id: '1', shipment_id: 'SHP001', recipient_name: 'John Doe', status: 'validated', validation_score: 0.95, delivery_timestamp: '2024-01-20T14:30:00Z', billing_synced: true },
        { _id: '2', shipment_id: 'SHP002', recipient_name: 'Jane Smith', status: 'captured', validation_score: 0, delivery_timestamp: '2024-01-20T15:45:00Z', billing_synced: false },
        { _id: '3', shipment_id: 'SHP003', recipient_name: 'Bob Wilson', status: 'disputed', validation_score: 0.65, delivery_timestamp: '2024-01-19T11:20:00Z', billing_synced: false },
        { _id: '4', shipment_id: 'SHP004', recipient_name: 'Alice Brown', status: 'validated', validation_score: 0.92, delivery_timestamp: '2024-01-19T16:00:00Z', billing_synced: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await podAPI.getStats();
      setStats(res.data.data);
    } catch (error) {
      setStats({ total_pods: 312, validation_rate: 93.1 });
    }
  };

  const handleValidate = async (podId) => {
    setValidating(true);
    try {
      const res = await podAPI.validatePOD(podId);
      toast.success('POD validated successfully');
      fetchPODs();
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'badge-gray', icon: Clock, label: 'Pending' },
      captured: { color: 'badge-info', icon: Camera, label: 'Captured' },
      validated: { color: 'badge-success', icon: CheckCircle, label: 'Validated' },
      disputed: { color: 'badge-danger', icon: AlertTriangle, label: 'Disputed' },
      resolved: { color: 'badge-success', icon: CheckCircle, label: 'Resolved' },
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return <span className={`badge ${color} flex items-center gap-1`}><Icon className="w-3 h-3" />{label}</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POD Management</h1>
          <p className="text-gray-600">Digital Proof of Delivery with AI validation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_pods || 0}</p>
              <p className="text-sm text-gray-600">Total PODs</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.validation_rate || 0}%</p>
              <p className="text-sm text-gray-600">Validation Rate</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pods.filter(p => p.status === 'captured').length}</p>
              <p className="text-sm text-gray-600">Pending Validation</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pods.filter(p => p.status === 'disputed').length}</p>
              <p className="text-sm text-gray-600">Disputes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" className="input pl-10" placeholder="Search PODs..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
          <option value="">All Status</option>
          <option value="captured">Captured</option>
          <option value="validated">Validated</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      {/* POD List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Shipment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Recipient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Validation Score</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Delivered</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Billing</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pods.map((pod) => (
                  <motion.tr key={pod._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{pod.shipment_id}</td>
                    <td className="px-6 py-4 text-gray-600">{pod.recipient_name}</td>
                    <td className="px-6 py-4">{getStatusBadge(pod.status)}</td>
                    <td className="px-6 py-4">
                      {pod.validation_score > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${pod.validation_score >= 0.8 ? 'bg-green-500' : pod.validation_score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pod.validation_score * 100}%` }} />
                          </div>
                          <span className="text-sm text-gray-600">{Math.round(pod.validation_score * 100)}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(pod.delivery_timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${pod.billing_synced ? 'badge-success' : 'badge-gray'}`}>
                        {pod.billing_synced ? 'Synced' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedPod(pod)} className="btn-secondary text-sm py-1.5 px-3">
                          <Eye className="w-4 h-4" />
                        </button>
                        {pod.status === 'captured' && (
                          <button onClick={() => handleValidate(pod._id)} disabled={validating} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            Validate
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POD Detail Modal */}
      {selectedPod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">POD Details</h2>
              <button onClick={() => setSelectedPod(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Shipment ID</p>
                  <p className="font-medium">{selectedPod.shipment_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recipient</p>
                  <p className="font-medium">{selectedPod.recipient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedPod.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Validation Score</p>
                  <p className="font-medium">{Math.round(selectedPod.validation_score * 100)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Pen className="w-8 h-8 text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">Signature</p>
                </div>
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">Photo</p>
                </div>
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">Location</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setSelectedPod(null)} className="btn-secondary flex-1">Close</button>
              {selectedPod.status === 'validated' && !selectedPod.billing_synced && (
                <button className="btn-primary flex-1">Sync to Billing</button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PODManagement;
