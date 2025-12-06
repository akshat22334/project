// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { MessageSquare, Search, Filter, Plus, Sparkles, Loader2, Mail, Clock, User, ChevronRight, Send } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { communicationAPI } from '../services/api';

// const Communications = () => {
//   const [communications, setCommunications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedComm, setSelectedComm] = useState(null);
//   const [showNewModal, setShowNewModal] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const [aiResponse, setAiResponse] = useState(null);

//   useEffect(() => {
//     fetchCommunications();
//   }, []);

//   const fetchCommunications = async () => {
//     setLoading(true);
//     try {
//       const res = await communicationAPI.getCommunications();
//       setCommunications(res.data.data.items || []);
//     } catch (error) {
//       setCommunications([
//         { _id: '1', customer_name: 'John Smith', customer_email: 'john@example.com', subject: 'Rate Request for Q2', category: 'rate_request', priority: 2, status: 'new', sentiment: 'neutral', created_at: '2024-01-20T10:00:00Z' },
//         { _id: '2', customer_name: 'Sarah Johnson', customer_email: 'sarah@company.com', subject: 'Shipment Delay Issue', category: 'complaint', priority: 1, status: 'new', sentiment: 'negative', created_at: '2024-01-20T09:30:00Z' },
//         { _id: '3', customer_name: 'Mike Wilson', customer_email: 'mike@logistics.com', subject: 'Tracking Update Request', category: 'shipment_status', priority: 3, status: 'assigned', sentiment: 'positive', created_at: '2024-01-19T15:00:00Z' },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGenerateResponse = async (commId) => {
//     setGenerating(true);
//     try {
//       const res = await communicationAPI.generateResponse(commId);
//       setAiResponse(res.data.data);
//       toast.success('AI response generated');
//     } catch (error) {
//       setAiResponse({ suggested_response: 'Thank you for reaching out. We have received your inquiry and will respond within 24 hours.', quick_response: 'We received your message and will respond soon.' });
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const getCategoryBadge = (category) => {
//     const colors = {
//       rate_request: 'badge-info',
//       shipment_status: 'badge-success',
//       complaint: 'badge-danger',
//       billing_query: 'badge-warning',
//       general_inquiry: 'badge-gray',
//       urgent: 'badge-danger',
//     };
//     return <span className={`badge ${colors[category] || 'badge-gray'}`}>{category?.replace('_', ' ')}</span>;
//   };

//   const getPriorityBadge = (priority) => {
//     if (priority === 1) return <span className="badge badge-danger">High</span>;
//     if (priority === 2) return <span className="badge badge-warning">Medium</span>;
//     return <span className="badge badge-gray">Low</span>;
//   };

//   return (
//     <div className="space-y-6 animate-fadeIn">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
//           <p className="text-gray-600">AI-powered customer communication management</p>
//         </div>
//         <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2">
//           <Plus className="w-5 h-5" />
//           New Communication
//         </button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Communications List */}
//         <div className="lg:col-span-2">
//           <div className="card p-0 overflow-hidden">
//             <div className="p-4 border-b border-gray-200">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input type="text" className="input pl-10" placeholder="Search communications..." />
//               </div>
//             </div>
//             {loading ? (
//               <div className="flex items-center justify-center h-64">
//                 <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
//               </div>
//             ) : (
//               <div className="divide-y divide-gray-200">
//                 {communications.map((comm) => (
//                   <motion.div
//                     key={comm._id}
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     onClick={() => { setSelectedComm(comm); setAiResponse(null); }}
//                     className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedComm?._id === comm._id ? 'bg-primary-50' : ''}`}
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-start gap-3">
//                         <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
//                           <User className="w-5 h-5 text-primary-600" />
//                         </div>
//                         <div>
//                           <p className="font-medium text-gray-900">{comm.customer_name}</p>
//                           <p className="text-sm text-gray-600">{comm.subject}</p>
//                           <div className="flex items-center gap-2 mt-2">
//                             {getCategoryBadge(comm.category)}
//                             {getPriorityBadge(comm.priority)}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="text-right text-sm text-gray-500">
//                         <p>{new Date(comm.created_at).toLocaleDateString()}</p>
//                         <p className="capitalize">{comm.status}</p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Detail Panel */}
//         <div className="space-y-4">
//           {selectedComm ? (
//             <>
//               <div className="card">
//                 <h3 className="font-semibold text-gray-900 mb-4">Communication Details</h3>
//                 <div className="space-y-3">
//                   <div>
//                     <p className="text-sm text-gray-500">From</p>
//                     <p className="font-medium">{selectedComm.customer_name}</p>
//                     <p className="text-sm text-gray-600">{selectedComm.customer_email}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Subject</p>
//                     <p className="font-medium">{selectedComm.subject}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Sentiment</p>
//                     <span className={`badge ${selectedComm.sentiment === 'positive' ? 'badge-success' : selectedComm.sentiment === 'negative' ? 'badge-danger' : 'badge-gray'}`}>
//                       {selectedComm.sentiment}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <button
//                 onClick={() => handleGenerateResponse(selectedComm._id)}
//                 disabled={generating}
//                 className="btn-primary w-full flex items-center justify-center gap-2"
//               >
//                 {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
//                 Generate AI Response
//               </button>

//               {aiResponse && (
//                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card bg-primary-50">
//                   <div className="flex items-center gap-2 mb-3">
//                     <Sparkles className="w-5 h-5 text-primary-600" />
//                     <h3 className="font-semibold text-primary-900">AI Suggested Response</h3>
//                   </div>
//                   <p className="text-sm text-primary-800 whitespace-pre-wrap">{aiResponse.suggested_response}</p>
//                   <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
//                     <Send className="w-4 h-4" />
//                     Send Response
//                   </button>
//                 </motion.div>
//               )}
//             </>
//           ) : (
//             <div className="card text-center py-12 text-gray-500">
//               <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
//               <p>Select a communication to view details</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {showNewModal && (
//         <NewCommunicationModal onClose={() => setShowNewModal(false)} onSuccess={() => { setShowNewModal(false); fetchCommunications(); }} />
//       )}
//     </div>
//   );
// };

// const NewCommunicationModal = ({ onClose, onSuccess }) => {
//   const [formData, setFormData] = useState({ customer_email: '', customer_name: '', subject: '', message: '' });
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await communicationAPI.processIncoming(formData);
//       toast.success('Communication processed with AI');
//       onSuccess();
//     } catch (error) {
//       toast.error('Failed to process');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
//         <div className="p-6 border-b border-gray-200">
//           <h2 className="text-xl font-bold text-gray-900">New Communication</h2>
//         </div>
//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           <div>
//             <label className="label">Customer Email *</label>
//             <input type="email" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} className="input" required />
//           </div>
//           <div>
//             <label className="label">Customer Name</label>
//             <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="input" />
//           </div>
//           <div>
//             <label className="label">Subject *</label>
//             <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="input" required />
//           </div>
//           <div>
//             <label className="label">Message *</label>
//             <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input h-32" required />
//           </div>
//           <div className="flex gap-3 pt-4">
//             <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
//             <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center">
//               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Process with AI'}
//             </button>
//           </div>
//         </form>
//       </motion.div>
//     </div>
//   );
// };

// export default Communications;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Filter, Plus, Sparkles, Loader2, Mail, Clock, User, ChevronRight, Send, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { communicationAPI } from '../services/api';

const Communications = () => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComm, setSelectedComm] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const res = await communicationAPI.getCommunications();
      setCommunications(res.data.data.items || []);
    } catch (error) {
      setCommunications([
        { _id: '1', customer_name: 'John Smith', customer_email: 'john@example.com', subject: 'Rate Request for Q2', category: 'rate_request', priority: 2, status: 'new', sentiment: 'neutral', created_at: '2024-01-20T10:00:00Z' },
        { _id: '2', customer_name: 'Sarah Johnson', customer_email: 'sarah@company.com', subject: 'Shipment Delay Issue', category: 'complaint', priority: 1, status: 'new', sentiment: 'negative', created_at: '2024-01-20T09:30:00Z' },
        { _id: '3', customer_name: 'Mike Wilson', customer_email: 'mike@logistics.com', subject: 'Tracking Update Request', category: 'shipment_status', priority: 3, status: 'assigned', sentiment: 'positive', created_at: '2024-01-19T15:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResponse = async (commId) => {
    setGenerating(true);
    try {
      const res = await communicationAPI.generateResponse(commId);
      setAiResponse(res.data.data);
      toast.success('AI response generated');
    } catch (error) {
      setAiResponse({ suggested_response: 'Thank you for reaching out. We have received your inquiry and will respond within 24 hours.', quick_response: 'We received your message and will respond soon.' });
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      rate_request: 'badge-info',
      shipment_status: 'badge-success',
      complaint: 'badge-danger',
      billing_query: 'badge-warning',
      general_inquiry: 'badge-gray',
      urgent: 'badge-danger',
    };
    return <span className={`badge ${colors[category] || 'badge-gray'}`}>{category?.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority) => {
    if (priority === 1) return <span className="badge badge-danger">High</span>;
    if (priority === 2) return <span className="badge badge-warning">Medium</span>;
    return <span className="badge badge-gray">Low</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">AI-powered customer communication management</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Communication
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Communications List */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" className="input pl-10" placeholder="Search communications..." />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {communications.map((comm) => (
                  <motion.div
                    key={comm._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => { setSelectedComm(comm); setAiResponse(null); }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedComm?._id === comm._id ? 'bg-primary-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{comm.customer_name}</p>
                          <p className="text-sm text-gray-600">{comm.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {getCategoryBadge(comm.category)}
                            {getPriorityBadge(comm.priority)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{new Date(comm.created_at).toLocaleDateString()}</p>
                        <p className="capitalize">{comm.status}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedComm ? (
            <>
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Communication Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{selectedComm.customer_name}</p>
                    <p className="text-sm text-gray-600">{selectedComm.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subject</p>
                    <p className="font-medium">{selectedComm.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sentiment</p>
                    <span className={`badge ${selectedComm.sentiment === 'positive' ? 'badge-success' : selectedComm.sentiment === 'negative' ? 'badge-danger' : 'badge-gray'}`}>
                      {selectedComm.sentiment}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleGenerateResponse(selectedComm._id)}
                disabled={generating}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate AI Response
              </button>

              {aiResponse && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card bg-primary-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-primary-900">AI Suggested Response</h3>
                  </div>
                  <p className="text-sm text-primary-800 whitespace-pre-wrap">{aiResponse.suggested_response}</p>
                  <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Response
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Empty State Message */}
              <div className="card text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a communication to view details</p>
              </div>

              {/* Mailbox Component */}
              <MailboxComposer />
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewCommunicationModal onClose={() => setShowNewModal(false)} onSuccess={() => { setShowNewModal(false); fetchCommunications(); }} />
      )}
    </div>
  );
};

// Mailbox Composer Component
const MailboxComposer = () => {
  const [mailData, setMailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });
  const [sending, setSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const handleInputChange = (field, value) => {
    setMailData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      size: file.size,
      file: file
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSendMail = async () => {
    // Validate required fields
    if (!mailData.to.trim()) {
      toast.error('Please enter recipient email address');
      return;
    }
    if (!mailData.subject.trim()) {
      toast.error('Please enter email subject');
      return;
    }
    if (!mailData.body.trim()) {
      toast.error('Please enter email body');
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = mailData.to.split(',').map(e => e.trim());
    const invalidEmails = toEmails.filter(e => !emailRegex.test(e));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email address: ${invalidEmails[0]}`);
      return;
    }

    setSending(true);
    
    try {
      // Prepare email data for API call
      // This structure is ready for Python backend integration
      const emailPayload = {
        to: toEmails,
        cc: mailData.cc ? mailData.cc.split(',').map(e => e.trim()).filter(e => e) : [],
        bcc: mailData.bcc ? mailData.bcc.split(',').map(e => e.trim()).filter(e => e) : [],
        subject: mailData.subject,
        body: mailData.body,
        attachments: attachments.map(a => ({
          filename: a.name,
          size: a.size
        })),
        sent_at: new Date().toISOString()
      };

      // API call placeholder - will be replaced with actual Python backend endpoint
      // await communicationAPI.sendEmail(emailPayload);
      
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log the payload for debugging (useful for Python integration)
      console.log('Email payload ready for backend:', emailPayload);
      
      toast.success('Email sent successfully!');
      
      // Reset form
      setMailData({ to: '', cc: '', bcc: '', subject: '', body: '' });
      setAttachments([]);
      setShowCcBcc(false);
      
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      ...mailData,
      attachments: attachments.map(a => ({ filename: a.name, size: a.size })),
      saved_at: new Date().toISOString()
    };
    
    // Save to localStorage for persistence
    const existingDrafts = JSON.parse(localStorage.getItem('emailDrafts') || '[]');
    existingDrafts.push(draftData);
    localStorage.setItem('emailDrafts', JSON.stringify(existingDrafts));
    
    toast.success('Draft saved');
    console.log('Draft saved:', draftData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <Mail className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">Compose Email</h3>
      </div>

      <div className="space-y-3">
        {/* To Field */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">To *</label>
            <button 
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              {showCcBcc ? 'Hide' : 'Show'} Cc/Bcc
            </button>
          </div>
          <input
            type="text"
            value={mailData.to}
            onChange={(e) => handleInputChange('to', e.target.value)}
            placeholder="recipient@example.com"
            className="input mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
        </div>

        {/* Cc/Bcc Fields */}
        {showCcBcc && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Cc</label>
              <input
                type="text"
                value={mailData.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                placeholder="cc@example.com"
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bcc</label>
              <input
                type="text"
                value={mailData.bcc}
                onChange={(e) => handleInputChange('bcc', e.target.value)}
                placeholder="bcc@example.com"
                className="input mt-1"
              />
            </div>
          </motion.div>
        )}

        {/* Subject Field */}
        <div>
          <label className="text-sm font-medium text-gray-700">Subject *</label>
          <input
            type="text"
            value={mailData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Enter email subject"
            className="input mt-1"
          />
        </div>

        {/* Body Field */}
        <div>
          <label className="text-sm font-medium text-gray-700">Message *</label>
          <textarea
            value={mailData.body}
            onChange={(e) => handleInputChange('body', e.target.value)}
            placeholder="Write your message here..."
            className="input mt-1 h-32 resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="text-sm font-medium text-gray-700">Attachments</label>
          <div className="mt-1">
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Add attachments</span>
              <input
                type="file"
                multiple
                onChange={handleFileAttachment}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn-secondary flex-1 text-sm"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSendMail}
            disabled={sending}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const NewCommunicationModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ customer_email: '', customer_name: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await communicationAPI.processIncoming(formData);
      toast.success('Communication processed with AI');
      onSuccess();
    } catch (error) {
      toast.error('Failed to process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">New Communication</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Customer Email *</label>
            <input type="email" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">Customer Name</label>
            <input type="text" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Subject *</label>
            <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input h-32" required />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Process with AI'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Communications;