"""
Smart Partner Onboarding & Compliance Agent

Capabilities:
- AI-driven Intelligent Document Processing (IDP)
- Extract contract terms, rates, and compliance clauses from PDFs/emails
- Automate digital signature workflows
- Validate partner credentials against regulatory databases
- Real-time compliance alerts for missing documents or expired certifications
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
import json
import re

from .base_agent import BaseAgent


class OnboardingComplianceAgent(BaseAgent):
    """AI Agent for Smart Partner Onboarding & Compliance"""
    
    def __init__(self):
        super().__init__(
            name="OnboardingComplianceAgent",
            description="AI-driven Intelligent Document Processing and Compliance Validation"
        )
        
        # Define required documents for compliance
        self.required_documents = [
            "business_license",
            "insurance_certificate",
            "carrier_authority",
            "w9_form",
            "safety_rating",
            "operating_agreement"
        ]
        
        # Compliance rules
        self.compliance_rules = {
            "insurance_minimum": 1000000,
            "safety_rating_minimum": "satisfactory",
            "license_validity_days": 365,
            "required_certifications": ["DOT", "MC"]
        }
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing entry point"""
        action = input_data.get("action", "analyze")
        
        if action == "extract_document":
            return await self.extract_document_data(input_data)
        elif action == "validate_compliance":
            return await self.validate_compliance(input_data)
        elif action == "check_certifications":
            return await self.check_certifications(input_data)
        elif action == "generate_onboarding_status":
            return await self.generate_onboarding_status(input_data)
        elif action == "analyze_contract":
            return await self.analyze_contract(input_data)
        else:
            return await self.full_onboarding_analysis(input_data)
    
    async def extract_document_data(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract data from documents using AI"""
        document_content = input_data.get("document_content", "")
        document_type = input_data.get("document_type", "general")
        
        self.log_action("extract_document", {"type": document_type})
        
        system_prompt = """You are an expert document processing AI specializing in logistics and compliance documents.
        
Extract all relevant information from the provided document. Focus on:
- Company/Partner information (name, address, contact)
- Document dates (issue date, expiration date)
- Financial information (rates, limits, premiums)
- Compliance-related data (license numbers, certifications)
- Key terms and conditions

Respond in JSON format with structured data."""

        user_prompt = f"""Document Type: {document_type}

Document Content:
{document_content}

Extract all relevant information and provide in structured JSON format with the following keys where applicable:
- company_info
- dates
- financial_data
- compliance_data
- key_terms
- validation_flags (any issues or concerns found)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "document_type": document_type,
            "extracted_data": result,
            "extraction_timestamp": datetime.utcnow().isoformat()
        }
    
    async def validate_compliance(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate partner compliance status"""
        partner_data = input_data.get("partner_data", {})
        documents = input_data.get("documents", [])
        
        self.log_action("validate_compliance", {"partner": partner_data.get("company_name")})
        
        # Check for missing documents
        submitted_doc_types = [doc.get("document_type") for doc in documents]
        missing_documents = [
            doc for doc in self.required_documents 
            if doc not in submitted_doc_types
        ]
        
        # Check for expired documents
        expired_documents = []
        expiring_soon = []
        current_date = datetime.utcnow()
        
        for doc in documents:
            if doc.get("expiration_date"):
                try:
                    exp_date = datetime.fromisoformat(doc["expiration_date"])
                    if exp_date < current_date:
                        expired_documents.append(doc.get("document_type"))
                    elif exp_date < current_date + timedelta(days=30):
                        expiring_soon.append({
                            "document": doc.get("document_type"),
                            "expires": exp_date.isoformat()
                        })
                except:
                    pass
        
        # Calculate compliance score
        total_checks = len(self.required_documents)
        passed_checks = total_checks - len(missing_documents) - len(expired_documents)
        compliance_score = (passed_checks / total_checks) * 100 if total_checks > 0 else 0
        
        # Determine status
        if compliance_score >= 100:
            status = "approved"
        elif compliance_score >= 70:
            status = "in_review"
        else:
            status = "pending"
        
        # Generate AI recommendations
        recommendations = await self._generate_compliance_recommendations(
            missing_documents, expired_documents, expiring_soon, partner_data
        )
        
        return {
            "success": True,
            "compliance_status": status,
            "compliance_score": round(compliance_score, 2),
            "missing_documents": missing_documents,
            "expired_documents": expired_documents,
            "expiring_soon": expiring_soon,
            "recommendations": recommendations,
            "validation_timestamp": datetime.utcnow().isoformat()
        }
    
    async def _generate_compliance_recommendations(
        self,
        missing: List[str],
        expired: List[str],
        expiring: List[Dict],
        partner_data: Dict
    ) -> List[str]:
        """Generate AI-powered compliance recommendations"""
        
        system_prompt = """You are a compliance advisor for logistics partners.
Generate actionable recommendations to help partners achieve full compliance.
Be specific and helpful."""

        issues = []
        if missing:
            issues.append(f"Missing documents: {', '.join(missing)}")
        if expired:
            issues.append(f"Expired documents: {', '.join(expired)}")
        if expiring:
            issues.append(f"Documents expiring soon: {len(expiring)} documents")
        
        if not issues:
            return ["All compliance requirements are met. Maintain current documentation."]
        
        user_prompt = f"""Partner: {partner_data.get('company_name', 'Unknown')}
        
Compliance Issues:
{chr(10).join(issues)}

Generate 3-5 specific, actionable recommendations to resolve these compliance issues."""

        response = await self.generate_ai_response(system_prompt, user_prompt)
        
        # Parse recommendations from response
        recommendations = [
            line.strip().lstrip('0123456789.-) ')
            for line in response.split('\n')
            if line.strip() and len(line.strip()) > 10
        ][:5]
        
        return recommendations if recommendations else ["Review and update your compliance documents."]
    
    async def check_certifications(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check and validate certifications"""
        certifications = input_data.get("certifications", [])
        
        self.log_action("check_certifications", {"count": len(certifications)})
        
        validation_results = []
        
        for cert in certifications:
            cert_type = cert.get("type", "")
            cert_number = cert.get("number", "")
            
            # Simulate validation (in production, this would call external APIs)
            is_valid = bool(cert_number and len(cert_number) >= 5)
            
            validation_results.append({
                "certification_type": cert_type,
                "number": cert_number,
                "is_valid": is_valid,
                "validation_source": "internal_check",
                "checked_at": datetime.utcnow().isoformat()
            })
        
        return {
            "success": True,
            "certifications_checked": len(certifications),
            "validation_results": validation_results,
            "all_valid": all(r["is_valid"] for r in validation_results)
        }
    
    async def analyze_contract(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze contract terms and conditions"""
        contract_content = input_data.get("contract_content", "")
        
        self.log_action("analyze_contract")
        
        system_prompt = """You are a contract analysis expert for logistics agreements.
        
Analyze the provided contract and extract:
1. Key terms and conditions
2. Rate structures and pricing
3. Liability clauses
4. Service level agreements (SLAs)
5. Termination conditions
6. Risk factors or concerning clauses

Provide analysis in structured JSON format."""

        user_prompt = f"""Analyze the following contract:

{contract_content}

Provide detailed analysis in JSON format with keys:
- key_terms
- rate_structure
- liability_clauses
- slas
- termination_conditions
- risk_factors
- overall_assessment
- recommendations"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "contract_analysis": result,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    async def generate_onboarding_status(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive onboarding status report"""
        partner_id = input_data.get("partner_id")
        partner_data = input_data.get("partner_data", {})
        documents = input_data.get("documents", [])
        
        self.log_action("generate_onboarding_status", {"partner_id": partner_id})
        
        # Get compliance validation
        compliance_result = await self.validate_compliance({
            "partner_data": partner_data,
            "documents": documents
        })
        
        # Calculate onboarding progress
        total_steps = 5
        completed_steps = 0
        
        steps = {
            "profile_complete": bool(partner_data.get("company_name") and partner_data.get("email")),
            "documents_submitted": len(documents) >= 3,
            "compliance_check": compliance_result.get("compliance_score", 0) >= 70,
            "verification_complete": compliance_result.get("compliance_status") in ["approved", "in_review"],
            "agreement_signed": partner_data.get("agreement_signed", False)
        }
        
        completed_steps = sum(1 for v in steps.values() if v)
        progress_percentage = (completed_steps / total_steps) * 100
        
        # Estimate completion time based on progress
        if progress_percentage >= 100:
            estimated_completion = "Complete"
        elif progress_percentage >= 60:
            estimated_completion = "1-2 business days"
        else:
            estimated_completion = "3-5 business days"
        
        return {
            "success": True,
            "partner_id": partner_id,
            "onboarding_progress": round(progress_percentage, 2),
            "steps_status": steps,
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "compliance_status": compliance_result.get("compliance_status"),
            "compliance_score": compliance_result.get("compliance_score"),
            "estimated_completion": estimated_completion,
            "next_actions": compliance_result.get("recommendations", []),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def full_onboarding_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform full onboarding analysis"""
        partner_data = input_data.get("partner_data", {})
        documents = input_data.get("documents", [])
        
        self.log_action("full_onboarding_analysis", {"partner": partner_data.get("company_name")})
        
        # Extract data from all documents
        extracted_data = []
        for doc in documents:
            if doc.get("content"):
                extraction = await self.extract_document_data({
                    "document_content": doc.get("content"),
                    "document_type": doc.get("document_type")
                })
                extracted_data.append(extraction)
        
        # Validate compliance
        compliance = await self.validate_compliance({
            "partner_data": partner_data,
            "documents": documents
        })
        
        # Generate status
        status = await self.generate_onboarding_status({
            "partner_data": partner_data,
            "documents": documents
        })
        
        return {
            "success": True,
            "partner_analysis": {
                "extracted_document_data": extracted_data,
                "compliance_validation": compliance,
                "onboarding_status": status
            },
            "analysis_timestamp": datetime.utcnow().isoformat()
        }


# Create singleton instance
onboarding_agent = OnboardingComplianceAgent()
