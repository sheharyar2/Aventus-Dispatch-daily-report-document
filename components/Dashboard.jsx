"use client";

import { useEffect, useRef, useState } from "react";
import {
  defaultRow,
  blankRow,
  defaultMeta,
  OVERALL_STATUSES,
  computeDashboard,
  financeSuggestion,
  badgeTone,
  newRowId,
} from "@/lib/model";

function makeRow(data = {}) {
  return { id: newRowId(), financeTouched: false, ...defaultRow, ...data };
}

const ATT_OPTS = ["On Time", "Early Check-In", "Late Check-In"];
const CO_OPTS = ["On Time", "Early Check-Out"];
const QUAL_OPTS = ["Excellent", "Good", "Needs Improvement", "Poor"];
const ISSUE_OPTS = ["None", "Incident", "Maintenance", "Incident & Maintenance"];
const FIN_OPTS = ["No Action", "Deduct", "No Deduction", "Review", "Correct", "Bill"];
const PRI_OPTS = ["Low", "Medium", "High"];
const STATUS_OPTS = ["Clear", "Resolved", "Watch", "Action", "Escalated"];

// tiny inline icons
const Ic = {
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
  table: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
};

function ledColor(v) {
  const s = (v || "").toLowerCase();
  if (s.includes("all clear")) return { bg: "var(--green)", ring: "rgba(15,157,106,.16)" };
  if (s.includes("urgent")) return { bg: "var(--rose)", ring: "rgba(190,18,60,.16)" };
  if (s.includes("finance") || s.includes("follow-up")) return { bg: "var(--blue)", ring: "rgba(47,107,255,.16)" };
  return { bg: "var(--amber)", ring: "rgba(201,122,9,.16)" };
}

