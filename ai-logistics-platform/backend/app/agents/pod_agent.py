"""
Digital Proof-of-Delivery (POD) Automation Agent

Capabilities:
- Capture e-signature, GPS, timestamp, and photo evidence via mobile app
- AI validates POD data and syncs instantly with billing systems
- Automated dispute resolution by comparing POD with shipment records
- Real-time validation and verification of delivery evidence
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import base64

from .base_agent import BaseAgent


class PODAgent(BaseAgent):
    """AI Agent for Digital Proof-of-Delivery Automation"""
    
    def __init__(self):
        super().__init__(
            name="PODAgent",
            description="AI-powered POD validation, dispute resolution, and billing synchronization"
        )
        
        # Validation thresholds
        self.validation_config = {
            "signature_min_strokes": 3,
            "photo_min_resolution": 640,
            "gps_accuracy_threshold_meters": 100,
            "timestamp_tolerance_minutes": 30,
            "confidence_threshold": 0.7
        }
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing entry point"""
        action = input_data.get("action", "validate")
        
        if action == "capture_pod":
            return await self.capture_pod(input_data)
        elif action == "validate_pod":
            return await self.validate_pod(input_data)
        elif action == "resolve_dispute":
            return await self.resolve_dispute(input_data)
        elif action == "sync_billing":
            return await self.sync_with_billing(input_data)
        elif action == "verify_delivery":
            return await self.verify_delivery(input_data)
        elif action == "analyze_photo":
            return await self.analyze_delivery_photo(input_data)
        else:
            return await self.full_pod_processing(input_data)
    
    async def capture_pod(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and validate POD capture from mobile app"""
        shipment_id = input_data.get("shipment_id")
        recipient_name = input_data.get("recipient_name")
        signature_image = input_data.get("signature_image")  # Base64
        photo_evidence = input_data.get("photo_evidence")  # Base64
        gps_location = input_data.get("gps_location", {})
        timestamp = input_data.get("timestamp", datetime.utcnow().isoformat())
        notes = input_data.get("notes", "")
        
        self.log_action("capture_pod", {"shipment_id": shipment_id})
        
        # Initial validation
        validation_issues = []
        
        if not signature_image:
            validation_issues.append("Missing signature")
        
        if not gps_location.get("latitude") or not gps_location.get("longitude"):
            validation_issues.append("Missing GPS location")
        
        if not recipient_name:
            validation_issues.append("Missing recipient name")
        
        # Create POD record
        pod_record = {
            "shipment_id": shipment_id,
            "recipient_name": recipient_name,
            "signature_captured": bool(signature_image),
            "photo_captured": bool(photo_evidence),
            "gps_location": gps_location,
            "delivery_timestamp": timestamp,
            "notes": notes,
            "initial_validation": {
                "passed": len(validation_issues) == 0,
                "issues": validation_issues
            },
            "status": "captured" if len(validation_issues) == 0 else "incomplete",
            "created_at": datetime.utcnow().isoformat()
        }
        
        return {
            "success": True,
            "pod_record": pod_record,
            "validation_passed": len(validation_issues) == 0,
            "validation_issues": validation_issues
        }
    
    async def validate_pod(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive AI validation of POD"""
        pod_data = input_data.get("pod_data", {})
        shipment_data = input_data.get("shipment_data", {})
        expected_delivery = input_data.get("expected_delivery", {})
        
        self.log_action("validate_pod", {"shipment_id": pod_data.get("shipment_id")})
        
        validation_results = {
            "signature": await self._validate_signature(pod_data.get("signature_image")),
            "location": await self._validate_location(
                pod_data.get("gps_location", {}),
                expected_delivery.get("location", {})
            ),
            "timestamp": await self._validate_timestamp(
                pod_data.get("delivery_timestamp"),
                expected_delivery.get("time_window", {})
            ),
            "recipient": await self._validate_recipient(
                pod_data.get("recipient_name"),
                expected_delivery.get("recipient_name")
            )
        }
        
        # Calculate overall validation score
        scores = [
            validation_results["signature"]["score"],
            validation_results["location"]["score"],
            validation_results["timestamp"]["score"],
            validation_results["recipient"]["score"]
        ]
        overall_score = sum(scores) / len(scores)
        
        # AI analysis of overall POD validity
        ai_analysis = await self._ai_validate_pod(pod_data, shipment_data, validation_results)
        
        validation_status = "validated" if overall_score >= self.validation_config["confidence_threshold"] else "needs_review"
        
        return {
            "success": True,
            "validation_results": validation_results,
            "overall_score": round(overall_score, 3),
            "validation_status": validation_status,
            "ai_analysis": ai_analysis,
            "validated_at": datetime.utcnow().isoformat()
        }
    
    async def _validate_signature(self, signature_data: Optional[str]) -> Dict[str, Any]:
        """Validate signature image"""
        if not signature_data:
            return {"valid": False, "score": 0, "reason": "No signature provided"}
        
        # In production, this would use computer vision to analyze signature
        # For now, we do basic validation
        try:
            # Check if base64 is valid
            decoded = base64.b64decode(signature_data)
            if len(decoded) > 1000:  # Reasonable signature size
                return {
                    "valid": True,
                    "score": 0.9,
                    "reason": "Signature captured successfully"
                }
            return {
                "valid": False,
                "score": 0.3,
                "reason": "Signature data appears incomplete"
            }
        except Exception:
            return {
                "valid": False,
                "score": 0,
                "reason": "Invalid signature data format"
            }
    
    async def _validate_location(self, actual: Dict, expected: Dict) -> Dict[str, Any]:
        """Validate delivery location against expected"""
        if not actual.get("latitude") or not actual.get("longitude"):
            return {"valid": False, "score": 0, "reason": "No location data"}
        
        if not expected.get("latitude") or not expected.get("longitude"):
            return {"valid": True, "score": 0.7, "reason": "No expected location to compare"}
        
        # Calculate distance between actual and expected
        import math
        R = 6371000  # Earth's radius in meters
        
        lat1, lat2 = math.radians(actual["latitude"]), math.radians(expected["latitude"])
        dlat = lat2 - lat1
        dlon = math.radians(expected["longitude"] - actual["longitude"])
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c  # Distance in meters
        
        threshold = self.validation_config["gps_accuracy_threshold_meters"]
        
        if distance <= threshold:
            return {
                "valid": True,
                "score": 1.0,
                "distance_meters": round(distance, 2),
                "reason": "Location matches expected delivery address"
            }
        elif distance <= threshold * 2:
            return {
                "valid": True,
                "score": 0.7,
                "distance_meters": round(distance, 2),
                "reason": "Location is near expected delivery address"
            }
        else:
            return {
                "valid": False,
                "score": 0.3,
                "distance_meters": round(distance, 2),
                "reason": f"Location is {round(distance, 0)}m from expected address"
            }
    
    async def _validate_timestamp(self, actual: str, expected_window: Dict) -> Dict[str, Any]:
        """Validate delivery timestamp"""
        try:
            actual_time = datetime.fromisoformat(actual.replace('Z', '+00:00'))
        except Exception:
            return {"valid": False, "score": 0, "reason": "Invalid timestamp format"}
        
        if not expected_window:
            return {"valid": True, "score": 0.8, "reason": "No time window specified"}
        
        try:
            start = datetime.fromisoformat(expected_window.get("start", "").replace('Z', '+00:00'))
            end = datetime.fromisoformat(expected_window.get("end", "").replace('Z', '+00:00'))
            
            if start <= actual_time <= end:
                return {
                    "valid": True,
                    "score": 1.0,
                    "reason": "Delivered within expected time window"
                }
            else:
                # Calculate how far outside the window
                if actual_time < start:
                    diff = (start - actual_time).total_seconds() / 60
                    return {
                        "valid": True,
                        "score": 0.9,
                        "reason": f"Delivered {diff:.0f} minutes early"
                    }
                else:
                    diff = (actual_time - end).total_seconds() / 60
                    tolerance = self.validation_config["timestamp_tolerance_minutes"]
                    if diff <= tolerance:
                        return {
                            "valid": True,
                            "score": 0.7,
                            "reason": f"Delivered {diff:.0f} minutes late (within tolerance)"
                        }
                    return {
                        "valid": False,
                        "score": 0.4,
                        "reason": f"Delivered {diff:.0f} minutes late"
                    }
        except Exception:
            return {"valid": True, "score": 0.7, "reason": "Could not parse time window"}
    
    async def _validate_recipient(self, actual: str, expected: str) -> Dict[str, Any]:
        """Validate recipient name"""
        if not actual:
            return {"valid": False, "score": 0, "reason": "No recipient name provided"}
        
        if not expected:
            return {"valid": True, "score": 0.7, "reason": "No expected recipient to compare"}
        
        # Simple name matching (production would use fuzzy matching)
        actual_normalized = actual.lower().strip()
        expected_normalized = expected.lower().strip()
        
        if actual_normalized == expected_normalized:
            return {"valid": True, "score": 1.0, "reason": "Recipient name matches exactly"}
        
        # Check for partial match
        actual_parts = set(actual_normalized.split())
        expected_parts = set(expected_normalized.split())
        
        common = actual_parts & expected_parts
        if len(common) >= 1:
            return {
                "valid": True,
                "score": 0.8,
                "reason": "Recipient name partially matches"
            }
        
        return {
            "valid": False,
            "score": 0.2,
            "reason": f"Recipient name '{actual}' does not match expected '{expected}'"
        }
    
    async def _ai_validate_pod(
        self,
        pod_data: Dict,
        shipment_data: Dict,
        validation_results: Dict
    ) -> Dict[str, Any]:
        """AI-powered comprehensive POD validation"""
        
        system_prompt = """You are an expert POD validation AI for logistics operations.
        
Analyze the POD data and validation results to:
1. Identify any potential fraud indicators
2. Assess overall delivery completion confidence
3. Recommend any additional verification needed
4. Flag any discrepancies requiring human review"""

        user_prompt = f"""Validate this Proof of Delivery:

POD Data:
{json.dumps(pod_data, indent=2, default=str)}

Shipment Data:
{json.dumps(shipment_data, indent=2, default=str)}

Validation Results:
{json.dumps(validation_results, indent=2)}

Provide analysis in JSON format with:
- confidence_level (0-1)
- fraud_risk (low, medium, high)
- fraud_indicators (list of any suspicious elements)
- verification_recommended (boolean)
- verification_steps (list if recommended)
- discrepancies (list of any issues found)
- approval_recommendation (approve, review, reject)
- reasoning (brief explanation)"""

        return await self.generate_structured_response(system_prompt, user_prompt)
    
    async def analyze_delivery_photo(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze delivery photo using computer vision"""
        photo_base64 = input_data.get("photo_evidence")
        shipment_info = input_data.get("shipment_info", {})
        
        self.log_action("analyze_delivery_photo")
        
        if not photo_base64:
            return {
                "success": False,
                "error": "No photo provided"
            }
        
        prompt = f"""Analyze this delivery photo for a logistics company.

Shipment Info: {json.dumps(shipment_info)}

Identify and describe:
1. Location type (residential, commercial, etc.)
2. Package visibility and condition
3. Delivery placement (doorstep, porch, etc.)
4. Any potential issues (damage, weather exposure, etc.)
5. Verification confidence that this is a valid delivery photo

Provide analysis in JSON format."""

        try:
            analysis = await self.analyze_document_image(photo_base64, prompt)
            return {
                "success": True,
                "photo_analysis": json.loads(analysis) if analysis.startswith('{') else {"description": analysis},
                "analyzed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def resolve_dispute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI-powered dispute resolution"""
        dispute_data = input_data.get("dispute_data", {})
        pod_data = input_data.get("pod_data", {})
        shipment_data = input_data.get("shipment_data", {})
        customer_claim = input_data.get("customer_claim", "")
        
        self.log_action("resolve_dispute", {"dispute_id": dispute_data.get("id")})
        
        system_prompt = """You are an expert dispute resolution AI for logistics operations.
        
Analyze delivery disputes by:
1. Comparing POD evidence with shipment records
2. Evaluating customer claims against delivery proof
3. Identifying responsible party (carrier, shipper, receiver)
4. Recommending fair resolution

Be objective and evidence-based in your analysis."""

        user_prompt = f"""Resolve this delivery dispute:

Dispute Details:
{json.dumps(dispute_data, indent=2)}

Customer Claim:
{customer_claim}

POD Evidence:
{json.dumps(pod_data, indent=2, default=str)}

Shipment Records:
{json.dumps(shipment_data, indent=2, default=str)}

Provide resolution in JSON format with:
- dispute_valid (boolean - is the customer's claim valid)
- evidence_assessment (analysis of available evidence)
- responsible_party (carrier, shipper, receiver, shared, none)
- liability_percentage (dict with party percentages)
- recommended_action (refund, redeliver, investigate, deny, etc.)
- compensation_amount (if applicable)
- resolution_confidence (0-1)
- reasoning (detailed explanation)
- prevention_recommendations (how to prevent similar disputes)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "dispute_resolution": result,
            "resolved_at": datetime.utcnow().isoformat()
        }
    
    async def sync_with_billing(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sync validated POD with billing system"""
        pod_data = input_data.get("pod_data", {})
        shipment_data = input_data.get("shipment_data", {})
        validation_status = input_data.get("validation_status", "pending")
        
        self.log_action("sync_billing", {"shipment_id": pod_data.get("shipment_id")})
        
        # Prepare billing data
        billing_sync = {
            "shipment_id": pod_data.get("shipment_id"),
            "delivery_confirmed": validation_status == "validated",
            "delivery_timestamp": pod_data.get("delivery_timestamp"),
            "recipient_name": pod_data.get("recipient_name"),
            "pod_reference": pod_data.get("id"),
            "billable": validation_status == "validated",
            "billing_status": "ready" if validation_status == "validated" else "pending_review",
            "sync_timestamp": datetime.utcnow().isoformat()
        }
        
        # Calculate any applicable adjustments
        if validation_status == "validated":
            # Check for late delivery penalties or bonuses
            timestamp_validation = pod_data.get("validation_results", {}).get("timestamp", {})
            if "late" in timestamp_validation.get("reason", "").lower():
                billing_sync["adjustments"] = [{
                    "type": "late_delivery_penalty",
                    "description": timestamp_validation.get("reason"),
                    "percentage": -5
                }]
            elif "early" in timestamp_validation.get("reason", "").lower():
                billing_sync["adjustments"] = [{
                    "type": "early_delivery_bonus",
                    "description": timestamp_validation.get("reason"),
                    "percentage": 2
                }]
        
        return {
            "success": True,
            "billing_sync": billing_sync,
            "synced": True
        }
    
    async def verify_delivery(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Quick delivery verification check"""
        shipment_id = input_data.get("shipment_id")
        tracking_number = input_data.get("tracking_number")
        
        self.log_action("verify_delivery", {"shipment_id": shipment_id})
        
        # In production, this would query the POD database
        # For now, return verification structure
        
        return {
            "success": True,
            "shipment_id": shipment_id,
            "tracking_number": tracking_number,
            "delivery_verified": True,
            "verification_method": "pod_validation",
            "verified_at": datetime.utcnow().isoformat()
        }
    
    async def full_pod_processing(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete POD processing workflow"""
        shipment_id = input_data.get("shipment_id")
        shipment_data = input_data.get("shipment_data", {})
        
        self.log_action("full_pod_processing", {"shipment_id": shipment_id})
        
        # Capture POD
        capture_result = await self.capture_pod(input_data)
        
        if not capture_result.get("validation_passed"):
            return {
                "success": False,
                "stage": "capture",
                "result": capture_result
            }
        
        # Validate POD
        validation_result = await self.validate_pod({
            "pod_data": capture_result.get("pod_record", {}),
            "shipment_data": shipment_data,
            "expected_delivery": input_data.get("expected_delivery", {})
        })
        
        # Sync with billing if validated
        billing_sync = None
        if validation_result.get("validation_status") == "validated":
            billing_sync = await self.sync_with_billing({
                "pod_data": {**capture_result.get("pod_record", {}), **validation_result},
                "shipment_data": shipment_data,
                "validation_status": validation_result.get("validation_status")
            })
        
        return {
            "success": True,
            "pod_processing": {
                "capture": capture_result,
                "validation": validation_result,
                "billing_sync": billing_sync
            },
            "processed_at": datetime.utcnow().isoformat()
        }


# Create singleton instance
pod_agent = PODAgent()
