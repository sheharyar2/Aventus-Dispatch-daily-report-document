# Aventus Dispatch Operations Dashboard

A Next.js app for daily dispatch review. Enter site data once in the main log; the
KPIs and summary/handover sections auto-fill. Export a polished PDF **entirely in the
browser** (no server, no screenshots) via [`@react-pdf/renderer`](https://react-pdf.org).

## Why the PDF looks good now

The PDF is authored as a **separate document tree** (`components/ReportPDF.jsx`) using
`@react-pdf/renderer` — it is *not* a screenshot or print of the editable form. That means:

- **Vector text** (crisp, selectable), not a rasterized image
- **No input fields** ever appear — the document only contains report content
- Real, controllable **pagination** and a repeating table header
- Same theme as the app: **Geist + Geist Mono** only, navy header, colored KPI accents, badge pills

Generation runs client-side: the "Download PDF" button calls `pdf(<ReportPDF/>).toBlob()`
and downloads the file. `@react-pdf/renderer` is dynamically imported so it stays out of
the initial bundle.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build / deploy

```bash
npm run build
npm start
```

Deploys as-is to Vercel or any static/Node host.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.jsx` | Renders the dashboard |
| `components/Dashboard.jsx` | Interactive form (client component) + PDF download |
| `components/ReportPDF.jsx` | The `@react-pdf/renderer` PDF document (theme mirror) |
| `lib/model.js` | Shared data model, KPI/summary derivation, badge colors |
| `public/fonts/` | Geist + Geist Mono TTFs (registered with react-pdf) |
| `legacy/index.html` | Previous single-file version (kept for reference) |

## Fonts

Only **Geist** (UI + headings) and **Geist Mono** (numbers/data) are used. The app loads
them via the `geist` package; the PDF registers the local TTFs in `public/fonts/`.
