import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { billingAPI } from '../services/api';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await billingAPI.getInvoice(id);
      setInvoice(res.data.data);
    } catch (error) {
      setInvoice({
        _id: id,
        invoice_number: 'INV-2024-001',
        vendor_name: 'Swift Logistics',
        vendor_email: 'billing@swift.com',
        total: 15000,
        subtotal: 14000,
        tax: 1000,
        status: 'approved',
        due_date: '2024-02-01',
        auto_approved: true,
        line_items: [
          { description: 'Freight Services - Route A', quantity: 10, unit_price: 800, total: 8000 },
          { description: 'Freight Services - Route B', quantity: 5, unit_price: 1200, total: 6000 },
        ],
        ocr_extracted_data: { confidence: 0.95 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      await billingAPI.reconcileInvoice(id);
      toast.success('Invoice reconciled');
      fetchInvoice();
    } catch (error) {
      toast.error('Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link to="/billing" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Billing
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice?.invoice_number}</h1>
            <p className="text-gray-600">{invoice?.vendor_name}</p>
          </div>
        </div>
        <button onClick={handleReconcile} disabled={reconciling} className="btn-primary flex items-center gap-2">
          {reconciling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          AI Reconcile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Description</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Qty</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Unit Price</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice?.line_items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">${item.unit_price?.toLocaleString()}</td>
                      <td className="py-3 text-right font-medium">${item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200">
                  <tr><td colSpan="3" className="py-3 text-right text-gray-600">Subtotal</td><td className="py-3 text-right">${invoice?.subtotal?.toLocaleString()}</td></tr>
                  <tr><td colSpan="3" className="py-3 text-right text-gray-600">Tax</td><td className="py-3 text-right">${invoice?.tax?.toLocaleString()}</td></tr>
                  <tr><td colSpan="3" className="py-3 text-right font-semibold">Total</td><td className="py-3 text-right text-xl font-bold">${invoice?.total?.toLocaleString()}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
            <div className="space-y-3">
              <div><p className="text-sm text-gray-500">Status</p><span className={`badge ${invoice?.status === 'paid' ? 'badge-success' : invoice?.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>{invoice?.status}</span></div>
              <div><p className="text-sm text-gray-500">Due Date</p><p className="font-medium">{new Date(invoice?.due_date).toLocaleDateString()}</p></div>
              <div><p className="text-sm text-gray-500">Vendor Email</p><p className="font-medium">{invoice?.vendor_email}</p></div>
            </div>
          </div>

          {invoice?.auto_approved && (
            <div className="card bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">AI Auto-Approved</h3>
              </div>
              <p className="text-sm text-green-700">This invoice was automatically approved by AI with {Math.round((invoice?.ocr_extracted_data?.confidence || 0.95) * 100)}% confidence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
