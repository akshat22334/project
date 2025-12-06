"""
Intelligent Financial Reconciliation & Billing Agent

Capabilities:
- OCR extracts data from freight bills and matches with delivery records
- AI flags exceptions (rate mismatch, missing POD) and auto-approves clean invoices
- Predictive cash flow dashboard for finance teams
- Automated dispute detection and resolution
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import re

from .base_agent import BaseAgent


class BillingAgent(BaseAgent):
    """AI Agent for Intelligent Financial Reconciliation & Billing"""
    
    def __init__(self):
        super().__init__(
            name="BillingAgent",
            description="AI-powered OCR, invoice reconciliation, and cash flow prediction"
        )
        
        # Auto-approval thresholds
        self.auto_approval_config = {
            "max_amount": 10000,
            "variance_threshold_percent": 2,
            "required_match_score": 0.95,
            "pod_required": True
        }
        
        # Exception categories
        self.exception_types = [
            "rate_mismatch",
            "missing_pod",
            "duplicate_invoice",
            "quantity_discrepancy",
            "date_mismatch",
            "vendor_mismatch",
            "exceeds_threshold"
        ]
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing entry point"""
        action = input_data.get("action", "process")
        
        if action == "extract_ocr":
            return await self.extract_invoice_ocr(input_data)
        elif action == "reconcile":
            return await self.reconcile_invoice(input_data)
        elif action == "auto_approve":
            return await self.auto_approve_check(input_data)
        elif action == "detect_exceptions":
            return await self.detect_exceptions(input_data)
        elif action == "predict_cashflow":
            return await self.predict_cash_flow(input_data)
        elif action == "generate_report":
            return await self.generate_financial_report(input_data)
        else:
            return await self.full_billing_process(input_data)
    
    async def extract_invoice_ocr(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract data from invoice using OCR and AI"""
        document_content = input_data.get("document_content", "")  # Base64 or text
        document_type = input_data.get("document_type", "invoice")
        
        self.log_action("extract_ocr", {"type": document_type})
        
        system_prompt = """You are an expert OCR and document processing AI for financial documents.
        
Extract all relevant information from invoices and freight bills:
- Invoice/Bill number
- Vendor information (name, address, contact)
- Invoice date and due date
- Line items (description, quantity, unit price, total)
- Subtotal, taxes, and total amount
- Payment terms
- Reference numbers (PO, shipment, tracking)
- Any special notes or conditions

Be precise with numbers and dates."""

        user_prompt = f"""Extract data from this {document_type}:

Document Content:
{document_content}

Provide extracted data in JSON format with:
- invoice_number
- vendor_name
- vendor_address
- vendor_contact
- invoice_date (YYYY-MM-DD)
- due_date (YYYY-MM-DD)
- line_items (array of: description, quantity, unit_price, total, category)
- subtotal
- tax_amount
- tax_rate
- total_amount
- currency
- payment_terms
- reference_numbers (PO_number, shipment_id, tracking_number)
- notes
- extraction_confidence (0-1)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        # Post-process extracted data
        processed = self._post_process_extraction(result)
        
        return {
            "success": True,
            "extracted_data": processed,
            "raw_extraction": result,
            "extraction_timestamp": datetime.utcnow().isoformat()
        }
    
    def _post_process_extraction(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Post-process and validate extracted data"""
        processed = data.copy()
        
        # Ensure numeric fields are numbers
        for field in ["subtotal", "tax_amount", "total_amount"]:
            if field in processed and isinstance(processed[field], str):
                try:
                    # Remove currency symbols and commas
                    cleaned = re.sub(r'[^\d.]', '', processed[field])
                    processed[field] = float(cleaned) if cleaned else 0
                except ValueError:
                    processed[field] = 0
        
        # Validate line items
        if "line_items" in processed and isinstance(processed["line_items"], list):
            for item in processed["line_items"]:
                if isinstance(item, dict):
                    for num_field in ["quantity", "unit_price", "total"]:
                        if num_field in item and isinstance(item[num_field], str):
                            try:
                                cleaned = re.sub(r'[^\d.]', '', item[num_field])
                                item[num_field] = float(cleaned) if cleaned else 0
                            except ValueError:
                                item[num_field] = 0
        
        return processed
    
    async def reconcile_invoice(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Reconcile invoice against delivery records"""
        invoice_data = input_data.get("invoice_data", {})
        delivery_records = input_data.get("delivery_records", [])
        po_data = input_data.get("po_data", {})
        
        self.log_action("reconcile", {"invoice": invoice_data.get("invoice_number")})
        
        reconciliation_results = {
            "matches": [],
            "discrepancies": [],
            "unmatched_items": [],
            "match_score": 0
        }
        
        # Match line items with delivery records
        invoice_items = invoice_data.get("line_items", [])
        matched_count = 0
        
        for item in invoice_items:
            match_found = False
            for record in delivery_records:
                if self._items_match(item, record):
                    reconciliation_results["matches"].append({
                        "invoice_item": item,
                        "delivery_record": record,
                        "match_type": "exact" if self._exact_match(item, record) else "fuzzy"
                    })
                    matched_count += 1
                    match_found = True
                    break
            
            if not match_found:
                reconciliation_results["unmatched_items"].append(item)
        
        # Calculate match score
        total_items = len(invoice_items)
        reconciliation_results["match_score"] = matched_count / total_items if total_items > 0 else 0
        
        # Check for discrepancies
        discrepancies = await self._check_discrepancies(invoice_data, delivery_records, po_data)
        reconciliation_results["discrepancies"] = discrepancies
        
        # AI analysis of reconciliation
        ai_analysis = await self._ai_reconciliation_analysis(
            invoice_data, delivery_records, reconciliation_results
        )
        
        return {
            "success": True,
            "reconciliation": reconciliation_results,
            "ai_analysis": ai_analysis,
            "reconciled_at": datetime.utcnow().isoformat()
        }
    
    def _items_match(self, item1: Dict, item2: Dict) -> bool:
        """Check if two items match"""
        # Simple matching logic - production would use fuzzy matching
        desc1 = str(item1.get("description", "")).lower()
        desc2 = str(item2.get("description", "")).lower()
        
        # Check description similarity
        words1 = set(desc1.split())
        words2 = set(desc2.split())
        common = words1 & words2
        
        if len(common) >= min(len(words1), len(words2)) * 0.5:
            return True
        
        # Check reference numbers
        if item1.get("reference") and item1.get("reference") == item2.get("reference"):
            return True
        
        return False
    
    def _exact_match(self, item1: Dict, item2: Dict) -> bool:
        """Check for exact match"""
        return (
            item1.get("quantity") == item2.get("quantity") and
            abs(float(item1.get("total", 0)) - float(item2.get("total", 0))) < 0.01
        )
    
    async def _check_discrepancies(
        self,
        invoice: Dict,
        records: List[Dict],
        po: Dict
    ) -> List[Dict]:
        """Check for billing discrepancies"""
        discrepancies = []
        
        # Rate mismatch check
        if po.get("agreed_rate"):
            for item in invoice.get("line_items", []):
                item_rate = float(item.get("unit_price", 0))
                agreed_rate = float(po.get("agreed_rate", 0))
                if agreed_rate > 0:
                    variance = abs(item_rate - agreed_rate) / agreed_rate * 100
                    if variance > self.auto_approval_config["variance_threshold_percent"]:
                        discrepancies.append({
                            "type": "rate_mismatch",
                            "description": item.get("description"),
                            "invoice_rate": item_rate,
                            "agreed_rate": agreed_rate,
                            "variance_percent": round(variance, 2)
                        })
        
        # Quantity check
        total_invoice_qty = sum(
            float(item.get("quantity", 0)) for item in invoice.get("line_items", [])
        )
        total_delivered_qty = sum(
            float(record.get("quantity", 0)) for record in records
        )
        if total_invoice_qty != total_delivered_qty:
            discrepancies.append({
                "type": "quantity_discrepancy",
                "invoice_quantity": total_invoice_qty,
                "delivered_quantity": total_delivered_qty,
                "difference": total_invoice_qty - total_delivered_qty
            })
        
        return discrepancies
    
    async def _ai_reconciliation_analysis(
        self,
        invoice: Dict,
        records: List[Dict],
        results: Dict
    ) -> Dict[str, Any]:
        """AI analysis of reconciliation results"""
        
        system_prompt = """You are an expert financial reconciliation AI.
        
Analyze the invoice reconciliation and provide:
1. Summary of matching status
2. Risk assessment for unmatched items
3. Recommendations for discrepancy resolution
4. Approval recommendation"""

        user_prompt = f"""Analyze this invoice reconciliation:

Invoice Summary:
- Number: {invoice.get('invoice_number')}
- Vendor: {invoice.get('vendor_name')}
- Total: {invoice.get('total_amount')}
- Items: {len(invoice.get('line_items', []))}

Reconciliation Results:
- Match Score: {results.get('match_score', 0):.2%}
- Matched Items: {len(results.get('matches', []))}
- Unmatched Items: {len(results.get('unmatched_items', []))}
- Discrepancies: {len(results.get('discrepancies', []))}

Discrepancy Details:
{json.dumps(results.get('discrepancies', []), indent=2)}

Provide analysis in JSON format with:
- overall_status (clean, needs_review, high_risk)
- confidence_score (0-1)
- risk_factors (list)
- resolution_steps (for each discrepancy)
- approval_recommendation (approve, hold, reject)
- estimated_resolution_time (if applicable)
- notes"""

        return await self.generate_structured_response(system_prompt, user_prompt)
    
    async def auto_approve_check(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check if invoice qualifies for auto-approval"""
        invoice_data = input_data.get("invoice_data", {})
        reconciliation = input_data.get("reconciliation", {})
        pod_status = input_data.get("pod_status", {})
        
        self.log_action("auto_approve_check", {"invoice": invoice_data.get("invoice_number")})
        
        approval_checks = {
            "amount_check": {
                "passed": False,
                "reason": ""
            },
            "match_score_check": {
                "passed": False,
                "reason": ""
            },
            "pod_check": {
                "passed": False,
                "reason": ""
            },
            "discrepancy_check": {
                "passed": False,
                "reason": ""
            }
        }
        
        # Amount check
        total = float(invoice_data.get("total_amount", 0))
        max_amount = self.auto_approval_config["max_amount"]
        if total <= max_amount:
            approval_checks["amount_check"]["passed"] = True
            approval_checks["amount_check"]["reason"] = f"Amount ${total} is within limit ${max_amount}"
        else:
            approval_checks["amount_check"]["reason"] = f"Amount ${total} exceeds limit ${max_amount}"
        
        # Match score check
        match_score = reconciliation.get("match_score", 0)
        required_score = self.auto_approval_config["required_match_score"]
        if match_score >= required_score:
            approval_checks["match_score_check"]["passed"] = True
            approval_checks["match_score_check"]["reason"] = f"Match score {match_score:.2%} meets requirement {required_score:.2%}"
        else:
            approval_checks["match_score_check"]["reason"] = f"Match score {match_score:.2%} below requirement {required_score:.2%}"
        
        # POD check
        if self.auto_approval_config["pod_required"]:
            if pod_status.get("validated", False):
                approval_checks["pod_check"]["passed"] = True
                approval_checks["pod_check"]["reason"] = "POD validated"
            else:
                approval_checks["pod_check"]["reason"] = "POD not validated"
        else:
            approval_checks["pod_check"]["passed"] = True
            approval_checks["pod_check"]["reason"] = "POD not required"
        
        # Discrepancy check
        discrepancies = reconciliation.get("discrepancies", [])
        if len(discrepancies) == 0:
            approval_checks["discrepancy_check"]["passed"] = True
            approval_checks["discrepancy_check"]["reason"] = "No discrepancies found"
        else:
            approval_checks["discrepancy_check"]["reason"] = f"Found {len(discrepancies)} discrepancies"
        
        # Overall decision
        all_passed = all(check["passed"] for check in approval_checks.values())
        
        return {
            "success": True,
            "auto_approved": all_passed,
            "approval_checks": approval_checks,
            "checked_at": datetime.utcnow().isoformat()
        }
    
    async def detect_exceptions(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect billing exceptions requiring attention"""
        invoices = input_data.get("invoices", [])
        
        self.log_action("detect_exceptions", {"count": len(invoices)})
        
        exceptions = []
        
        for invoice in invoices:
            invoice_exceptions = []
            
            # Check for common exception patterns
            if not invoice.get("pod_validated"):
                invoice_exceptions.append({
                    "type": "missing_pod",
                    "severity": "high",
                    "description": "Invoice lacks validated proof of delivery"
                })
            
            if invoice.get("variance_percent", 0) > self.auto_approval_config["variance_threshold_percent"]:
                invoice_exceptions.append({
                    "type": "rate_mismatch",
                    "severity": "medium",
                    "description": f"Rate variance of {invoice.get('variance_percent')}%"
                })
            
            if invoice.get("is_duplicate"):
                invoice_exceptions.append({
                    "type": "duplicate_invoice",
                    "severity": "high",
                    "description": "Potential duplicate invoice detected"
                })
            
            # Check if overdue
            due_date_str = invoice.get("due_date")
            if due_date_str:
                try:
                    due_date = datetime.fromisoformat(due_date_str)
                    if due_date < datetime.utcnow():
                        invoice_exceptions.append({
                            "type": "overdue",
                            "severity": "high",
                            "description": f"Invoice overdue since {due_date_str}"
                        })
                except Exception:
                    pass
            
            if invoice_exceptions:
                exceptions.append({
                    "invoice_number": invoice.get("invoice_number"),
                    "vendor": invoice.get("vendor_name"),
                    "amount": invoice.get("total_amount"),
                    "exceptions": invoice_exceptions
                })
        
        return {
            "success": True,
            "total_invoices": len(invoices),
            "invoices_with_exceptions": len(exceptions),
            "exception_details": exceptions,
            "detected_at": datetime.utcnow().isoformat()
        }
    
    async def predict_cash_flow(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict cash flow based on invoices and payment patterns"""
        pending_invoices = input_data.get("pending_invoices", [])
        historical_payments = input_data.get("historical_payments", [])
        forecast_days = input_data.get("forecast_days", 30)
        
        self.log_action("predict_cashflow", {"forecast_days": forecast_days})
        
        system_prompt = """You are an expert financial forecasting AI.
        
Analyze pending invoices and payment history to predict:
1. Expected cash inflows by week
2. Payment probability for each invoice
3. Days Sales Outstanding (DSO) trend
4. Cash flow risks and opportunities"""

        user_prompt = f"""Forecast cash flow for the next {forecast_days} days:

Pending Invoices (Receivables):
{json.dumps(pending_invoices[:20], indent=2, default=str)}

Historical Payment Patterns:
{json.dumps(historical_payments[:20], indent=2, default=str)}

Provide forecast in JSON format with:
- weekly_forecast (array of week, expected_inflow, confidence)
- total_expected_inflow
- high_risk_invoices (list of invoices likely to be delayed)
- average_payment_delay_days
- dso_current
- dso_trend (improving, stable, worsening)
- recommendations (list of actions to improve cash flow)
- working_capital_impact
- collection_priorities (top invoices to focus on)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "cash_flow_forecast": result,
            "forecast_period_days": forecast_days,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def generate_financial_report(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive financial report"""
        period_start = input_data.get("period_start")
        period_end = input_data.get("period_end")
        invoices = input_data.get("invoices", [])
        payments = input_data.get("payments", [])
        
        self.log_action("generate_report", {"period": f"{period_start} to {period_end}"})
        
        # Calculate metrics
        total_invoiced = sum(float(inv.get("total_amount", 0)) for inv in invoices)
        total_paid = sum(float(pay.get("amount", 0)) for pay in payments)
        
        invoices_by_status = {}
        for inv in invoices:
            status = inv.get("status", "unknown")
            invoices_by_status[status] = invoices_by_status.get(status, 0) + 1
        
        system_prompt = """You are an expert financial analyst AI.
        
Generate a comprehensive financial report with:
1. Executive summary
2. Key metrics analysis
3. Trends and patterns
4. Risk assessment
5. Recommendations"""

        user_prompt = f"""Generate financial report for period {period_start} to {period_end}:

Invoice Summary:
- Total Invoiced: ${total_invoiced:,.2f}
- Total Collected: ${total_paid:,.2f}
- Collection Rate: {(total_paid/total_invoiced*100) if total_invoiced else 0:.1f}%
- Invoices by Status: {json.dumps(invoices_by_status)}
- Total Invoices: {len(invoices)}

Provide report in JSON format with:
- executive_summary (2-3 sentences)
- key_metrics (dict of metric_name: value with comparisons)
- performance_indicators (list of KPIs with status)
- trends (list of identified trends)
- risk_assessment (overall_risk, risk_factors)
- opportunities (list of improvement opportunities)
- recommendations (prioritized action items)
- forecast_outlook (brief future outlook)"""

        result = await self.generate_structured_response(system_prompt, user_prompt)
        
        return {
            "success": True,
            "report": result,
            "metrics": {
                "total_invoiced": total_invoiced,
                "total_collected": total_paid,
                "collection_rate": (total_paid/total_invoiced*100) if total_invoiced else 0,
                "invoice_count": len(invoices),
                "invoices_by_status": invoices_by_status
            },
            "period": {
                "start": period_start,
                "end": period_end
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def full_billing_process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete billing processing workflow"""
        document_content = input_data.get("document_content")
        delivery_records = input_data.get("delivery_records", [])
        po_data = input_data.get("po_data", {})
        pod_status = input_data.get("pod_status", {})
        
        self.log_action("full_billing_process")
        
        # Extract invoice data
        extraction_result = await self.extract_invoice_ocr({
            "document_content": document_content,
            "document_type": "invoice"
        })
        
        invoice_data = extraction_result.get("extracted_data", {})
        
        # Reconcile with delivery records
        reconciliation_result = await self.reconcile_invoice({
            "invoice_data": invoice_data,
            "delivery_records": delivery_records,
            "po_data": po_data
        })
        
        # Check for auto-approval
        approval_result = await self.auto_approve_check({
            "invoice_data": invoice_data,
            "reconciliation": reconciliation_result.get("reconciliation", {}),
            "pod_status": pod_status
        })
        
        return {
            "success": True,
            "billing_process": {
                "extraction": extraction_result,
                "reconciliation": reconciliation_result,
                "approval": approval_result
            },
            "final_status": "approved" if approval_result.get("auto_approved") else "pending_review",
            "processed_at": datetime.utcnow().isoformat()
        }


# Create singleton instance
billing_agent = BillingAgent()
