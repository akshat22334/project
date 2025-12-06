"""
AI-Powered Demand & Customer Communication Router Agent

Capabilities:
- Classify incoming customer emails (rate requests, shipment status, complaints)
- Route communications to CRM/TMS automatically
- Integrate with customer portals for real-time status updates
- Predictive response engine for optimal ETA and alternative routes
- Handle exceptions with proactive notifications
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from .base_agent import BaseAgent


class CommunicationRouterAgent(BaseAgent):
    """AI Agent for Customer Communication Classification and Routing"""
    
    def __init__(self):
        super().__init__(
            name="CommunicationRouterAgent",
            description="AI-powered email classification, routing, and response generation"
        )
        
        # Communication categories with routing rules
        self.routing_rules = {
            "rate_request": {
                "department": "sales",
                "priority": 2,
                "sla_hours": 4,
                "auto_response": True
            },
            "shipment_status": {
                "department": "operations",
                "priority": 2,
                "sla_hours": 2,
                "auto_response": True
            },
            "complaint": {
                "department": "customer_service",
                "priority": 1,
                "sla_hours": 1,
                "auto_response": False
            },
            "billing_query": {
                "department": "finance",
                "priority": 3,
                "sla_hours": 8,
                "auto_response": True
            },
            "general_inquiry": {
                "department": "customer_service",
                "priority": 3,
                "sla_hours": 24,
                "auto_response": True
            },
            "urgent": {
                "department": "operations",
                "priority": 1,
                "sla_hours": 1,
                "auto_response": False
            }
        }
        
        # Sentiment thresholds
        self.sentiment_escalation_threshold = -0.5
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing entry point"""
        action = input_data.get("action", "classify")
        
        if action == "classify":
            return await self.classify_communication(input_data)
        elif action == "generate_response":
            return await self.generate_response(input_data)
        elif action == "analyze_sentiment":
            return await self.analyze_sentiment(input_data)
        elif action == "suggest_routing":
            return await self.suggest_routing(input_data)
        elif action == "full_analysis":
            return await self.full_communication_analysis(input_data)
        else:
            return await self.full_communication_analysis(input_data)
    
    async def classify_communication(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Classify incoming communication"""
        subject = input_data.get("subject", "")
        message = input_data.get("message", "")
        sender = input_data.get("sender", "")
        
        self.log_action("classify_communication", {"subject": subject[:50]})
        
        system_prompt = """You are an expert email classifier for a logistics company.
        
Classify the incoming communication into one of these categories:
- rate_request: Requests for shipping rates or quotes
- shipment_status: Inquiries about shipment tracking or delivery status
- complaint: Complaints about service, delays, or damages
- billing_query: Questions about invoices, payments, or charges
- general_inquiry: General questions or information requests
- urgent: Time-sensitive emergencies requiring immediate attention

Also assess:
- Priority (1=highest, 5=lowest)
- Key entities mentioned (tracking numbers, dates, amounts)
- Customer intent
- Required actions

Respond in JSON format."""

        user_prompt = f"""Classify this communication:

From: {sender}
Subject: {subject}

Message:
{message}

Provide classification in JSON format with:
- category (one of: rate_request, shipment_status, complaint, billing_query, general_inquiry, urgent)
- priority (1-5)
- confidence (0-1)
- key_entities (list of important items mentioned)
- customer_intent (brief description)
- required_actions (list of actions needed)
- is_escalation_needed (boolean)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        # Add routing information
        category = result.get("category", "general_inquiry")
        routing = self.routing_rules.get(category, self.routing_rules["general_inquiry"])
        
        return {
            "success": True,
            "classification": result,
            "routing": routing,
            "classified_at": datetime.utcnow().isoformat()
        }
    
    async def analyze_sentiment(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze sentiment of communication"""
        message = input_data.get("message", "")
        
        self.log_action("analyze_sentiment")
        
        system_prompt = """You are an expert in sentiment analysis for customer communications.
        
Analyze the sentiment and emotional tone of the message.
Consider:
- Overall sentiment (positive, neutral, negative)
- Emotion indicators (frustration, satisfaction, urgency)
- Tone (professional, casual, aggressive)
- Customer satisfaction indicators

Respond in JSON format."""

        user_prompt = f"""Analyze the sentiment of this message:

{message}

Provide analysis in JSON format with:
- sentiment (positive, neutral, negative)
- sentiment_score (-1 to 1)
- emotions (list of detected emotions)
- tone (professional, casual, aggressive, neutral)
- frustration_level (low, medium, high)
- urgency_indicators (list)
- escalation_recommended (boolean)
- reasoning (brief explanation)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        # Check for escalation
        sentiment_score = result.get("sentiment_score", 0)
        needs_escalation = (
            sentiment_score < self.sentiment_escalation_threshold or
            result.get("frustration_level") == "high" or
            result.get("escalation_recommended", False)
        )
        
        return {
            "success": True,
            "sentiment_analysis": result,
            "needs_escalation": needs_escalation,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    async def generate_response(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered response suggestion"""
        subject = input_data.get("subject", "")
        message = input_data.get("message", "")
        category = input_data.get("category", "general_inquiry")
        customer_name = input_data.get("customer_name", "Valued Customer")
        context = input_data.get("context", {})
        
        self.log_action("generate_response", {"category": category})
        
        system_prompt = f"""You are a professional customer service representative for a logistics company.
        
Generate a helpful, professional response to the customer inquiry.
Category: {category}

Guidelines:
- Be professional yet friendly
- Address the customer's specific concerns
- Provide actionable information
- Include next steps when relevant
- Keep the response concise but complete
- Use the customer's name when available

If context about shipments, orders, or previous interactions is provided, incorporate it naturally."""

        context_str = json.dumps(context, indent=2) if context else "No additional context available."
        
        user_prompt = f"""Generate a response to this customer inquiry:

Customer Name: {customer_name}
Subject: {subject}

Customer Message:
{message}

Additional Context:
{context_str}

Generate a professional response that addresses their concerns."""

        response = await self.generate_ai_response(system_prompt, user_prompt)
        
        # Generate alternative shorter response
        short_system = "Generate a brief, 2-3 sentence response for quick reply."
        short_response = await self.generate_ai_response(short_system, user_prompt, max_tokens=200)
        
        return {
            "success": True,
            "suggested_response": response,
            "quick_response": short_response,
            "category": category,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def suggest_routing(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest optimal routing for communication"""
        classification = input_data.get("classification", {})
        sentiment = input_data.get("sentiment", {})
        customer_history = input_data.get("customer_history", {})
        
        self.log_action("suggest_routing")
        
        category = classification.get("category", "general_inquiry")
        base_routing = self.routing_rules.get(category, self.routing_rules["general_inquiry"])
        
        # Adjust routing based on sentiment and history
        final_routing = base_routing.copy()
        
        # Escalate if sentiment is very negative
        if sentiment.get("sentiment_score", 0) < -0.7:
            final_routing["priority"] = 1
            final_routing["escalated"] = True
            final_routing["escalation_reason"] = "Very negative sentiment detected"
        
        # Consider customer history
        if customer_history.get("is_vip", False):
            final_routing["priority"] = min(final_routing["priority"], 2)
            final_routing["vip_handling"] = True
        
        if customer_history.get("recent_complaints", 0) > 2:
            final_routing["priority"] = 1
            final_routing["attention_required"] = True
        
        # Add team assignment suggestions
        final_routing["suggested_assignees"] = self._get_suggested_assignees(
            final_routing["department"],
            final_routing["priority"]
        )
        
        return {
            "success": True,
            "routing": final_routing,
            "routing_timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_suggested_assignees(self, department: str, priority: int) -> List[str]:
        """Get suggested assignees based on department and priority"""
        # In production, this would query actual team availability
        assignee_map = {
            "sales": ["Sales Team Lead", "Sales Representative"],
            "operations": ["Operations Manager", "Operations Coordinator"],
            "customer_service": ["CS Team Lead", "Customer Service Rep"],
            "finance": ["Finance Manager", "Billing Specialist"]
        }
        
        assignees = assignee_map.get(department, ["General Support"])
        
        if priority == 1:
            assignees = [f"Senior {a}" for a in assignees[:1]] + assignees
        
        return assignees
    
    async def full_communication_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform full analysis of incoming communication"""
        subject = input_data.get("subject", "")
        message = input_data.get("message", "")
        sender = input_data.get("sender", "")
        customer_name = input_data.get("customer_name", "")
        customer_history = input_data.get("customer_history", {})
        
        self.log_action("full_communication_analysis", {"sender": sender})
        
        # Classify communication
        classification_result = await self.classify_communication({
            "subject": subject,
            "message": message,
            "sender": sender
        })
        
        # Analyze sentiment
        sentiment_result = await self.analyze_sentiment({
            "message": message
        })
        
        # Suggest routing
        routing_result = await self.suggest_routing({
            "classification": classification_result.get("classification", {}),
            "sentiment": sentiment_result.get("sentiment_analysis", {}),
            "customer_history": customer_history
        })
        
        # Generate response if auto-response is enabled
        category = classification_result.get("classification", {}).get("category", "general_inquiry")
        response_result = None
        
        if self.routing_rules.get(category, {}).get("auto_response", True):
            response_result = await self.generate_response({
                "subject": subject,
                "message": message,
                "category": category,
                "customer_name": customer_name or sender,
                "context": customer_history
            })
        
        return {
            "success": True,
            "analysis": {
                "classification": classification_result,
                "sentiment": sentiment_result,
                "routing": routing_result,
                "suggested_response": response_result
            },
            "processed_at": datetime.utcnow().isoformat()
        }
    
    async def generate_predictive_response(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate predictive response based on historical patterns"""
        query_type = input_data.get("query_type", "")
        shipment_data = input_data.get("shipment_data", {})
        
        self.log_action("generate_predictive_response", {"query_type": query_type})
        
        system_prompt = """You are an AI assistant predicting optimal responses for logistics queries.
        
Based on the query type and available shipment data, generate:
1. Predicted ETA with confidence level
2. Alternative routes if there are delays
3. Proactive notifications to send
4. Exception handling recommendations"""

        user_prompt = f"""Query Type: {query_type}

Shipment Data:
{json.dumps(shipment_data, indent=2)}

Generate predictive response with:
- predicted_eta (datetime or estimated timeframe)
- eta_confidence (0-1)
- delay_probability (0-1)
- alternative_routes (if applicable)
- proactive_notifications (list of suggested notifications)
- exception_handling (recommendations for potential issues)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "predictive_response": result,
            "generated_at": datetime.utcnow().isoformat()
        }


# Create singleton instance
communication_agent = CommunicationRouterAgent()
