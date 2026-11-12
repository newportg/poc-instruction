(function (root) {
  "use strict";
  async function search(baseUrl, path, query, fallback, normalize) {
    if (!baseUrl || !baseUrl.trim()) return { items: fallback(), source: "Local fictional data", available: false };
    const url = new URL(path, baseUrl.trim());
    url.searchParams.set("q", query.trim());
    try {
      const response = await fetch(url.href, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Service request failed (HTTP ${response.status}).`);
      const data = await response.json();
      if (!data || !Array.isArray(data.items)) throw new Error("Service returned an unexpected response.");
      return { items: data.items.map(normalize), source: "Configured API", available: true };
    } catch (error) {
      console.warn(`Lookup failed for ${path}.`, error);
      return { items: fallback(), source: `Local fictional data — API unavailable (${error.message})`, available: false };
    }
  }
  const normalizeParty = item => ({
    id: item.id || item.partyId || item.company_number || "",
    name: item.name || item.displayName || item.title || "",
    type: item.type || item.partyType || "Party"
  });
  const normalizeAsset = item => ({
    id: item.id || item.assetId || "",
    name: item.name || item.displayName || item.title || "",
    type: item.type || item.assetType || "Asset",
    address: item.address || item.location || ""
  });
  root.InstructionApi = {
    searchParties: (query, fallback) => search(root.PARTY_API_BASE_URL, "/api/parties/search", query, fallback, normalizeParty),
    searchAssets: (query, fallback) => search(root.ASSET_API_BASE_URL, "/api/assets/search", query, fallback, normalizeAsset)
  };
})(globalThis);
