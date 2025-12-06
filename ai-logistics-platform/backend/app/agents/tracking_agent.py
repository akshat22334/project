"""
Autonomous Execution & Predictive Tracking Agent

Capabilities:
- IoT sensors feed GPS and temperature data into AI models
- Detect route deviations and predict ETA delays
- Trigger corrective actions (rerouting, driver alerts)
- Dashboard provides unified visibility across all shipments
- Dynamic route optimization based on traffic and conditions
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import math
import random

from .base_agent import BaseAgent


class TrackingAgent(BaseAgent):
    """AI Agent for Autonomous Shipment Tracking and Route Optimization"""
    
    def __init__(self):
        super().__init__(
            name="TrackingAgent",
            description="Predictive tracking, route optimization, and proactive alert management"
        )
        
        # Alert thresholds
        self.temperature_thresholds = {
            "cold_chain": {"min": -25, "max": -18},
            "refrigerated": {"min": 0, "max": 8},
            "ambient": {"min": 15, "max": 30}
        }
        
        # Speed thresholds for anomaly detection
        self.speed_thresholds = {
            "min_moving": 5,  # km/h
            "max_highway": 130,  # km/h
            "stopped_threshold": 30  # minutes
        }
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing entry point"""
        action = input_data.get("action", "track")
        
        if action == "update_location":
            return await self.update_location(input_data)
        elif action == "predict_eta":
            return await self.predict_eta(input_data)
        elif action == "optimize_route":
            return await self.optimize_route(input_data)
        elif action == "detect_anomaly":
            return await self.detect_anomaly(input_data)
        elif action == "check_temperature":
            return await self.check_temperature(input_data)
        elif action == "generate_alerts":
            return await self.generate_alerts(input_data)
        elif action == "full_tracking_analysis":
            return await self.full_tracking_analysis(input_data)
        else:
            return await self.full_tracking_analysis(input_data)
    
    async def update_location(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process GPS location update"""
        shipment_id = input_data.get("shipment_id")
        gps_data = input_data.get("gps_data", {})
        previous_location = input_data.get("previous_location")
        
        self.log_action("update_location", {"shipment_id": shipment_id})
        
        # Calculate speed if previous location available
        speed = None
        if previous_location:
            speed = self._calculate_speed(previous_location, gps_data)
        
        # Check for anomalies
        anomaly_check = await self.detect_anomaly({
            "current_location": gps_data,
            "previous_location": previous_location,
            "speed": speed
        })
        
        return {
            "success": True,
            "shipment_id": shipment_id,
            "location_recorded": True,
            "current_speed": speed,
            "anomaly_detected": anomaly_check.get("anomaly_detected", False),
            "anomaly_details": anomaly_check.get("anomalies", []),
            "updated_at": datetime.utcnow().isoformat()
        }
    
    def _calculate_speed(self, prev: Dict, current: Dict) -> float:
        """Calculate speed between two GPS points"""
        try:
            # Haversine formula for distance
            R = 6371  # Earth's radius in km
            
            lat1 = math.radians(prev.get("latitude", 0))
            lat2 = math.radians(current.get("latitude", 0))
            dlat = lat2 - lat1
            dlon = math.radians(current.get("longitude", 0) - prev.get("longitude", 0))
            
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c  # Distance in km
            
            # Calculate time difference
            prev_time = datetime.fromisoformat(prev.get("timestamp", datetime.utcnow().isoformat()))
            curr_time = datetime.fromisoformat(current.get("timestamp", datetime.utcnow().isoformat()))
            time_diff = (curr_time - prev_time).total_seconds() / 3600  # Hours
            
            if time_diff > 0:
                return round(distance / time_diff, 2)  # km/h
            return 0
        except Exception:
            return 0
    
    async def predict_eta(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict estimated time of arrival using AI"""
        shipment_data = input_data.get("shipment_data", {})
        current_location = input_data.get("current_location", {})
        destination = input_data.get("destination", {})
        traffic_conditions = input_data.get("traffic_conditions", "normal")
        weather_conditions = input_data.get("weather_conditions", "clear")
        historical_data = input_data.get("historical_data", {})
        
        self.log_action("predict_eta", {"shipment": shipment_data.get("tracking_number")})
        
        system_prompt = """You are an expert logistics AI that predicts delivery times with high accuracy.
        
Consider:
- Current location and distance to destination
- Traffic conditions (heavy, moderate, light, normal)
- Weather conditions
- Historical delivery patterns
- Time of day and day of week
- Type of shipment and carrier

Provide realistic ETA predictions with confidence levels."""

        user_prompt = f"""Predict ETA for this shipment:

Shipment Info:
{json.dumps(shipment_data, indent=2)}

Current Location:
Lat: {current_location.get('latitude', 'N/A')}
Lon: {current_location.get('longitude', 'N/A')}

Destination: {json.dumps(destination, indent=2)}

Conditions:
- Traffic: {traffic_conditions}
- Weather: {weather_conditions}

Historical Avg Delivery Time: {historical_data.get('avg_delivery_time', 'Unknown')}

Provide prediction in JSON format with:
- predicted_eta (ISO datetime string)
- eta_range_min (ISO datetime)
- eta_range_max (ISO datetime)
- confidence (0-1)
- delay_probability (0-1)
- delay_reasons (list of potential delay factors)
- recommendations (list of suggestions to ensure on-time delivery)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "eta_prediction": result,
            "prediction_accuracy": result.get("confidence", 0.8),
            "predicted_at": datetime.utcnow().isoformat()
        }
    
    async def optimize_route(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize delivery route using AI"""
        current_location = input_data.get("current_location", {})
        destination = input_data.get("destination", {})
        waypoints = input_data.get("waypoints", [])
        constraints = input_data.get("constraints", {})
        traffic_data = input_data.get("traffic_data", {})
        
        self.log_action("optimize_route")
        
        system_prompt = """You are an expert route optimization AI for logistics operations.
        
Optimize routes considering:
- Distance and travel time
- Traffic conditions
- Fuel efficiency
- Driver hours of service
- Delivery time windows
- Vehicle capacity and restrictions

Provide detailed route recommendations with alternatives."""

        user_prompt = f"""Optimize the route for this delivery:

Current Location:
{json.dumps(current_location, indent=2)}

Destination:
{json.dumps(destination, indent=2)}

Waypoints to include:
{json.dumps(waypoints, indent=2)}

Constraints:
{json.dumps(constraints, indent=2)}

Current Traffic Conditions:
{json.dumps(traffic_data, indent=2)}

Provide optimization in JSON format with:
- primary_route (description and key waypoints)
- estimated_distance_km
- estimated_time_minutes
- fuel_estimate_liters
- alternative_routes (list of alternatives with time/distance)
- optimization_savings (time and cost savings vs default route)
- waypoint_sequence (optimal order to visit waypoints)
- traffic_alerts (areas to avoid)
- recommendations (driving tips for efficiency)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "route_optimization": result,
            "optimized_at": datetime.utcnow().isoformat()
        }
    
    async def detect_anomaly(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect anomalies in shipment tracking data"""
        current_location = input_data.get("current_location", {})
        previous_location = input_data.get("previous_location")
        expected_route = input_data.get("expected_route", [])
        speed = input_data.get("speed")
        
        self.log_action("detect_anomaly")
        
        anomalies = []
        
        # Check speed anomalies
        if speed is not None:
            if speed > self.speed_thresholds["max_highway"]:
                anomalies.append({
                    "type": "excessive_speed",
                    "value": speed,
                    "threshold": self.speed_thresholds["max_highway"],
                    "severity": "high"
                })
            elif speed < self.speed_thresholds["min_moving"] and previous_location:
                anomalies.append({
                    "type": "stopped_or_very_slow",
                    "value": speed,
                    "severity": "medium"
                })
        
        # Check route deviation
        if expected_route and current_location:
            is_on_route = self._check_route_deviation(current_location, expected_route)
            if not is_on_route:
                anomalies.append({
                    "type": "route_deviation",
                    "current_location": current_location,
                    "severity": "medium"
                })
        
        # If anomalies found, get AI analysis
        ai_analysis = None
        if anomalies:
            ai_analysis = await self._analyze_anomalies(anomalies, current_location)
        
        return {
            "success": True,
            "anomaly_detected": len(anomalies) > 0,
            "anomalies": anomalies,
            "ai_analysis": ai_analysis,
            "checked_at": datetime.utcnow().isoformat()
        }
    
    def _check_route_deviation(self, current: Dict, route: List[Dict], threshold_km: float = 5.0) -> bool:
        """Check if current location is within threshold of expected route"""
        if not route:
            return True
        
        # Simplified check - in production would use proper geospatial calculations
        for point in route:
            distance = self._calculate_distance(current, point)
            if distance <= threshold_km:
                return True
        return False
    
    def _calculate_distance(self, point1: Dict, point2: Dict) -> float:
        """Calculate distance between two points in km"""
        R = 6371
        lat1, lat2 = math.radians(point1.get("latitude", 0)), math.radians(point2.get("latitude", 0))
        dlat = lat2 - lat1
        dlon = math.radians(point2.get("longitude", 0) - point1.get("longitude", 0))
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    async def _analyze_anomalies(self, anomalies: List[Dict], location: Dict) -> Dict[str, Any]:
        """Get AI analysis of detected anomalies"""
        system_prompt = """You are an expert at analyzing logistics anomalies and suggesting corrective actions.
        
Analyze the detected anomalies and provide:
1. Root cause analysis
2. Risk assessment
3. Recommended corrective actions
4. Communication suggestions (who to notify)"""

        user_prompt = f"""Analyze these shipment anomalies:

Anomalies Detected:
{json.dumps(anomalies, indent=2)}

Current Location:
{json.dumps(location, indent=2)}

Provide analysis in JSON format with:
- risk_level (low, medium, high, critical)
- likely_causes (list)
- recommended_actions (list of immediate actions)
- notifications_needed (list of stakeholders to notify)
- follow_up_required (boolean)
- escalation_needed (boolean)"""

        return await self.generate_structured_response(system_prompt, user_prompt)
    
    async def check_temperature(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check temperature readings for cold chain shipments"""
        temperature_data = input_data.get("temperature_data", {})
        shipment_type = input_data.get("shipment_type", "ambient")
        
        self.log_action("check_temperature", {"type": shipment_type})
        
        thresholds = self.temperature_thresholds.get(shipment_type, self.temperature_thresholds["ambient"])
        current_temp = temperature_data.get("value", 20)
        
        alerts = []
        is_compliant = True
        
        if current_temp < thresholds["min"]:
            is_compliant = False
            alerts.append({
                "type": "temperature_low",
                "current": current_temp,
                "threshold": thresholds["min"],
                "severity": "high",
                "action": "Increase temperature immediately"
            })
        elif current_temp > thresholds["max"]:
            is_compliant = False
            alerts.append({
                "type": "temperature_high",
                "current": current_temp,
                "threshold": thresholds["max"],
                "severity": "high",
                "action": "Reduce temperature immediately"
            })
        
        return {
            "success": True,
            "temperature_compliant": is_compliant,
            "current_temperature": current_temp,
            "required_range": thresholds,
            "alerts": alerts,
            "checked_at": datetime.utcnow().isoformat()
        }
    
    async def generate_alerts(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate alerts based on tracking data"""
        shipment_data = input_data.get("shipment_data", {})
        anomalies = input_data.get("anomalies", [])
        eta_status = input_data.get("eta_status", {})
        temperature_status = input_data.get("temperature_status", {})
        
        self.log_action("generate_alerts")
        
        alerts = []
        
        # Process anomaly alerts
        for anomaly in anomalies:
            alerts.append({
                "type": f"anomaly_{anomaly.get('type', 'unknown')}",
                "severity": anomaly.get("severity", "medium"),
                "title": f"Anomaly Detected: {anomaly.get('type', 'Unknown').replace('_', ' ').title()}",
                "message": f"Anomaly detected for shipment. Value: {anomaly.get('value', 'N/A')}",
                "shipment_id": shipment_data.get("id"),
                "created_at": datetime.utcnow().isoformat()
            })
        
        # ETA delay alerts
        if eta_status.get("delay_probability", 0) > 0.5:
            alerts.append({
                "type": "eta_delay_risk",
                "severity": "medium" if eta_status["delay_probability"] < 0.8 else "high",
                "title": "Potential Delivery Delay",
                "message": f"High probability of delay: {eta_status['delay_probability']*100:.0f}%",
                "shipment_id": shipment_data.get("id"),
                "created_at": datetime.utcnow().isoformat()
            })
        
        # Temperature alerts
        if not temperature_status.get("temperature_compliant", True):
            for temp_alert in temperature_status.get("alerts", []):
                alerts.append({
                    "type": "temperature_excursion",
                    "severity": temp_alert.get("severity", "high"),
                    "title": "Temperature Excursion Detected",
                    "message": f"Temperature: {temp_alert.get('current')}°C (Required: {temp_alert.get('threshold')}°C)",
                    "action": temp_alert.get("action"),
                    "shipment_id": shipment_data.get("id"),
                    "created_at": datetime.utcnow().isoformat()
                })
        
        return {
            "success": True,
            "alerts": alerts,
            "alert_count": len(alerts),
            "high_priority_count": sum(1 for a in alerts if a.get("severity") == "high"),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def full_tracking_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive tracking analysis"""
        shipment_data = input_data.get("shipment_data", {})
        current_location = input_data.get("current_location", {})
        previous_location = input_data.get("previous_location")
        destination = input_data.get("destination", {})
        temperature_data = input_data.get("temperature_data")
        shipment_type = input_data.get("shipment_type", "ambient")
        
        self.log_action("full_tracking_analysis", {"shipment": shipment_data.get("tracking_number")})
        
        # Update location
        location_update = await self.update_location({
            "shipment_id": shipment_data.get("id"),
            "gps_data": current_location,
            "previous_location": previous_location
        })
        
        # Predict ETA
        eta_prediction = await self.predict_eta({
            "shipment_data": shipment_data,
            "current_location": current_location,
            "destination": destination
        })
        
        # Check temperature if applicable
        temperature_check = None
        if temperature_data:
            temperature_check = await self.check_temperature({
                "temperature_data": temperature_data,
                "shipment_type": shipment_type
            })
        
        # Generate alerts
        alerts = await self.generate_alerts({
            "shipment_data": shipment_data,
            "anomalies": location_update.get("anomaly_details", []),
            "eta_status": eta_prediction.get("eta_prediction", {}),
            "temperature_status": temperature_check or {}
        })
        
        return {
            "success": True,
            "tracking_analysis": {
                "location_update": location_update,
                "eta_prediction": eta_prediction,
                "temperature_check": temperature_check,
                "alerts": alerts
            },
            "analysis_timestamp": datetime.utcnow().isoformat()
        }


# Create singleton instance
tracking_agent = TrackingAgent()
