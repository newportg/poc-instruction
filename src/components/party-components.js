(function (root) {
  "use strict";
  const model = root.PartyModel;
  if (!model) throw new Error("Party components require party-model.js first.");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  class PartyCatalogue extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._parties = []; this._selectedId = ""; }
    connectedCallback() {
      this.shadowRoot.innerHTML = `<style>:host{display:block;color:#e8e8f0;font:14px system-ui,sans-serif}.toolbar{display:grid;grid-template-columns:1fr 140px 140px;gap:8px;margin-bottom:10px}input,select{min-height:35px;border:1px solid #30303e;border-radius:7px;background:#15151f;color:inherit;padding:0 9px}.list{display:grid;gap:6px;max-height:190px;overflow:auto}.party{display:flex;align-items:center;gap:9px;width:100%;border:1px solid #2d2c3b;border-radius:8px;background:#15151f;color:inherit;padding:8px;text-align:left;cursor:pointer}.party:hover,.party.selected{border-color:#7772f5;background:#7772f526}.avatar{display:grid;place-items:center;width:29px;height:29px;border-radius:8px;background:#292744;color:#b9b4ff;font-size:10px;font-weight:700}.copy{display:flex;flex-direction:column;min-width:0;flex:1}.copy strong{font-size:10px}.copy small{color:#85849a;font-size:9px}.status{color:#61d5a5;font-size:8px}.empty{color:#85849a;padding:15px;text-align:center}@media(max-width:600px){.toolbar{grid-template-columns:1fr}}</style><div class="toolbar"><input id="query" type="search" placeholder="Search name, ID, company, or contact"><select id="type"><option value="">All types</option><option>Individual</option><option>Company</option><option>Group</option></select><select id="status"><option value="">Any status</option><option>Active</option><option>Inactive</option><option>Archived</option></select></div><div class="list" id="list"></div>`;
      ["query", "type", "status"].forEach(id => this.shadowRoot.querySelector(`#${id}`).addEventListener("input", () => this.render()));
      this.render();
    }
    set parties(value) { this._parties = Array.isArray(value) ? value : []; this.render(); }
    get parties() { return this._parties; }
    render() {
      const query = this.shadowRoot?.querySelector("#query")?.value || "";
      const type = this.shadowRoot?.querySelector("#type")?.value || "";
      const status = this.shadowRoot?.querySelector("#status")?.value || "";
      const rows = model.searchParties(this._parties, query, type, status);
      const list = this.shadowRoot?.querySelector("#list"); if (!list) return;
      list.innerHTML = rows.length ? rows.map(party => `<button type="button" class="party ${party.id === this._selectedId ? "selected" : ""}" data-id="${esc(party.id)}"><span class="avatar">${esc((party.displayName || party.name || "P").slice(0, 1).toUpperCase())}</span><span class="copy"><strong>${esc(party.displayName || party.name)}</strong><small>${esc(party.id)} · ${esc(party.type)}</small></span><span class="status">${esc(party.status)}</span></button>`).join("") : `<div class="empty">No clients match these filters.</div>`;
      list.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => { const party = this._parties.find(item => item.id === button.dataset.id); this._selectedId = party?.id || ""; this.render(); this.dispatchEvent(new CustomEvent("party-selected", { bubbles: true, composed: true, detail: { party } })); }));
    }
  }
  class PartyEditor extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._party = null; this._parties = []; }
    connectedCallback() {
      this.shadowRoot.innerHTML = `<style>:host{display:block;color:#e8e8f0;font:14px system-ui,sans-serif}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}label{display:flex;flex-direction:column;gap:4px;color:#aaa9ba;font-size:10px}label.wide,.section{grid-column:1/-1}input,select{min-height:34px;border:1px solid #30303e;border-radius:7px;background:#15151f;color:inherit;padding:0 9px}.section{color:#aaa5ff;font-size:9px;font-weight:700;letter-spacing:1px}.actions{display:flex;justify-content:flex-end;margin-top:12px}.button{border:1px solid #7772f5;border-radius:7px;background:#716df6;color:#fff;padding:8px 12px;cursor:pointer}.feedback{color:#ffb6b8;font-size:10px;margin-bottom:8px}@media(max-width:600px){.grid{grid-template-columns:1fr}label.wide,.section{grid-column:auto}}</style><div class="party-editor-form"><div class="feedback" hidden></div><div class="grid"><div class="section">PARTY RECORD</div><label class="wide">Display name *<input name="displayName" required></label><label>Party type *<select name="type" required><option>Individual</option><option>Company</option><option>Group</option></select></label><label>Record status *<select name="status" required><option>Active</option><option>Inactive</option><option>Archived</option></select></label><label>Given names<input name="givenNames"></label><label>Family name<input name="familyName"></label><label>Date of birth<input name="dateOfBirth" type="date"></label><label>Nationality<input name="nationality"></label><label>Legal name<input name="legalName"></label><label>Trading name<input name="tradingName"></label><label>Legal form<input name="legalForm"></label><label>Registration reference<input name="registrationNumber"></label><label>Jurisdiction<input name="jurisdiction"></label></div><div class="actions"><button class="button" type="button" data-save>Save new client</button></div></div>`;
      this.shadowRoot.querySelector("[data-save]").addEventListener("click", () => this.save());
      this.populate();
    }
    set party(value) { this._party = value || null; this.populate(); }
    set parties(value) { this._parties = Array.isArray(value) ? value : []; }
    populate() { if (!this.shadowRoot) return; const party = this._party || {}; ["displayName", "type", "status", "givenNames", "familyName", "dateOfBirth", "nationality", "legalName", "tradingName", "legalForm", "registrationNumber", "jurisdiction"].forEach(name => { const input = this.shadowRoot.querySelector(`[name="${name}"]`); if (input) input.value = party[name] || (name === "type" ? "Individual" : name === "status" ? "Active" : ""); }); }
    save() {     const data = {}; this.shadowRoot.querySelectorAll("[name]").forEach(input => { data[input.name] = input.value; }); const party = { ...this._party, ...data, id: this._party?.id || `PTY-${Date.now()}`, createdAt: this._party?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }; const errors = model.validateParty({ ...party, type: party.type.toLowerCase() }, this._parties, this._party?.id || ""); if (errors.length) { const feedback = this.shadowRoot.querySelector(".feedback"); feedback.hidden = false; feedback.textContent = errors.join(" "); return; } this._party = party; this.dispatchEvent(new CustomEvent("party-saved", { bubbles: true, composed: true, detail: { party } })); }
  }
  root.customElements.define("poc-party-catalogue", PartyCatalogue);
  root.customElements.define("poc-party-editor", PartyEditor);
})(globalThis);
