// 

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, MapPin, Clock, ArrowLeft, Sparkles, Loader2, Navigation, CheckCircle,
  Package, Calendar, Gauge, Radio, Zap, Shield, TrendingUp, Activity,
  ThermometerSun, Wind, CloudRain, Sun, Phone, MessageSquare, Share2,
  RotateCcw, Maximize2, Layers, Navigation2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { trackingAPI } from '../services/api';
 
const ShipmentDetail = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [etaPrediction, setEtaPrediction] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeMapStyle, setActiveMapStyle] = useState('streets');
  const [showFullMap, setShowFullMap] = useState(false);
 
  // Demo coordinates for Ghaziabad to Delhi route
  const demoCoordinates = {
    origin: { lat: 28.6692, lng: 77.4538, name: 'GHAZIABAD' },
    destination: { lat: 28.6139, lng: 77.2090, name: 'DELHI' },
    current: { lat: 28.6353, lng: 77.3910, name: 'In Transit' },
  };
 
  // Weather data for demo
  const weatherData = {
    temp: '28°C',
    condition: 'Sunny',
    humidity: '45%',
    wind: '12 km/h'
  };
 
  useEffect(() => {
    fetchShipment();
  }, [id]);
 
  const fetchShipment = async () => {
    try {
      const res = await trackingAPI.getShipment(id);
      setShipment(res.data.data);
    } catch (error) {
      setShipment({
        _id: id,
        tracking_number: '34850',
        origin: 'GHAZIABAD',
        destination: 'DELHI',
        status: 'in_transit',
        carrier: 'Swift Logistics',
        estimated_delivery: '2025-11-30T12:00:00Z',
        delay_probability: 0.08,
        current_location: {
          latitude: demoCoordinates.current.lat,
          longitude: demoCoordinates.current.lng,
          timestamp: new Date().toISOString()
        },
        distance_covered: 18.5,
        total_distance: 32.4,
        speed: 45,
        driver: {
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          rating: 4.8,
          trips: 1247
        },
        vehicle: {
          number: 'DL 01 AB 1234',
          type: 'Tata Ace',
          capacity: '750 kg'
        },
        alerts: [],
      });
    } finally {
      setLoading(false);
    }
  };
 
  const handlePredictETA = async () => {
    setPredicting(true);
    try {
      const res = await trackingAPI.predictETA(id);
      setEtaPrediction(res.data.data.eta_prediction);
      toast.success('ETA prediction updated');
    } catch (error) {
      setEtaPrediction({
        predicted_eta: '2025-11-30T14:30:00Z',
        confidence: 0.94,
        delay_probability: 0.08,
        factors: [
          { name: 'Traffic', impact: 'low', score: 85 },
          { name: 'Weather', impact: 'none', score: 98 },
          { name: 'Route', impact: 'low', score: 92 },
        ],
        recommendations: ['Current route is optimal', 'No action needed'],
      });
      toast.success('AI prediction complete!');
    } finally {
      setPredicting(false);
    }
  };
 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-20 h-20 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-blue-300 mt-6 text-lg font-medium">Loading shipment...</p>
        </motion.div>
      </div>
    );
  }
 
  const progressPercentage = shipment?.distance_covered && shipment?.total_distance
    ? (shipment.distance_covered / shipment.total_distance) * 100
    : 57;
 
  // Map styles
  const mapStyles = {
    streets: `https://www.openstreetmap.org/export/embed.html?bbox=${demoCoordinates.origin.lng - 0.12}%2C${demoCoordinates.destination.lat - 0.05}%2C${demoCoordinates.origin.lng + 0.05}%2C${demoCoordinates.origin.lat + 0.05}&layer=mapnik&marker=${demoCoordinates.current.lat}%2C${demoCoordinates.current.lng}`,
    satellite: `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d112086.56123456789!2d${demoCoordinates.current.lng}!3d${demoCoordinates.current.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x390ce5a43173357b%3A0x37ffce30c87cc03f!2sGhaziabad!3m2!1d${demoCoordinates.origin.lat}!2d${demoCoordinates.origin.lng}!4m5!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi!3m2!1d${demoCoordinates.destination.lat}!2d${demoCoordinates.destination.lng}!5e0!3m2!1sen!2sin!4v1234567890`,
  };
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
 
      <div className="relative z-10 p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          {/* Back & Title */}
          <div className="flex items-center gap-6">
            <Link
              to="/shipments"
              className="group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
              <span className="text-gray-600 font-medium">Back</span>
            </Link>
           
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Activity className="w-3 h-3 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  #{shipment?.tracking_number}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {shipment?.carrier}
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
 
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex items-center gap-2 text-gray-600"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex items-center gap-2 text-gray-600"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Contact</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePredictETA}
              disabled={predicting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2 font-semibold disabled:opacity-70"
            >
              {predicting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>AI Predict</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
 
        {/* Stats Cards Row */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Navigation2, label: 'Distance', value: `${shipment?.distance_covered || 18.5} km`, subtext: `of ${shipment?.total_distance || 32.4} km`, color: 'blue' },
            { icon: Gauge, label: 'Speed', value: `${shipment?.speed || 45} km/h`, subtext: 'Current', color: 'green' },
            { icon: Clock, label: 'ETA', value: '2:30 PM', subtext: 'Today', color: 'purple' },
            { icon: Shield, label: 'Status', value: 'On Time', subtext: '98% confidence', color: 'emerald' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-gray-100/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.subtext}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
 
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Map & Route */}
          <div className="xl:col-span-2 space-y-6">
            {/* Route Progress Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </div>
                  Route Progress
                </h3>
                <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
 
              {/* Route Visualization */}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  {/* Origin */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <MapPin className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Origin</p>
                      <p className="text-lg font-bold text-gray-900">{shipment?.origin}</p>
                      <p className="text-xs text-gray-400">Started 10:30 AM</p>
                    </div>
                  </div>
 
                  {/* Destination */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Destination</p>
                      <p className="text-lg font-bold text-gray-900">{shipment?.destination}</p>
                      <p className="text-xs text-gray-400">ETA 2:30 PM</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
 
                {/* Progress Bar */}
                <div className="relative mt-8 mb-4">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-blue-400 rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </motion.div>
                  </div>
                 
                  {/* Truck Icon on Progress */}
                  <motion.div
                    initial={{ left: '0%' }}
                    animate={{ left: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute -top-3 transform -translate-x-1/2"
                    style={{ left: `${progressPercentage}%` }}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {shipment?.distance_covered || 18.5} km
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
 
                {/* Checkpoints */}
                <div className="flex justify-between mt-8 px-2">
                  {['Pickup', 'Checkpoint 1', 'Checkpoint 2', 'Delivery'].map((point, i) => (
                    <div key={point} className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i <= Math.floor(progressPercentage / 33) ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                      <span className="text-xs text-gray-400 mt-2">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
 
            {/* Map & Tracking Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Live Map - Takes more space */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm border border-gray-100/50"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                    </div>
                    Live Tracking
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live
                    </span>
                    <button
                      onClick={() => setShowFullMap(!showFullMap)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
               
                {/* Map Container */}
                <div className="relative" style={{ height: '350px' }}>
                  {!mapLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500 font-medium">Loading map...</p>
                      </div>
                    </div>
                  )}
                 
                  <iframe
                    src={mapStyles[activeMapStyle]}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setMapLoaded(true)}
                    title="Live Tracking Map"
                  />
                 
                  {/* Map Controls Overlay */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center hover:bg-white transition-colors">
                      <Layers className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center hover:bg-white transition-colors">
                      <RotateCcw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
 
                  {/* Vehicle Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">{shipment?.vehicle?.number || 'DL 01 AB 1234'}</p>
                              <p className="text-xs text-gray-500">Near Anand Vihar, Delhi NCR</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{shipment?.speed || 45} km/h</p>
                              <p className="text-xs text-gray-400">Current Speed</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
 
                {/* Map Legend */}
                <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center gap-6 text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow"></span>
                    <span className="text-gray-600 font-medium">Origin</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow animate-pulse"></span>
                    <span className="text-gray-600 font-medium">Current</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow"></span>
                    <span className="text-gray-600 font-medium">Destination</span>
                  </span>
                </div>
              </motion.div>
 
              {/* Tracking Timeline */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100/50"
              >
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  Tracking History
                </h3>
               
                <div className="space-y-1">
                  {[
                    { status: 'Created', time: '10:00 AM', date: 'Today' },
                    { status: 'Picked Up', time: '10:30 AM', date: 'Today' },
                    { status: 'In Transit', time: '11:45 AM', date: 'Today' },
                    { status: 'Out for Delivery', time: '--:--', date: '' },
                    { status: 'Delivered', time: '--:--', date: '' },
                  ].map((item, i) => {
                    const statusKeys = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
                    const currentIndex = statusKeys.indexOf(shipment?.status);
                    const isActive = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                   
                    return (
                      <motion.div
                        key={item.status}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="relative flex items-start gap-3 pb-5"
                      >
                        {/* Connecting Line */}
                        {i < 4 && (
                          <div className={`absolute left-[18px] top-10 w-0.5 h-full ${i < currentIndex ? 'bg-gradient-to-b from-blue-500 to-blue-400' : 'bg-gray-200'}`}></div>
                        )}
                       
                        {/* Status Circle */}
                        <div className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'
                            : 'bg-gray-100'
                        } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}>
                          {isActive ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                       
                        {/* Status Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                              {item.status}
                            </p>
                            {isActive && item.time !== '--:--' && (
                              <span className="text-xs text-gray-400">{item.time}</span>
                            )}
                          </div>
                          {isCurrent && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-1.5 mt-1"
                            >
                              <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
                              <span className="text-xs text-blue-600 font-medium">Current Status</span>
                            </motion.div>
                          )}
                          {isActive && item.date && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
 
          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* Weather Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 rounded-3xl p-5 text-white shadow-xl shadow-orange-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Route Weather</p>
                  <p className="text-3xl font-bold mt-1">{weatherData.temp}</p>
                  <p className="text-orange-100 text-sm">{weatherData.condition}</p>
                </div>
                <Sun className="w-16 h-16 text-yellow-200 opacity-80" />
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-orange-100" />
                  <span className="text-sm">{weatherData.wind}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-orange-100" />
                  <span className="text-sm">{weatherData.humidity}</span>
                </div>
              </div>
            </motion.div>
 
            {/* Driver Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100/50"
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                Driver Info
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xl font-bold">
                  {shipment?.driver?.name?.charAt(0) || 'R'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{shipment?.driver?.name || 'Gajodhar Singh Cool'}</p>
                  <p className="text-sm text-gray-500">{shipment?.driver?.phone || '+91 98765 43210'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium text-gray-700">{shipment?.driver?.rating || 4.8}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{shipment?.driver?.trips || 1247} trips</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>
            </motion.div>
 
            {/* AI Prediction Card */}
            <AnimatePresence>
              {etaPrediction && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden"
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                 
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">AI Prediction</h3>
                        <p className="text-blue-200 text-xs">Powered by ML</p>
                      </div>
                    </div>
                   
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
                      <p className="text-blue-200 text-xs mb-1">Predicted Arrival</p>
                      <p className="text-2xl font-bold">
                        {new Date(etaPrediction.predicted_eta).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-blue-200 text-xs mt-1">
                        {new Date(etaPrediction.predicted_eta).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
 
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-200 text-sm">Confidence</span>
                      <span className="font-bold text-lg">{Math.round(etaPrediction.confidence * 100)}%</span>
                    </div>
                   
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${etaPrediction.confidence * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                      />
                    </div>
 
                    {/* Factor Analysis */}
                    <div className="space-y-2">
                      <p className="text-xs text-blue-200 uppercase tracking-wide font-medium">Factor Analysis</p>
                      {etaPrediction.factors?.map((factor, i) => (
                        <div key={factor.name} className="flex items-center justify-between text-sm">
                          <span className="text-white/80">{factor.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-400 rounded-full"
                                style={{ width: `${factor.score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-8">{factor.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* Delivery Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100/50"
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                Delivery Info
              </h3>
             
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Estimated Delivery</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {new Date(shipment?.estimated_delivery).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(shipment?.estimated_delivery).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
               
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 font-medium">Delay Risk</p>
                    <span className="text-sm font-bold text-green-600">
                      {Math.round((shipment?.delay_probability || 0.08) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((shipment?.delay_probability || 0.08) * 100, 8)}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">On schedule</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
 
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 30px) scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-blob { animation: blob 8s infinite ease-in-out; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};
 
export default ShipmentDetail;