import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import PartnerDetail from './pages/PartnerDetail';
import Communications from './pages/Communications';
import Shipments from './pages/Shipments';
import ShipmentDetail from './pages/ShipmentDetail';
import PODManagement from './pages/PODManagement';
import Billing from './pages/Billing';
import InvoiceDetail from './pages/InvoiceDetail';
import AIAgents from './pages/AIAgents';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="partners" element={<Partners />} />
          <Route path="partners/:id" element={<PartnerDetail />} />
          <Route path="communications" element={<Communications />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/:id" element={<ShipmentDetail />} />
          <Route path="pod" element={<PODManagement />} />
          <Route path="billing" element={<Billing />} />
          <Route path="billing/:id" element={<InvoiceDetail />} />
          <Route path="ai-agents" element={<AIAgents />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
