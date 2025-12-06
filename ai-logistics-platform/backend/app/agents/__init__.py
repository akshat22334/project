"""
AI Agents module exports
"""

from .base_agent import BaseAgent, AgentOrchestrator, orchestrator
from .onboarding_agent import OnboardingComplianceAgent, onboarding_agent
from .communication_agent import CommunicationRouterAgent, communication_agent
from .tracking_agent import TrackingAgent, tracking_agent
from .pod_agent import PODAgent, pod_agent
from .billing_agent import BillingAgent, billing_agent

# Register all agents with orchestrator
orchestrator.register_agent(onboarding_agent)
orchestrator.register_agent(communication_agent)
orchestrator.register_agent(tracking_agent)
orchestrator.register_agent(pod_agent)
orchestrator.register_agent(billing_agent)

__all__ = [
    "BaseAgent",
    "AgentOrchestrator",
    "orchestrator",
    "OnboardingComplianceAgent",
    "onboarding_agent",
    "CommunicationRouterAgent",
    "communication_agent",
    "TrackingAgent",
    "tracking_agent",
    "PODAgent",
    "pod_agent",
    "BillingAgent",
    "billing_agent"
]