export default function Dashboard() {
  const [rows, setRows] = useState(() => [makeRow(defaultRow)]);
  const [meta, setMeta] = useState(defaultMeta);
  const [overallStatus, setOverallStatus] = useState(OVERALL_STATUSES[0]);
  const [downloading, setDownloading] = useState(false);
  const pdfMod = useRef(null);

  // Pre-warm the (heavy) PDF engine + fonts in the background so the first
  // "Download PDF" click is instant instead of waiting on a chunk download.
  useEffect(() => {
    let cancelled = false;
    const warm = async () => {
      try {
        const [renderer, reportMod] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/ReportPDF"),
        ]);
        if (!cancelled) pdfMod.current = { pdf: renderer.pdf, ReportPDF: reportMod.default };
      } catch (e) {
        /* will retry lazily on click */
      }
    };
    const ric = typeof window !== "undefined" && window.requestIdleCallback;
    const handle = ric ? window.requestIdleCallback(warm, { timeout: 2000 }) : setTimeout(warm, 800);
    return () => {
      cancelled = true;
      if (ric && handle) window.cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
  }, []);

  const d = computeDashboard(rows);

  function updateRow(id, patch) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nr = { ...r, ...patch };
        if ("finance" in patch) nr.financeTouched = true;
        if ("attendance" in patch && !["Early Check-In", "Late Check-In"].includes(nr.attendance)) nr.attMins = "";
        if ("checkout" in patch && nr.checkout !== "Early Check-Out") nr.earlyOutMins = "";
        if (("attendance" in patch || "attMins" in patch) && !nr.financeTouched) {
          nr.finance = financeSuggestion(nr).suggested;
        }
        return nr;
      })
    );
  }

  const addRow = () => setRows((p) => [...p, makeRow(blankRow)]);
  const deleteRow = (id) =>
    setRows((p) => {
      const n = p.filter((r) => r.id !== id);
      return n.length ? n : [makeRow(blankRow)];
    });
  const clearAll = () => {
    if (typeof window !== "undefined" && !window.confirm("Clear the dashboard and reset to one blank row?")) return;
    setRows([makeRow(blankRow)]);
  };
  const setMetaField = (k, v) => setMeta((m) => ({ ...m, [k]: v }));

  async function download() {
    setDownloading(true);
    try {
      let mod = pdfMod.current;
      if (!mod) {
        const [renderer, reportMod] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/ReportPDF"),
        ]);
        mod = { pdf: renderer.pdf, ReportPDF: reportMod.default };
        pdfMod.current = mod;
      }
      const { pdf, ReportPDF } = mod;
      const blob = await pdf(<ReportPDF data={{ meta, overallStatus, rows }} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Aventus_Dispatch_Operations_Dashboard.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error(e);
      alert("Sorry — the PDF could not be generated. See console for details.");
    } finally {
      setDownloading(false);
    }
  }

  const led = ledColor(overallStatus);
  const coverColor = d.coveragePct === 100 ? "var(--green)" : d.coveragePct >= 80 ? "var(--amber)" : "var(--red)";

  return (
    <>
      <div className="toolbar">
        <div className="brand-mini">
          <span className="dot" /> Aventus Dispatch Dashboard <span className="subnote">Daily operations tracker</span>
        </div>
        <button className="btn success" onClick={download} disabled={downloading}>
          {Ic.download}
          {downloading ? "Generating…" : "Download PDF"}
        </button>
        <button className="btn ghost" onClick={addRow}>
          {Ic.plus} Add Site Row
        </button>
        <button className="btn ghost" onClick={clearAll}>
          {Ic.trash} Clear
        </button>
      </div>

      <div className="shell">
        <main className="report">
          <div className="content">
            {/* Hero */}
            <section className="hero">
              <div className="hero-card">
                <div className="hero-top">
                  <div className="hero-mark">A</div>
                  <div>
                    <div className="hero-eyebrow">Aventus Security</div>
                    <h1>Daily Dispatch Operations Dashboard</h1>
                  </div>
                </div>
                <p>
                  One unified dashboard for dispatch review, issue action, escalation, finance impact, and handover. All
                  lower summary sections are auto-filled from the main log so the team enters data only once.
                </p>
                <div className="hero-badges">
                  <span className="pill">Single Main Log</span>
                  <span className="pill">Auto-Filled Summaries</span>
                  <span className="pill">Attendance Logic</span>
                  <span className="pill">Client-Side PDF</span>
                </div>
              </div>

              <div className="status-panel">
                <div className="status-box">
                  <div className="label">
                    <span className="led" style={{ background: led.bg, boxShadow: `0 0 0 4px ${led.ring}` }} /> Overall
                    Daily Status
                  </div>
                  <select value={overallStatus} onChange={(e) => setOverallStatus(e.target.value)}>
                    {OVERALL_STATUSES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <div className="cover-stat">
                    <div className="cover-top">
                      <div>
                        <div className="cover-num">
                          {d.kpis.reviewed} / {d.kpis.active}
                        </div>
                        <div className="cover-note">Sites reviewed today</div>
                      </div>
                      <div className="cover-note">Target: 100% active-site review</div>
                    </div>
                    <div className="track">
                      <div className="fill" style={{ width: `${d.coveragePct}%`, background: coverColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Meta */}
            <section className="meta-grid">
              <Field label="Report Date" value={meta.reportDate} onChange={(v) => setMetaField("reportDate", v)} />
              <Field label="Coverage Period" value={meta.coverage} onChange={(v) => setMetaField("coverage", v)} />
              <Field label="Prepared By" value={meta.preparedBy} onChange={(v) => setMetaField("preparedBy", v)} />
              <Field label="Reviewed By (Ops)" value={meta.reviewedBy} onChange={(v) => setMetaField("reviewedBy", v)} />
              <Field label="Shift Handover To" value={meta.handoverTo} onChange={(v) => setMetaField("handoverTo", v)} />
              <Field label="Submitted Time" value={meta.submittedTime} onChange={(v) => setMetaField("submittedTime", v)} />
            </section>

            {/* KPIs */}
            <section className="kpis">
              <Kpi title="Active Sites" value={d.kpis.active} desc="Total rows in the main site log" />
              <Kpi title="Reviewed" value={d.kpis.reviewed} desc="Rows marked as reviewed" tone="green" />
              <Kpi title="Late Check-Ins" value={d.kpis.late} desc="Tracks late arrivals today" tone="red" />
              <Kpi title="Early Check-Outs" value={d.kpis.earlyOut} desc="Rows with early check-out" tone="amber" />
              <Kpi title="Incidents / Maintenance" value={d.kpis.incidents} desc="Flagged for issue reporting" tone="indigo" />
              <Kpi title="Escalations / Finance" value={d.kpis.escFinance} desc="Escalated or finance-action rows" tone="cyan" />
            </section>

            {/* Table */}
            <section className="section-card">
              <div className="section-head">
                <div className="section-title">
                  <span className="icon">{Ic.table}</span>
                  <div>
                    <div className="t-main">Site Review &amp; Issue Action Log</div>
                    <div className="hint">
                      One section only — review, attendance, issues, escalation, finance, and status in the same row
                    </div>
                  </div>
                </div>
                <button className="btn ghost" onClick={addRow}>
                  + Add Row
                </button>
              </div>
              <div className="legend">
                <span className="legend-chip green">Early check-in = green</span>
                <span className="legend-chip red">Late check-in = red</span>
                <span className="legend-chip amber">Late beyond 10 minutes suggests deduction</span>
                <span className="legend-chip rose">Escalated items feed summary below</span>
                <span className="legend-chip slate">Column names stay visible while scrolling</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 170 }}>Site</th>
                      <th style={{ width: 90 }}>Reviewed</th>
                      <th style={{ width: 140 }}>Attendance</th>
                      <th style={{ width: 130 }}>Early / Late Minutes</th>
                      <th style={{ width: 130 }}>Check-Out</th>
                      <th style={{ width: 120 }}>Early Check-Out Minutes</th>
                      <th style={{ width: 120 }}>Report Quality</th>
                      <th style={{ width: 140 }}>Incident / Maintenance Report</th>
                      <th style={{ width: 320 }}>What Happened / Action Taken</th>
                      <th style={{ width: 120 }}>Escalated?</th>
                      <th style={{ width: 170 }}>Escalated To / Owner</th>
                      <th style={{ width: 140 }}>Finance Action</th>
                      <th style={{ width: 110 }}>Priority</th>
                      <th style={{ width: 110 }}>Status</th>
                      <th style={{ width: 52 }}>&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <RowEditor key={r.id} r={r} onChange={(patch) => updateRow(r.id, patch)} onDelete={() => deleteRow(r.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Summaries */}
            <section className="summary-grid">
              <SummaryCard cls="fixed" title="Fixed Directly by Dispatch" body={d.summaries.fixed} />
              <SummaryCard cls="escalated" title="Escalated — &amp; To Whom" body={d.summaries.escalated} />
              <SummaryCard cls="finance" title="Finance Actions — Deduct / Correct / Bill / Review" body={d.summaries.finance} />
              <div className="summary-card handover">
                <div className="hd">
                  <span className="tag" /> End-of-Shift Handover — Still Open / Next Shift
                </div>
                <div className="summary-body handover-grid">
                  <div>
                    <div className="subcap">Resolved During Shift</div>
                    <div className="summary-box">{d.summaries.resolved}</div>
                  </div>
                  <div>
                    <div className="subcap">Still Open / Next Shift</div>
                    <div className="summary-box">{d.summaries.open}</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="footer">
              <span>Prepared for Operations &amp; Finance — dashboard layout optimized for quick review.</span>
              <span>Confidential · Aventus Dispatch Operations</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Kpi({ title, value, desc, tone }) {
  return (
    <div className={`kpi ${tone || ""}`}>
      <div className="title">{title}</div>
      <div className="value">{value}</div>
      <div className="desc">{desc}</div>
    </div>
  );
}

function SummaryCard({ cls, title, body }) {
  return (
    <div className={`summary-card ${cls}`}>
      <div className="hd">
        <span className="tag" /> <span dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <div className="summary-body">
        <div className="summary-box">{body}</div>
      </div>
    </div>
  );
}

function Sel({ className, value, options, onChange }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function RowEditor({ r, onChange, onDelete }) {
  const fin = financeSuggestion(r);
  const attTone = badgeTone("attendance", r.attendance); // green | red | plain
  const attClass = attTone === "green" ? "sel-attendance green" : attTone === "red" ? "sel-attendance red" : "sel-attendance";
  const coClass = r.checkout === "Early Check-Out" ? "sel-checkout amber" : "sel-checkout";
  const showAtt = r.attendance === "Early Check-In" || r.attendance === "Late Check-In";
  const showCo = r.checkout === "Early Check-Out";

  return (
    <tr>
      <td>
        <input value={r.site} placeholder="Site name" onChange={(e) => onChange({ site: e.target.value })} />
      </td>
      <td>
        <Sel value={r.reviewed} options={["Yes", "No"]} onChange={(v) => onChange({ reviewed: v })} />
      </td>
      <td>
        <Sel className={attClass} value={r.attendance} options={ATT_OPTS} onChange={(v) => onChange({ attendance: v })} />
      </td>
      <td>
        {showAtt ? (
          <>
            <input
              type="number"
              min="0"
              value={r.attMins}
              placeholder="Minutes"
              onChange={(e) => onChange({ attMins: e.target.value })}
            />
            <div className="tiny-note">{r.attendance === "Late Check-In" ? "Late check-in minutes" : "Early check-in minutes"}</div>
          </>
        ) : (
          <div className="cell-muted">—</div>
        )}
      </td>
      <td>
        <Sel className={coClass} value={r.checkout} options={CO_OPTS} onChange={(v) => onChange({ checkout: v })} />
      </td>
      <td>
        {showCo ? (
          <>
            <input
              type="number"
              min="0"
              value={r.earlyOutMins}
              placeholder="Minutes"
              onChange={(e) => onChange({ earlyOutMins: e.target.value })}
            />
            <div className="tiny-note">Minutes checked out early</div>
          </>
        ) : (
          <div className="cell-muted">—</div>
        )}
      </td>
      <td>
        <Sel value={r.reportQuality} options={QUAL_OPTS} onChange={(v) => onChange({ reportQuality: v })} />
      </td>
      <td>
        <Sel value={r.issueType} options={ISSUE_OPTS} onChange={(v) => onChange({ issueType: v })} />
      </td>
      <td>
        <textarea
          value={r.action}
          placeholder="What happened? What action was taken?"
          onChange={(e) => onChange({ action: e.target.value })}
        />
      </td>
      <td>
        <Sel value={r.escalated} options={["No", "Yes"]} onChange={(v) => onChange({ escalated: v })} />
      </td>
      <td>
        <input value={r.owner} placeholder="Who was it escalated to?" onChange={(e) => onChange({ owner: e.target.value })} />
      </td>
      <td>
        <Sel value={r.finance} options={FIN_OPTS} onChange={(v) => onChange({ finance: v })} />
        {fin.hintText ? <div className={`mini-status ${fin.hintClass}`}>{fin.hintText}</div> : null}
      </td>
      <td>
        <Sel value={r.priority} options={PRI_OPTS} onChange={(v) => onChange({ priority: v })} />
      </td>
      <td>
        <Sel value={r.status} options={STATUS_OPTS} onChange={(v) => onChange({ status: v })} />
      </td>
      <td>
        <button type="button" className="del-btn" onClick={onDelete} aria-label="Delete row">
          {Ic.trash}
        </button>
      </td>
    </tr>
  );
}
