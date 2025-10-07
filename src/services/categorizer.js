// Categorize text into a single relevant category
function categorizeText(text) {
    if (!text || text.trim().length === 0) return "Uncategorized";

    const lowerText = text.toLowerCase();

    // Define main categories with their keywords
   const categories = [
    {
        label: "US Legal Document",
        keywords: [
            "contract", "agreement", "clause", "law", "legal", "terms", "witness", "notary",
            "patent", "copyright", "federal", "statute", "lawsuit", "indictment", "legislation",
            "regulations", "court", "judge", "attorney", "plaintiff", "defendant", "settlement",
            "litigation", "arbitration", "hearing", "trial", "brief", "motion", "appeal", "verdict",
            "case number", "jurisdiction", "confidentiality", "affidavit", "subpoena", "evidence",
            "testimony", "deposition", "legal opinion", "compliance", "statutory", "ordinance",
            "code", "fines", "penalty", "enforcement", "warrant", "injunction", "liability", "damages",
            "breach", "tort", "intellectual property", "licensing"
        ]
    },
    {
        label: "Festival Document",
        keywords: [
            "festival", "celebration", "event", "guide", "parade", "ceremony", "holiday", "planning",
            "agenda", "music", "arts", "community", "performance", "exhibition", "cultural", "fair",
            "gathering", "program", "schedule", "venue", "ticket", "attendance", "registration",
            "sponsorship", "host", "organizer", "activities", "workshop", "competition", "contest",
            "dance", "theater", "show", "presentation", "launch", "opening", "closing", "festival week",
            "reception", "banquet", "fundraiser", "celebration day", "carnival", "festival guide",
            "volunteer", "committee", "announcement", "promotion", "brochure", "flyer", "poster"
        ]
    },
    {
        label: "Investigation Document",
        keywords: [
            "investigation", "report", "case study", "evidence", "forensic", "audit", "inquiry",
            "inspection", "findings", "analysis", "incident", "review", "assessment", "observation",
            "documentation", "investigator", "evaluation", "audit report", "noncompliance", "violation",
            "risk assessment", "internal control", "regulatory", "probe", "incident report", "inspection report",
            "audit trail", "forensic analysis", "surveillance", "confidential", "security", "risk",
            "breach", "data breach", "cybersecurity", "fraud", "whistleblower", "interview", "statement",
            "inspection record", "corrective action", "remediation", "control testing", "audit findings",
            "evidence review", "case file", "follow-up", "recommendations", "compliance check"
        ]
    },
    {
        label: "Research/Academic Document",
        keywords: [
            "abstract", "introduction", "references", "university", "research", "methodology", "paper",
            "journal", "study", "results", "conclusion", "literature review", "experiment", "data analysis",
            "statistical", "findings", "discussion", "hypothesis", "sampling", "survey", "publication",
            "citation", "bibliography", "appendix", "table of contents", "figure", "graph", "chart",
            "experiment setup", "protocol", "evaluation", "research question", "case study", "observation",
            "analysis", "variables", "significance", "model", "theory", "framework", "conceptual", "outcome",
            "field study", "controlled study", "results discussion", "limitations", "future work", "acknowledgements",
            "funding", "peer-reviewed", "review article", "scientific paper"
        ]
    },
    {
        label: "Financial Document",
        keywords: [
            "balance sheet", "invoice", "transaction", "account", "audit", "financial report", "earnings",
            "quarterly", "board", "shareholder", "revenue", "expense", "profit", "loss", "cash flow",
            "budget", "investment", "portfolio", "dividend", "capital", "asset", "liability", "equity",
            "tax", "statement", "forecast", "financial statement", "statement of accounts", "ledger",
            "journal entry", "accounts payable", "accounts receivable", "audit report", "financial planning",
            "management report", "performance report", "cost analysis", "income statement", "expense report",
            "profit margin", "return on investment", "capital expenditure", "financial analysis", "fiscal year",
            "compliance", "risk management", "valuation", "internal control", "budget allocation", "expense tracking"
        ]
    }
];

    // Score each category based on keyword matches
    let bestMatch = { label: "Other Document", score: 0 };

    for (const category of categories) {
        let count = 0;
        for (const keyword of category.keywords) {
            if (lowerText.includes(keyword)) count++;
        }
        if (count > bestMatch.score) {
            bestMatch = { label: category.label, score: count };
        }
    }

    return bestMatch.label;
}

module.exports = { categorizeText };
