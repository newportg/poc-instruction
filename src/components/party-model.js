(function (root) {
  "use strict";
  const types = ["individual", "company", "group"];
  const statuses = ["Active", "Inactive", "Archived"];
  function searchParties(parties, query = "", type = "", status = "") {
    const needle = query.trim().toLocaleLowerCase();
    return parties.filter(party => {
      const text = [party.id, party.displayName, party.name, party.type, party.legalName, party.tradingName, party.registrationNumber].filter(Boolean).join(" ").toLocaleLowerCase();
      return (!needle || text.includes(needle)) && (!type || party.type === type) && (!status || party.status === status);
    });
  }
  function validateParty(party, parties = [], editingId = "") {
    const errors = [];
    if (!types.includes(String(party.type).toLowerCase())) errors.push("Choose an individual, company, or group type.");
    if (!party.displayName?.trim()) errors.push("Enter a display name.");
    if (!statuses.includes(party.status)) errors.push("Choose a valid record status.");
    if (parties.some(item => item.id === party.id && item.id !== editingId)) errors.push("That Party identifier is already in use.");
    return errors;
  }
  root.PartyModel = { searchParties, validateParty };
})(globalThis);
