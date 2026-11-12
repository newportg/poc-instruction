(function () {
  "use strict";
  const M = window.InstructionModel;
  const $ = id => document.getElementById(id);
  const partyFixtures = () => [
    { id: "PTY-1001", name: "Avery Morgan", type: "Individual" },
    { id: "PTY-1002", name: "Jordan Lee", type: "Individual" },
    { id: "PTY-1003", name: "Harbour Homes Limited", type: "Company" },
    { id: "PTY-1004", name: "Quay Street Ventures Ltd", type: "Company" },
    { id: "PTY-1005", name: "Riverside Joint Purchasers", type: "Group" }
  ];
  const assetFixtures = () => [
    { id: "AST-1001", name: "Riverside Estate", type: "Estate" },
    { id: "AST-1002", name: "Riverside North Parcel", type: "Land parcel" },
    { id: "AST-1003", name: "Riverside Exchange", type: "Building" },
    { id: "AST-1004", name: "Exchange — Suite 4B", type: "Unit" },
    { id: "AST-1005", name: "Old Mill Works", type: "Site" }
  ];
  const serviceLineAliases = { OSS: "Occupier Strategy & Solutions", Development: "Development Consultancy", "Building Consultancy": "Building Consultancy" };
  const officeDirectory = {
    London: ["Alex Johnson", "Michael Roberts", "Emma Davies"], Manchester: ["James Wilson", "Sophie Taylor"],
    Madrid: ["Miguel Fernández", "Carmen Ruiz", "Javier Moreno"], Barcelona: ["Laura Martínez", "Pablo García"],
    Paris: ["Claire Fournier", "Luc Dubois", "Émilie Martin"], Lyon: ["Théo Lefèvre", "Julie Blanc"],
    Berlin: ["Anna Müller", "Thomas Becker", "Julia Schmidt"], Frankfurt: ["Lukas Wagner", "Svenja Weber"],
    Warsaw: ["Katarzyna Nowak", "Piotr Kowalski", "Anna Wiśniewska"], "Wrocław": ["Tomasz Mazur", "Magdalena Jankowska"]
  };
  let records = load();
  let clientRecords = loadClientRecords();
  let selectedId = records[0]?.id || "";
  let editingId = "";
  let selectedParty = null;
  let selectedAsset = null;
  let clientMode = "existing";
  let wizardStep = 0;
  const wizardLabels = ["Client", "Property", "Type", "Details", "Terms", "Review"];
  const fill = (select, values, placeholder) => {
    select.innerHTML = `<option value="">${placeholder}</option>` + values.map(value => `<option>${escapeHtml(value)}</option>`).join("");
  };
  function load() {
    try { const saved = JSON.parse(localStorage.getItem(M.STORAGE_KEY)); return Array.isArray(saved) && saved.length ? saved : M.getSampleInstructions(); }
    catch (error) { console.warn("Could not load saved Instructions.", error); return M.getSampleInstructions(); }
  }
  function syncPartyFields(party) {
    if (!party) return;
    $("client-name").value = party.displayName || party.name || "";
    $("party-type").value = party.type || "Individual";
    $("party-record-status").value = party.status || "Active";
    $("client-given").value = party.givenNames || "";
    $("client-family").value = party.familyName || "";
    $("client-dob").value = party.dateOfBirth || "";
    $("client-nationality").value = party.nationality || "";
    $("client-legal-name").value = party.legalName || "";
    $("client-trading-name").value = party.tradingName || "";
    $("client-legal-form").value = party.legalForm || "";
    $("client-registration").value = party.registrationNumber || "";
    $("client-jurisdiction").value = party.jurisdiction || "";
    updateClientTypeFields();
  }
  function updateLeaseTermVisibility() {
    $("lease-term-field").classList.toggle("lease-term-hidden", $("property-tenure").value !== "Leasehold");
  }
  function save() { localStorage.setItem(M.STORAGE_KEY, JSON.stringify(records)); }
  function loadClientRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem("poc-instruction.clients.v1"));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (error) { console.warn("Could not load saved clients.", error); }
    return partyFixtures().map(item => ({ ...item, displayName: item.name, status: "Active" }));
  }
  function saveClientRecords() { localStorage.setItem("poc-instruction.clients.v1", JSON.stringify(clientRecords)); }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
  function initials(value) { return (value || "I").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(); }
  function renderList() {
    const filtered = M.searchInstructions(records, $("search-input").value, $("type-filter").value, $("service-filter").value, $("status-filter").value);
    $("record-count").textContent = filtered.length;
    $("visible-count").textContent = `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;
    $("instruction-list").innerHTML = filtered.length ? filtered.map(record => `<li class="instruction-row ${record.id === selectedId ? "selected" : ""}" data-id="${escapeHtml(record.id)}"><span class="row-icon">${escapeHtml(initials(record.type))}</span><span class="row-main"><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.id)} · ${escapeHtml(record.serviceLine)}</small></span><span class="status-dot ${record.status.toLowerCase().replace(" ", "-")}">${escapeHtml(record.status)}</span></li>`).join("") : `<li class="list-empty">No Instructions match these filters.</li>`;
    document.querySelectorAll(".instruction-row").forEach(row => row.addEventListener("click", () => { selectedId = row.dataset.id; renderList(); renderDetail(); }));
  }
  function renderDetail() {
    const record = records.find(item => item.id === selectedId);
    if (!record) { $("detail-panel").innerHTML = `<div class="detail-empty"><span class="empty-glyph">◈</span><h2>Select an Instruction</h2><p>Choose a record from the catalogue to see its details.</p></div>`; return; }
    const connection = item => item ? `<div class="connection-card"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.type)}</small></div>` : `<span class="muted">Not supplied</span>`;
    $("detail-panel").innerHTML = `<div class="detail-top"><span class="record-label">${escapeHtml(record.type.toUpperCase())} / ${escapeHtml(record.id)}</span><button class="button button-outline" id="edit-record" type="button">Edit record</button></div><div class="detail-title"><span class="detail-avatar">${escapeHtml(initials(record.type))}</span><div class="title-copy"><h2>${escapeHtml(record.name)}</h2><p>${escapeHtml(record.serviceLine)} · ${escapeHtml(record.owningOffice)}</p></div><span class="status-badge ${record.status.toLowerCase().replace(" ", "-")}">${escapeHtml(record.status)}</span></div><div class="content-grid">
      <article class="info-card"><div class="card-title">Lifecycle</div><div class="data-grid"><div><span class="micro-label">TYPE</span><strong>${escapeHtml(record.type)}</strong></div><div><span class="micro-label">SERVICE LINE</span><strong>${escapeHtml(record.serviceLine)}</strong></div><div><span class="micro-label">START DATE</span><strong>${escapeHtml(record.startDate || "—")}</strong></div><div><span class="micro-label">END DATE</span><strong>${escapeHtml(record.endDate || "—")}</strong></div><div><span class="micro-label">OWNING OFFICE</span><strong>${escapeHtml(record.owningOffice)}</strong></div><div><span class="micro-label">EXPECTED REVENUE</span><strong>${escapeHtml(record.expectedRevenue ? `${record.currency || "GBP"} ${Number(record.expectedRevenue).toLocaleString()}` : "—")}</strong></div></div></article>
      <article class="info-card"><div class="card-title">Client and legal entity</div><div class="connection-list">${connection(record.client)}${connection(record.legalEntity)}</div></article>
      <article class="info-card"><div class="card-title">People and properties</div><div class="data-grid"><div><span class="micro-label">PRIMARY CONTACT</span>${connection(record.primaryContact)}</div><div><span class="micro-label">PRIMARY ASSET</span>${connection(record.primaryAsset)}</div></div><div class="connection-list" style="margin-top:10px">${(record.relatedAssets || []).map(connection).join("") || '<span class="muted">No related assets</span>'}</div></article>
      <article class="info-card"><div class="card-title">Finance reference</div><div class="data-grid"><div><span class="micro-label">SYSTEM</span><strong>${escapeHtml(record.finance?.localSystemName || "—")}</strong></div><div><span class="micro-label">REFERENCE</span><strong>${escapeHtml(record.finance?.localSystemRef || "—")}</strong></div><div><span class="micro-label">PROJECT</span><strong>${escapeHtml(record.finance?.projectId || "—")}</strong></div></div></article>
      <article class="info-card wide"><div class="card-title">Notes</div><p style="margin:0;color:#a8a6b8;font-size:11px">${escapeHtml(record.comments || "No comments recorded.")}</p>${record.terminationReason ? `<p style="margin:10px 0 0;color:#e3aa71;font-size:10px"><strong>Termination:</strong> ${escapeHtml(record.terminationReason)}</p>` : ""}</article>
    </div>`;
    $("edit-record").addEventListener("click", () => openDialog(record));
  }
  function renderClientCatalogue() {
    const catalogue = $("client-party-catalogue");
    if (catalogue) { catalogue.parties = clientRecords; catalogue.selectedId = selectedParty?.id || ""; }
  }
  function setClientMode(mode) {
    clientMode = mode;
    $("existing-client-mode").classList.toggle("active", mode === "existing");
    $("new-client-mode").classList.toggle("active", mode === "new");
    $("existing-client-panel").hidden = mode !== "existing";
    $("new-client-panel").hidden = mode !== "new";
    $("client-name").required = mode === "new";
    $("contact-name").required = mode === "new";
    if (mode === "new") {
      selectedParty = null;
      $("client-party-editor").party = null;
      $("client-name").value = ""; $("contact-name").value = ""; $("legal-entity").value = "";
    }
    updateClientTypeFields();
  }
  function selectClient(party) {
    if (!party) return;
    selectedParty = party;
    setClientMode("existing");
    $("party-query").value = party.displayName || party.name || "";
    $("client-name").value = party.displayName || party.name || "";
    const partyType = String(party.type || "Company");
    $("party-type").value = partyType.toLowerCase() === "company" ? "Company" : partyType.toLowerCase() === "group" ? "Group" : partyType;
    $("party-record-status").value = party.status || "Active";
    $("contact-name").value = party.contactName || party.primaryContact?.name || "";
    $("legal-entity").value = party.legalName || "";
    $("client-given").value = party.givenNames || "";
    $("client-family").value = party.familyName || "";
    $("client-dob").value = party.dateOfBirth || "";
    $("client-nationality").value = party.nationality || "";
    $("client-legal-name").value = party.legalName || "";
    $("client-trading-name").value = party.tradingName || "";
    $("client-legal-form").value = party.legalForm || "";
    $("client-registration").value = party.registrationNumber || "";
    $("client-jurisdiction").value = party.jurisdiction || "";
    updateClientTypeFields();
    $("client-party-editor").party = party;
    renderClientCatalogue();
  }
  function updateClientTypeFields() {
    const individualFields = $("individual-client-fields");
    const companyFields = $("company-client-fields");
    if (individualFields) individualFields.hidden = $("party-type").value === "Company";
    if (companyFields) companyFields.hidden = $("party-type").value !== "Company";
  }
  function renderWizard() {
    document.querySelectorAll(".wizard-panel").forEach(panel => panel.classList.toggle("active", Number(panel.dataset.step) === wizardStep));
    $("wizard-steps").innerHTML = wizardLabels.map((label, index) => `<button type="button" class="wizard-step ${index === wizardStep ? "active" : ""} ${index < wizardStep ? "done" : ""}" data-wizard-step="${index}"><span>STEP ${index + 1}</span>${label}</button>`).join("");
    $("wizard-back").disabled = wizardStep === 0;
    $("wizard-next").hidden = wizardStep === wizardLabels.length - 1;
    $("wizard-save").hidden = wizardStep !== wizardLabels.length - 1;
    document.querySelectorAll("[data-wizard-step]").forEach(button => button.addEventListener("click", () => { wizardStep = Number(button.dataset.wizardStep); renderWizard(); }));
    const selectedServiceLine = $("form-service").value;
    $("derived-type").value = M.SERVICE_LINE_MAP[selectedServiceLine]?.core || "";
    $("service-grid").innerHTML = M.SERVICE_LINE_DEFINITIONS.map(([serviceLine, core, icon, description]) =>
      `<button type="button" class="type-card ${selectedServiceLine === serviceLine ? "selected" : ""}" data-service-choice="${escapeHtml(serviceLine)}"><span class="type-icon">${icon}</span><strong>${escapeHtml(serviceLine)}</strong><small>${escapeHtml(description)} · ${escapeHtml(core)}</small></button>`
    ).join("");
    document.querySelectorAll("[data-service-choice]").forEach(button => button.addEventListener("click", () => {
      const serviceLine = button.dataset.serviceChoice;
      $("form-service").value = serviceLine;
      $("form-type").value = M.SERVICE_LINE_MAP[serviceLine].core;
      renderWizard();
    }));
    renderDynamicDetails();
    if (wizardStep === wizardLabels.length - 1) {
      const record = collect();
      const rows = [
        ["Name", record.name], ["Identifier", record.id], ["Type", record.type],
        ["Service line", record.serviceLine], ["Status", record.status],
        ["Client", record.client ? `${record.client.name} (${record.client.id})` : "Not selected"],
        ["Primary asset", record.primaryAsset ? `${record.primaryAsset.name} (${record.primaryAsset.id})` : "Not selected"],
        ["Owning office", record.owningOffice], ["Dates", `${record.startDate || "—"} to ${record.endDate || "open"}`],
        ["Expected revenue", record.expectedRevenue ? `${record.currency} ${Number(record.expectedRevenue).toLocaleString()}` : "Not supplied"],
        ["Fee", record.feeBasis ? `${record.feeBasis}${record.feeAmount ? ` — ${record.currency} ${Number(record.feeAmount).toLocaleString()}` : ""}` : "Not supplied"],
        ["Assigned to", record.assignedTo || "Not assigned"], ["Comments", record.comments || "None"]
      ];
      $("wizard-review").innerHTML = rows.map(([label, value]) => `<div class="review-item ${label === "Comments" ? "wide" : ""}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("");
    }
    function dynamicKey(label) {
      return `dynamic_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
    }
    function renderDynamicDetails() {
      const container = $("dynamic-details");
      if (!container) return;
      const previous = {};
      container.querySelectorAll("[data-dynamic-key]").forEach(input => { previous[input.dataset.dynamicKey] = input.value; });
      const serviceLine = $("form-service").value;
      const fields = M.DYNAMIC_FIELDS[serviceLine] || [];
      $("dynamic-details-sub").textContent = serviceLine ? `${serviceLine} fields — required fields are marked *.` : "Choose a service line to show its fields.";
      container.innerHTML = fields.map(([label, type, options, required]) => {
        const key = dynamicKey(label);
        const value = previous[key] || "";
        const control = type === "select"
          ? `<select data-dynamic-key="${key}" ${required ? "required" : ""}><option value="">Select…</option>${options.map(option => `<option ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`
          : type === "textarea"
            ? `<textarea data-dynamic-key="${key}" rows="3" ${required ? "required" : ""}>${escapeHtml(value)}</textarea>`
            : `<input data-dynamic-key="${key}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} ${label.includes("equivalent") ? "readonly" : ""}>`;
        return `<label class="field ${type === "textarea" ? "field-wide" : ""}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ""}${control}</label>`;
      }).join("");
    }
  }
  function openDialog(record) {
    editingId = record?.id || "";
    wizardStep = 0;
    $("dialog-title").textContent = record ? "Edit Instruction" : "New Instruction";
    $("form-id").value = editingId;
    $("form-reference").value = record?.id || `INS-${String(records.length + 1).padStart(6, "0")}`;
    $("form-name").value = record?.name || "";
    const serviceLine = serviceLineAliases[record?.serviceLine] || record?.serviceLine || "Capital Markets";
    $("form-service").value = serviceLine;
    $("form-type").value = M.SERVICE_LINE_MAP[serviceLine]?.core || record?.type || "Instruction";
    $("form-status").value = record?.status || "Active";
    $("form-office").value = record?.owningOffice || "";
    $("form-start").value = record?.startDate || new Date().toISOString().slice(0, 10);
    $("form-end").value = record?.endDate || "";
    $("form-revenue").value = record?.expectedRevenue || "";
    $("form-currency").value = record?.currency || "GBP";
    $("form-fee-basis").value = record?.feeBasis || "";
    $("form-fee-amount").value = record?.feeAmount || "";
    $("form-office").value = record?.owningOffice || "";
    populateAssigned(record?.assignedTo || "");
    updateLeaseTermVisibility();
    $("form-termination").value = record?.terminationReason || "";
    $("form-comments").value = record?.comments || "";
    selectedParty = record?.client || null; selectedAsset = record?.primaryAsset || null;
    setClientMode("existing");
    $("party-query").value = selectedParty ? `${selectedParty.name} (${selectedParty.id})` : "";
    $("asset-query").value = selectedAsset ? `${selectedAsset.name} (${selectedAsset.id})` : "";
    $("client-name").value = record?.clientDetails?.name || selectedParty?.name || "";
    $("party-type").value = record?.clientDetails?.type || selectedParty?.type || "Company";
    $("contact-name").value = record?.clientDetails?.contactName || record?.primaryContact?.name || "";
    $("contact-email").value = record?.clientDetails?.email || "";
    $("contact-phone").value = record?.clientDetails?.phone || "";
    $("legal-entity").value = record?.clientDetails?.legalEntity || record?.legalEntity?.name || "";
    $("property-address").value = record?.propertyDetails?.address || "";
    $("property-city").value = record?.propertyDetails?.city || "";
    $("property-postcode").value = record?.propertyDetails?.postcode || "";
    $("property-country").value = record?.propertyDetails?.country || "";
    $("property-title-number").value = record?.propertyDetails?.titleNumber || "";
    $("property-tenure").value = record?.propertyDetails?.tenure || "Freehold";
    $("property-lease-term").value = record?.propertyDetails?.leaseTerm || "";
    $("property-sector").value = record?.propertyDetails?.sector || "Office";
    $("party-results").innerHTML = ""; $("asset-results").innerHTML = ""; $("form-feedback").hidden = true;
    renderClientCatalogue();
    renderWizard();
    Object.entries(record?.dynamicDetails || {}).forEach(([key, value]) => {
      const input = document.querySelector(`[data-dynamic-key="${key}"]`);
      if (input) input.value = value;
    });
    $("instruction-dialog").showModal();
  }
  function showLookupResults(container, items, onSelect) {
    container.innerHTML = items.length ? items.map((item, index) => `<button type="button" data-index="${index}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.type)}</small></button>`).join("") : `<span class="lookup-status">No matches found.</span>`;
    container.querySelectorAll("button").forEach(button => button.addEventListener("click", () => onSelect(items[Number(button.dataset.index)])));
  }
  function collect() {
    const dynamicDetails = {};
    document.querySelectorAll("[data-dynamic-key]").forEach(input => { dynamicDetails[input.dataset.dynamicKey] = input.value; });
    const clientDetails = { name: $("client-name").value.trim(), type: $("party-type").value, contactName: $("contact-name").value.trim(), email: $("contact-email").value.trim(), phone: $("contact-phone").value.trim(), legalEntity: $("legal-entity").value.trim() };
    const propertyDetails = { address: $("property-address").value.trim(), city: $("property-city").value.trim(), postcode: $("property-postcode").value.trim(), country: $("property-country").value, titleNumber: $("property-title-number").value.trim(), tenure: $("property-tenure").value, leaseTerm: $("property-lease-term").value.trim(), sector: $("property-sector").value };
    const client = selectedParty || { id: `LOCAL-${clientDetails.name.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`, name: clientDetails.name, type: clientDetails.type };
    const primaryContact = { id: `CONTACT-${clientDetails.contactName.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`, name: clientDetails.contactName, type: "Individual" };
    return { id: $("form-reference").value.trim(), name: $("form-name").value.trim(), type: $("form-type").value, serviceLine: $("form-service").value, status: $("form-status").value, owningOffice: $("form-office").value.trim(), startDate: $("form-start").value, endDate: $("form-end").value, expectedRevenue: Number($("form-revenue").value) || 0, feeBasis: $("form-fee-basis").value, feeAmount: Number($("form-fee-amount").value) || 0, assignedTo: $("form-assigned").value, currency: $("form-currency").value, terminationReason: $("form-termination").value.trim(), client, clientDetails, legalEntity: { id: `LEGAL-${clientDetails.legalEntity.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`, name: clientDetails.legalEntity || clientDetails.name, type: "Company" }, primaryContact, propertyDetails, primaryAsset: selectedAsset || { id: `PROPERTY-${propertyDetails.postcode.replace(/[^A-Z0-9]+/gi, "")}`, name: propertyDetails.address, type: "Property" }, relatedAssets: [], dynamicDetails, comments: $("form-comments").value.trim(), finance: {}, updatedAt: new Date().toISOString(), createdAt: records.find(item => item.id === editingId)?.createdAt || new Date().toISOString() };
  }
  function populateAssigned(selected = "") {
    const office = $("form-office").value;
    const names = officeDirectory[office] || [];
    $("form-assigned").innerHTML = `<option value="">${office ? "Select assigned handler…" : "Select owning office first…"}</option>${names.map(name => `<option ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}`;
  }
  function createClientRecord() {
    const name = $("client-name").value.trim();
    const id = `PTY-${String(1000 + clientRecords.length + 1).padStart(4, "0")}`;
    return {
      id, type: $("party-type").value, status: $("party-record-status").value, displayName: name, name,
      givenNames: $("client-given").value.trim(), familyName: $("client-family").value.trim(),
      dateOfBirth: $("client-dob").value, nationality: $("client-nationality").value.trim(),
      legalName: $("client-legal-name").value.trim(), tradingName: $("client-trading-name").value.trim(),
      legalForm: $("client-legal-form").value.trim(), registrationNumber: $("client-registration").value.trim(),
      jurisdiction: $("client-jurisdiction").value.trim(), contactName: $("contact-name").value.trim(),
      email: $("contact-email").value.trim(), phone: $("contact-phone").value.trim(),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }
  function init() {
    fill($("type-filter"), M.TYPES, "All types"); fill($("service-filter"), M.SERVICE_LINES, "All service lines"); fill($("status-filter"), M.STATUS, "Any status");
    fill($("form-type"), M.TYPES, "Choose type"); fill($("form-service"), M.SERVICE_LINES, "Choose service line"); fill($("form-status"), M.STATUS, "Choose status");
    ["search-input", "type-filter", "service-filter", "status-filter"].forEach(id => $(id).addEventListener("input", renderList));
    $("create-button").addEventListener("click", () => openDialog()); $("close-dialog").addEventListener("click", () => $("instruction-dialog").close()); $("cancel-dialog").addEventListener("click", () => $("instruction-dialog").close());
    $("wizard-back").addEventListener("click", () => { if (wizardStep > 0) { wizardStep -= 1; renderWizard(); } });
    $("wizard-next").addEventListener("click", () => { if (wizardStep < wizardLabels.length - 1) { wizardStep += 1; renderWizard(); } });
    $("form-office").addEventListener("change", () => populateAssigned());
    $("reset-button").addEventListener("click", () => { records = M.getSampleInstructions(); selectedId = records[0].id; save(); renderList(); renderDetail(); toast("Sample data restored."); });
    $("theme-toggle").addEventListener("click", () => { const light = document.documentElement.dataset.theme === "light"; document.documentElement.dataset.theme = light ? "dark" : "light"; $("theme-toggle").textContent = light ? "☼ Light" : "☾ Dark"; });
    $("existing-client-mode").addEventListener("click", () => setClientMode("existing")); $("new-client-mode").addEventListener("click", () => setClientMode("new"));
    ["party-query", "party-type-filter", "party-status-filter"].forEach(id => $(id).addEventListener("input", renderClientCatalogue));
    $("client-party-catalogue").addEventListener("party-selected", event => selectClient(event.detail.party));
    $("client-party-editor").addEventListener("party-saved", event => { setClientMode("new"); selectedParty = event.detail.party; clientRecords = [selectedParty, ...clientRecords.filter(item => item.id !== selectedParty.id)]; saveClientRecords(); syncPartyFields(selectedParty); renderClientCatalogue(); $("party-status").textContent = "New client ready to use in this Instruction."; });
    $("party-type").addEventListener("change", updateClientTypeFields);
    $("party-search").addEventListener("click", async () => { $("party-status").textContent = "Searching…"; const result = await InstructionApi.searchParties($("party-query").value, partyFixtures); $("party-status").textContent = result.source; showLookupResults($("party-results"), result.items, item => selectClient({ ...item, displayName: item.name, status: "Active" })); });
    $("asset-search").addEventListener("click", async () => { $("asset-status").textContent = "Searching…"; const result = await InstructionApi.searchAssets($("asset-query").value, assetFixtures); $("asset-status").textContent = result.source; showLookupResults($("asset-results"), result.items, item => { selectedAsset = item; $("asset-query").value = `${item.name} (${item.id})`; $("property-address").value = item.address || $("property-address").value; $("asset-results").innerHTML = ""; }); });
    $("property-tenure").addEventListener("change", updateLeaseTermVisibility);
    $("instruction-form").addEventListener("submit", event => { event.preventDefault(); if (clientMode === "new" && !selectedParty) { $("form-feedback").hidden = false; $("form-feedback").textContent = "Save the new client before continuing."; return; } if (!$("instruction-form").checkValidity()) { $("instruction-form").reportValidity(); return; } const record = collect(); const errors = M.validateInstruction(record, records, editingId); if (errors.length) { $("form-feedback").hidden = false; $("form-feedback").innerHTML = errors.map(escapeHtml).join("<br>"); return; } records = editingId ? records.map(item => item.id === editingId ? record : item) : [record, ...records]; selectedId = record.id; save(); $("instruction-dialog").close(); renderList(); renderDetail(); toast(editingId ? "Instruction updated." : "Instruction created."); });
    renderClientCatalogue(); updateClientTypeFields(); renderList(); renderDetail();
  }
  function toast(message, error = false) { const element = $("toast"); element.textContent = message; element.className = `toast visible${error ? " error" : ""}`; setTimeout(() => element.classList.remove("visible"), 2800); }
  init();
})();
