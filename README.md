# POC Instruction

Static catalogue client for Mandates, Engagements, and Instructions. It uses the same catalogue/detail interaction pattern as the POC Party and POC Asset clients.

The catalogue remains the home page. **New Instruction** opens a six-step workflow matching the POC Instructions static app: Client, Property, Service line, Details, Terms, and Review. Client and Property include the original app’s fields, with Party and Asset lookup adapters retained. The Client step also includes a Party Explorer-style catalogue with search, type/status filters, existing-client selection, and Create new client mode; new clients are saved to this browser and selected for the Instruction. The Service line step uses the original project’s tiled service-line selection; each service line derives the record type as Mandate, Engagement, or Instruction. Details render the selected service line’s dynamic fields, while Terms includes fee basis, fee amount, currency, expected revenue, owning office, assigned handler, and notes. Existing records can be edited through the same workflow.

## Run locally

Run the local client with the repository script:

```powershell
.\scripts\run-local.ps1
```

The default address is `http://127.0.0.1:5176/`. Choose another port with `-ClientPort 8080`.
The script copies `src` to a temporary directory, starts the static server, opens the browser, and cleans up when you press Enter.

Alternatively, serve this directory with any static web server and open `src/index.html`.

The client stores fictional records in browser `localStorage`. Use **Reset sample data** to restore the examples.

## Party and Asset integrations

Set `PARTY_API_BASE_URL` and `ASSET_API_BASE_URL` in [`src/config.js`](src/config.js). The adapters call:

- `GET {PARTY_API_BASE_URL}/api/parties/search?q=...`
- `GET {ASSET_API_BASE_URL}/api/assets/search?q=...`

Both endpoints must return `{ "items": [{ "id": "...", "name": "...", "type": "..." }] }`. Empty URLs intentionally use fictional local fixtures and show the source in the lookup form. The existing POC Party and POC Asset projects do not currently expose these general catalogue routes, so this fallback is explicit rather than silently presenting live data.

## Scope

The data model follows the documentation in the central [POC Documentation](https://newportg.github.io/POC-Documentation/projects/Instruction/instruction-types/) site:

- `Mandate`, `Engagement`, and `Instruction` record types
- Service-line classification and lifecycle status
- Client, legal entity, contact, primary asset, and related asset references
- Expected revenue and finance-system references

This is a browser-only demonstrator, not a production system.
