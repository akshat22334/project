"""
Base Agent Class - Foundation for all AI Agents
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from app.config.openai_config import generate_completion, generate_embedding, analyze_image


class BaseAgent(ABC):
    """Abstract base class for all AI agents"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.created_at = datetime.utcnow()
    
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing method to be implemented by each agent"""
        pass
    
    async def generate_ai_response(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Generate AI response using OpenAI"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        return await generate_completion(messages, temperature=temperature, max_tokens=max_tokens)
    
    async def generate_structured_response(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Generate structured JSON response"""
        enhanced_system = f"""{system_prompt}

IMPORTANT: You must respond with valid JSON only. No additional text or explanation."""
        
        response = await self.generate_ai_response(
            enhanced_system,
            user_prompt,
            temperature=temperature
        )
        
        # Clean and parse JSON response
        try:
            # Remove markdown code blocks if present
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            return {"raw_response": response, "parse_error": True}
    
    async def analyze_document_image(self, image_base64: str, prompt: str) -> str:
        """Analyze document image using vision model"""
        return await analyze_image(image_base64, prompt)
    
    async def get_text_embedding(self, text: str) -> List[float]:
        """Get embedding vector for text"""
        return await generate_embedding(text)
    
    def log_action(self, action: str, details: Dict[str, Any] = None):
        """Log agent actions for tracking"""
        log_entry = {
            "agent": self.name,
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        }
        print(f"[{self.name}] {action}: {details}")
        return log_entry


class AgentOrchestrator:
    """Orchestrates multiple AI agents for complex workflows"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.workflow_history: List[Dict[str, Any]] = []
    
    def register_agent(self, agent: BaseAgent):
        """Register an agent with the orchestrator"""
        self.agents[agent.name] = agent
        print(f"Registered agent: {agent.name}")
    
    async def execute_workflow(
        self,
        workflow: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute a multi-agent workflow"""
        results = {}
        context = {}
        
        for step in workflow:
            agent_name = step.get("agent")
            input_data = step.get("input", {})
            
            # Merge context from previous steps
            input_data.update(context)
            
            if agent_name in self.agents:
                agent = self.agents[agent_name]
                result = await agent.process(input_data)
                results[agent_name] = result
                
                # Update context with results for next steps
                if isinstance(result, dict):
                    context.update(result)
            else:
                results[agent_name] = {"error": f"Agent {agent_name} not found"}
        
        self.workflow_history.append({
            "workflow": workflow,
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return results
    
    def get_agent(self, name: str) -> Optional[BaseAgent]:
        """Get agent by name"""
        return self.agents.get(name)


# Global orchestrator instance
orchestrator = AgentOrchestrator()
