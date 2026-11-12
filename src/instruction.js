(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  root.InstructionModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STORAGE_KEY = "poc-instruction.records.v1";
  const TYPES = ["Mandate", "Engagement", "Instruction"];
  const STATUS = ["Active", "Completed", "On Hold", "Withdrawn"];
  const SERVICE_LINE_DEFINITIONS = [
    ["Residential Sales", "Instruction", "🏠", "Residential agency for sales and disposals."],
    ["Residential Lettings", "Instruction", "🏡", "Residential lettings and management."],
    ["Valuations", "Instruction", "📊", "RICS valuations for lending, accounts, and tax."],
    ["Leasing (Commercial Agency)", "Instruction", "🏢", "Commercial landlord and tenant representation."],
    ["Capital Markets", "Instruction", "💼", "Investment transactions and capital raising."],
    ["Capital Advisory", "Mandate", "🏦", "Debt and structured finance advisory."],
    ["Investor Advisory", "Mandate", "📈", "Investment strategy and portfolio advisory."],
    ["Property Management", "Mandate", "🔧", "Lease administration and property operations."],
    ["Occupier Strategy & Solutions", "Engagement", "🧭", "Corporate occupier and workplace advisory."],
    ["Workplace Consulting", "Engagement", "🪑", "Workplace design, utilisation, and change."],
    ["ESG Consultancy", "Engagement", "🌱", "Energy, net-zero, and sustainability assessments."],
    ["Building Consultancy", "Engagement", "🧱", "Surveys, project monitoring, and technical due diligence."],
    ["Development Consultancy", "Engagement", "🏗️", "Feasibility, planning, and development management."]
  ];
  const SERVICE_LINES = SERVICE_LINE_DEFINITIONS.map(([name]) => name);
  const SERVICE_LINE_MAP = Object.fromEntries(SERVICE_LINE_DEFINITIONS.map(([name, core, icon, description]) => [name, { name, core, icon, description }]));
  const DYNAMIC_FIELDS = {
    "Residential Sales": [
      ["Agency type", "select", ["Sole Agency", "Joint Sole Agency", "Multi Agency", "Private Treaty", "Auction", "Tender"], true],
      ["Instruction date", "date", null, true], ["Instruction expiry", "date"], ["Asking price", "number", null, true],
      ["Guide price (low)", "number"], ["Guide price (high)", "number"], ["Commission %", "number", null, true], ["Marketing launch date", "date"]
    ],
    "Residential Lettings": [
      ["Management type", "select", ["Sole Agency", "Joint", "Multi", "Let Only", "Let & Manage", "Full Management"], true],
      ["Instruction date", "date", null, true], ["Instruction expiry", "date"], ["Asking weekly rent", "number", null, true],
      ["Monthly equivalent", "number"], ["Annual equivalent", "number"], ["Letting fee %", "number", null, true],
      ["Management fee %", "number"], ["Minimum tenancy term", "select", ["6 months", "12 months", "24 months", "Longer"]], ["Furnishing", "select", ["Furnished", "Part Furnished", "Unfurnished"]], ["Marketing launch date", "date"]
    ],
    Valuations: [
      ["Purpose", "select", ["Secured Lending", "Fund Reporting", "Acquisition", "Disposal", "Insurance", "Tax", "Financial Statements"], true],
      ["Valuation basis", "select", ["Market Value", "Market Rent", "Fair Value", "DRC", "Reinstatement"], true],
      ["Instruction date", "date", null, true], ["Inspection date", "date"], ["Report due date", "date", null, true], ["Agreed fee", "number"]
    ],
    "Leasing (Commercial Agency)": [
      ["Representation", "select", ["Letting - Landlord Rep", "Letting - Tenant Rep"], true],
      ["Instruction date", "date", null, true], ["Asking rent (pa)", "number"], ["Commission %", "number"], ["Marketing launch date", "date"]
    ],
    "Capital Markets": [
      ["Transaction type", "select", ["Sale", "Purchase", "Letting - Landlord Rep", "Letting - Tenant Rep", "Debt/Finance", "Consultancy", "Other"], true],
      ["Instruction date (S3)", "date", null, true], ["Capital value", "number"], ["Target completion", "date"]
    ],
    "Capital Advisory": [
      ["Finance type", "select", ["Senior Debt", "Mezzanine", "Development Finance", "Refinancing"], true],
      ["Mandate date", "date", null, true], ["Target loan amount", "number", null, true], ["Target drawdown", "date"]
    ],
    "Investor Advisory": [
      ["Mandate date", "date", null, true], ["Scope of work", "textarea", null, true], ["First report due", "date"]
    ],
    "Property Management": [
      ["Mandate date", "date", null, true], ["Units / leases managed", "number"], ["Scope of work", "textarea", null, true]
    ],
    "Occupier Strategy & Solutions": [
      ["Engagement type", "select", ["Location Search", "Lease Negotiation", "Portfolio Optimisation", "Workplace Strategy"], true],
      ["Brief date", "date", null, true], ["Scope of work", "textarea", null, true], ["Target completion", "date"]
    ],
    "Workplace Consulting": [
      ["Brief date", "date", null, true], ["Scope of work", "textarea", null, true], ["Report due date", "date"]
    ],
    "ESG Consultancy": [
      ["Assessment type", "select", ["Energy Audit", "CRREM Analysis", "Net Zero Pathway", "Certification"], true],
      ["Instruction date", "date", null, true], ["Report due date", "date"]
    ],
    "Building Consultancy": [
      ["Survey type", "select", ["Building Survey", "Dilapidations", "Project Monitoring", "Technical Due Diligence"], true],
      ["Instruction date", "date", null, true], ["Inspection date", "date"]
    ],
    "Development Consultancy": [
      ["Instruction date", "date", null, true], ["Scope of work", "textarea", null, true], ["Target completion", "date"]
    ]
  };
  const sample = [
    {
      id: "INS-000001", name: "Riverside acquisition", type: "Instruction",
      serviceLine: "Capital Markets", status: "Active",
      client: { id: "PTY-1003", name: "Harbour Homes Limited", type: "Company" },
      legalEntity: { id: "PTY-1004", name: "Quay Street Ventures Ltd", type: "Company" },
      primaryContact: { id: "PTY-1001", name: "Avery Morgan", type: "Individual" },
      primaryAsset: { id: "AST-1001", name: "Riverside Estate", type: "Estate" },
      relatedAssets: [{ id: "AST-1002", name: "Riverside North Parcel", type: "Land parcel" }],
      owningOffice: "Bristol", startDate: "2026-10-12", signedDate: "2026-10-14",
      expectedRevenue: 85000, currency: "GBP", comments: "Illustrative transaction instruction.",
      finance: { localSystemRef: "DEMO-GL-2048", localSystemName: "Demo Finance", projectId: "PRJ-2048" },
      createdAt: "2026-10-12T09:00:00.000Z", updatedAt: "2026-10-14T09:00:00.000Z"
    },
    {
      id: "INS-000002", name: "North parcel valuation", type: "Instruction",
      serviceLine: "Valuations", status: "Active",
      client: { id: "PTY-1003", name: "Harbour Homes Limited", type: "Company" },
      legalEntity: { id: "PTY-1003", name: "Harbour Homes Limited", type: "Company" },
      primaryContact: { id: "PTY-1002", name: "Jordan Lee", type: "Individual" },
      primaryAsset: { id: "AST-1002", name: "Riverside North Parcel", type: "Land parcel" },
      relatedAssets: [], owningOffice: "Bristol", startDate: "2026-09-01",
      expectedRevenue: 12000, currency: "GBP", valuationPurpose: "Secured Lending",
      valuationBasis: "Market Value", comments: "Sample valuation record.",
      finance: {}, createdAt: "2026-09-01T09:00:00.000Z", updatedAt: "2026-09-01T09:00:00.000Z"
    },
    {
      id: "INS-000003", name: "Exchange property management", type: "Mandate",
      serviceLine: "Property Management", status: "On Hold",
      client: { id: "PTY-1005", name: "Riverside Joint Purchasers", type: "Group" },
      legalEntity: { id: "PTY-1003", name: "Harbour Homes Limited", type: "Company" },
      primaryContact: { id: "PTY-1001", name: "Avery Morgan", type: "Individual" },
      primaryAsset: { id: "AST-1003", name: "Riverside Exchange", type: "Building" },
      relatedAssets: [{ id: "AST-1004", name: "Exchange — Suite 4B", type: "Unit" }],
      owningOffice: "Bristol", startDate: "2026-01-15", expectedRevenue: 28000,
      currency: "GBP", comments: "Management mandate held pending approval.",
      finance: {}, createdAt: "2026-01-15T09:00:00.000Z", updatedAt: "2026-02-01T09:00:00.000Z"
    },
    {
      id: "INS-000004", name: "Old Mill development review", type: "Engagement",
      serviceLine: "Development Consultancy", status: "Withdrawn",
      client: { id: "PTY-1004", name: "Quay Street Ventures Ltd", type: "Company" },
      legalEntity: { id: "PTY-1004", name: "Quay Street Ventures Ltd", type: "Company" },
      primaryContact: { id: "PTY-1002", name: "Jordan Lee", type: "Individual" },
      primaryAsset: { id: "AST-1005", name: "Old Mill Works", type: "Site" },
      relatedAssets: [], owningOffice: "Bath", startDate: "2025-03-01", endDate: "2025-08-31",
      terminationReason: "Client request", currency: "GBP",
      comments: "Fictional withdrawn engagement.", finance: {},
      createdAt: "2025-03-01T09:00:00.000Z", updatedAt: "2025-08-31T09:00:00.000Z"
    }
  ];

  const clone = value => JSON.parse(JSON.stringify(value));
  function getSampleInstructions() { return clone(sample); }
  function validateInstruction(record, records = [], editingId = "") {
    const errors = [];
    if (!record || typeof record !== "object") return ["Enter Instruction details."];
    if (!record.id?.trim()) errors.push("Enter an Instruction identifier.");
    if (!record.name?.trim()) errors.push("Enter an Instruction name.");
    if (!TYPES.includes(record.type)) errors.push("Choose a valid Instruction type.");
    if (!SERVICE_LINES.includes(record.serviceLine)) errors.push("Choose a valid service line.");
    if (!STATUS.includes(record.status)) errors.push("Choose a valid status.");
    if (!record.client?.id) errors.push("Select a client.");
    if (!record.owningOffice?.trim()) errors.push("Enter an owning office.");
    if (!record.startDate) errors.push("Enter a start date.");
    if (record.endDate && record.startDate && record.endDate < record.startDate) errors.push("End date cannot precede the start date.");
    if (record.status === "Withdrawn" && !record.terminationReason?.trim()) errors.push("Enter a termination reason for a withdrawn Instruction.");
    if (record.id && records.some(item => item.id.toLowerCase() === record.id.toLowerCase() && item.id !== editingId)) errors.push("That Instruction identifier is already in use.");
    return [...new Set(errors)];
  }
  function searchInstructions(records, query = "", type = "", serviceLine = "", status = "") {
    const needle = query.trim().toLocaleLowerCase();
    return records.filter(record => {
      const related = [record.client, record.legalEntity, record.primaryContact, record.primaryAsset, ...(record.relatedAssets || [])]
        .flatMap(item => item ? [item.id, item.name, item.type] : []);
      const searchable = [record.id, record.name, record.type, record.serviceLine, record.status, record.owningOffice, record.comments, ...related]
        .filter(Boolean).join(" ").toLocaleLowerCase();
      return (!needle || searchable.includes(needle)) &&
        (!type || record.type === type) &&
        (!serviceLine || record.serviceLine === serviceLine) &&
        (!status || record.status === status);
    });
  }
  return { STORAGE_KEY, TYPES, STATUS, SERVICE_LINES, SERVICE_LINE_DEFINITIONS, SERVICE_LINE_MAP, DYNAMIC_FIELDS, getSampleInstructions, validateInstruction, searchInstructions };
});
