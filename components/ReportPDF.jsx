import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import { computeDashboard, attendanceNote, badgeTone } from "@/lib/model";

// Register Geist + Geist Mono (the only two fonts) from local TTFs.
Font.register({
  family: "Geist",
  fonts: [
    { src: "/fonts/Geist-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Geist-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Geist-Bold.ttf", fontWeight: 700 },
  ],
});
Font.register({
  family: "Geist Mono",
  fonts: [
    { src: "/fonts/GeistMono-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/GeistMono-SemiBold.ttf", fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]); // don't hyphenate

const C = {
  navy: "#0e1a30",
  ink: "#0d1526",
  soft: "#3d4759",
  muted: "#6a7486",
  line: "#e5e9f1",
  line2: "#eef1f7",
  panel2: "#fafbfe",
  blue: "#2f6bff",
  indigo: "#5a5bd6",
  cyan: "#0891b2",
  green: "#0f9d6a",
  amber: "#c97a09",
  red: "#dc2626",
  rose: "#be123c",
  white: "#ffffff",
};

const TONE = {
  green: { bg: "#eafaf3", color: "#0f9d6a", border: "#bdecd6" },
  red: { bg: "#fdecec", color: "#dc2626", border: "#f6c9c9" },
  amber: { bg: "#fdf5e8", color: "#c97a09", border: "#f2dcb0" },
  slate: { bg: "#eef3ff", color: "#2f6bff", border: "#c3d4ff" },
  rose: { bg: "#fdeef1", color: "#be123c", border: "#f6c9d3" },
  plain: { bg: "#f1f4f9", color: "#6a7486", border: "#e5e9f1" },
};

const KPI_ACCENT = [C.blue, C.green, C.red, C.amber, C.indigo, C.cyan];
const COLS = [11, 6, 8, 8, 9, 11, 17, 9, 8, 6, 7]; // widths in %, sum 100

const s = StyleSheet.create({
  page: {
    fontFamily: "Geist",
    fontSize: 8.5,
    color: C.ink,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: C.white,
  },
  // Header
  header: { backgroundColor: C.navy, borderRadius: 10, padding: 11 },
  hTop: { flexDirection: "row", alignItems: "center" },
  mark: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: C.white,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  markTxt: { color: C.navy, fontSize: 16, fontWeight: 700 },
  eyebrow: { color: "rgba(255,255,255,0.72)", fontSize: 7, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase" },
  h1: { color: C.white, fontSize: 17, fontWeight: 700, marginTop: 2 },
  statusWrap: { marginLeft: "auto", alignItems: "flex-end" },
  statusLbl: { color: "rgba(255,255,255,0.7)", fontSize: 6.8, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" },
  statusPill: {
    marginTop: 4, flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusTxt: { color: C.white, fontSize: 9, fontWeight: 600 },
  metaRow: {
    flexDirection: "row", flexWrap: "wrap", marginTop: 7, paddingTop: 6,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.14)",
  },
  metaItem: { width: "14.28%", paddingRight: 8 },
  metaK: { color: "rgba(255,255,255,0.6)", fontSize: 6.6, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" },
  metaV: { color: C.white, fontSize: 9, fontWeight: 600, marginTop: 2 },
  metaVMono: { fontFamily: "Geist Mono", fontWeight: 500 },
  // KPIs
  kpis: { flexDirection: "row", marginTop: 7 },
  kpi: {
    flexGrow: 1, flexBasis: 0, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3,
    borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10, marginRight: 6, backgroundColor: C.white,
  },
  kpiTitle: { fontSize: 6.6, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted },
  kpiNum: { fontFamily: "Geist Mono", fontSize: 17, fontWeight: 600, color: C.navy, marginTop: 4 },
  // Section title
  secTitle: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 5 },
  secBar: { width: 5, height: 14, borderRadius: 3, backgroundColor: C.blue, marginRight: 8 },
  secTitleTxt: { fontSize: 11, fontWeight: 700, color: C.navy },
  // Table
  table: { borderWidth: 1, borderColor: C.line2, borderRadius: 6 },
  thead: { flexDirection: "row", backgroundColor: C.navy },
  th: { paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.08)" },
  thTxt: { color: C.white, fontSize: 6.6, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line2 },
  rowAlt: { backgroundColor: C.panel2 },
  cell: { paddingVertical: 3.5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: C.line2, justifyContent: "flex-start" },
  cellTxt: { fontSize: 7.5, color: C.soft, lineHeight: 1.25 },
  siteTxt: { fontSize: 7.5, color: C.ink, fontWeight: 600 },
  dim: { color: "#a3adbe" },
  badge: { alignSelf: "flex-start", borderRadius: 5, borderWidth: 1, paddingVertical: 2, paddingHorizontal: 5, maxWidth: "100%" },
  badgeTxt: { fontSize: 7, fontWeight: 600 },
  // Summaries
  sums: { marginTop: 2 },
  sumsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 },
  sumCard: { width: "49%", borderWidth: 1, borderColor: C.line, borderRadius: 9 },
  sumCardR: {},
  sumHd: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel2, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 5, paddingHorizontal: 10 },
  sumTag: { width: 5, height: 13, borderRadius: 3, marginRight: 8 },
  sumHdTxt: { fontSize: 9.5, fontWeight: 700, color: C.navy },
  sumBody: { padding: 8, minHeight: 16 },
  sumTxt: { fontSize: 7.6, color: C.soft, lineHeight: 1.35 },
  sumSub: { fontSize: 6.4, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted, marginBottom: 2 },
  sumSubGap: { marginTop: 5 },
  footer: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 7 },
  footTxt: { fontSize: 7.2, color: C.muted },
});

function Badge({ tone, children }) {
  const t = TONE[tone] || TONE.plain;
  return (
    <View style={[s.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[s.badgeTxt, { color: t.color }]}>{children}</Text>
    </View>
  );
}

function statusDotColor(v) {
  const s = (v || "").toLowerCase();
  if (s.includes("all clear")) return C.green;
  if (s.includes("urgent")) return C.rose;
  if (s.includes("finance") || s.includes("follow-up")) return C.blue;
  return C.amber;
}

function attLabel(r) {
  if (r.attendance === "Early Check-In") return "Early" + (r.attMins ? ` · ${r.attMins}m` : "");
  if (r.attendance === "Late Check-In") return "Late" + (r.attMins ? ` · ${r.attMins}m` : "");
  return "On Time";
}
function coLabel(r) {
  if (r.checkout === "Early Check-Out") return "Early" + (r.earlyOutMins ? ` · ${r.earlyOutMins}m` : "");
  return "On Time";
}

const HEADERS = [
  "Site", "Reviewed", "Attendance", "Check-Out", "Report Quality",
  "Incident / Maint.", "What Happened / Action Taken", "Escalated To / Owner",
  "Finance", "Priority", "Status",
];

// Conservatively estimate the rendered height (in pt) so we can decide whether
// the whole report fits on ONE landscape page. If it fits we render it as a
// single non-breaking block (react-pdf otherwise inserts an early page break
// and wastes half a page). If it doesn't, we let it paginate normally.
const USABLE_H = 595.28 - 12 - 14 - 8; // page height minus padding minus small safety margin
function estimateHeight(rows, d) {
  let h = 150 + 46 + 24 + 15; // header + kpis + table title + thead
  rows.forEach((r) => {
    const aLines = Math.max(1, Math.ceil((r.action || "").length / 32));
    const oLines = Math.max(1, Math.ceil((r.owner || "").length / 18));
    const lines = Math.max(aLines, oLines);
    h += 7 + Math.max(10, lines * 8.6);
  });
  const cardLines = (txt) =>
    String(txt || "").split("\n").reduce((a, l) => a + Math.max(1, Math.ceil(l.length / 96)), 0);
  const hd = 17, pad = 12, lh = 9.2;
  const c1 = hd + pad + cardLines(d.summaries.fixed) * lh;
  const c2 = hd + pad + cardLines(d.summaries.escalated) * lh;
  const c3 = hd + pad + cardLines(d.summaries.finance) * lh;
  const c4 = hd + pad + 20 + (cardLines(d.summaries.resolved) + cardLines(d.summaries.open)) * lh;
  h += 24 + Math.max(c1, c2) + 5 + Math.max(c3, c4) + 20; // sum title + rows + footer
  return h;
}

export default function ReportPDF({ data }) {
  const { meta, overallStatus, rows } = data;
  const d = computeDashboard(rows);
  const kpiList = [
    { t: "Active Sites", n: d.kpis.active },
    { t: "Reviewed", n: d.kpis.reviewed },
    { t: "Late Check-Ins", n: d.kpis.late },
    { t: "Early Check-Outs", n: d.kpis.earlyOut },
    { t: "Incidents / Maintenance", n: d.kpis.incidents },
    { t: "Escalations / Finance", n: d.kpis.escFinance },
  ];
  // Fit on a single page when the content is short enough; otherwise paginate
  // (react-pdf otherwise inserts an early break and wastes half a page).
  const compact = estimateHeight(rows, d) <= USABLE_H;
  const metaItems = [
    { k: "Report Date", v: meta.reportDate, mono: true },
    { k: "Coverage Period", v: meta.coverage, mono: true },
    { k: "Prepared By", v: meta.preparedBy },
    { k: "Reviewed By (Ops)", v: meta.reviewedBy },
    { k: "Shift Handover To", v: meta.handoverTo },
    { k: "Submitted Time", v: meta.submittedTime, mono: true },
    { k: "Sites Reviewed", v: `${d.kpis.reviewed} / ${d.kpis.active}`, mono: true },
  ];

  return (
    <Document title="Aventus Dispatch Operations Dashboard" author="Aventus Security">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View wrap={!compact}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.hTop}>
            <View style={s.mark}><Text style={s.markTxt}>A</Text></View>
            <View>
              <Text style={s.eyebrow}>Aventus Security</Text>
              <Text style={s.h1}>Daily Dispatch Operations Dashboard</Text>
            </View>
            <View style={s.statusWrap}>
              <Text style={s.statusLbl}>Overall Daily Status</Text>
              <View style={s.statusPill}>
                <View style={[s.statusDot, { backgroundColor: statusDotColor(overallStatus) }]} />
                <Text style={s.statusTxt}>{overallStatus}</Text>
              </View>
            </View>
          </View>
          <View style={s.metaRow}>
            {metaItems.map((m) => (
              <View key={m.k} style={s.metaItem}>
                <Text style={s.metaK}>{m.k}</Text>
                <Text style={[s.metaV, m.mono && s.metaVMono]}>{m.v || "—"}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpis}>
          {kpiList.map((k, i) => (
            <View key={k.t} style={[s.kpi, { borderLeftColor: KPI_ACCENT[i] }, i === 5 && { marginRight: 0 }]}>
              <Text style={s.kpiTitle}>{k.t}</Text>
              <Text style={s.kpiNum}>{k.n}</Text>
            </View>
          ))}
        </View>

        {/* Table */}
        <View style={s.secTitle}>
          <View style={s.secBar} />
          <Text style={s.secTitleTxt}>Site Review & Issue Action Log</Text>
        </View>
        <View style={s.table}>
          <View style={s.thead} fixed={!compact}>
            {HEADERS.map((h, i) => (
              <View key={h} style={[s.th, { width: `${COLS[i]}%` }, i === HEADERS.length - 1 && { borderRightWidth: 0 }]}>
                <Text style={s.thTxt}>{h}</Text>
              </View>
            ))}
          </View>
          {rows.map((r, ri) => (
            <View key={ri} style={[s.row, ri % 2 === 1 && s.rowAlt]} wrap={false}>
              <View style={[s.cell, { width: `${COLS[0]}%` }]}>
                <Text style={s.siteTxt}>{r.site || <Text style={s.dim}>—</Text>}</Text>
              </View>
              <View style={[s.cell, { width: `${COLS[1]}%` }]}>
                <Badge tone={badgeTone("reviewed", r.reviewed)}>{r.reviewed}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[2]}%` }]}>
                <Badge tone={badgeTone("attendance", r.attendance)}>{attLabel(r)}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[3]}%` }]}>
                <Badge tone={badgeTone("checkout", r.checkout)}>{coLabel(r)}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[4]}%` }]}>
                <Badge tone={badgeTone("quality", r.reportQuality)}>{r.reportQuality}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[5]}%` }]}>
                <Badge tone={badgeTone("issue", r.issueType)}>{r.issueType}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[6]}%` }]}>
                <Text style={s.cellTxt}>{r.action || <Text style={s.dim}>—</Text>}</Text>
              </View>
              <View style={[s.cell, { width: `${COLS[7]}%` }]}>
                <Text style={s.cellTxt}>{r.owner || <Text style={s.dim}>—</Text>}</Text>
              </View>
              <View style={[s.cell, { width: `${COLS[8]}%` }]}>
                <Badge tone={badgeTone("finance", r.finance)}>{r.finance}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[9]}%` }]}>
                <Badge tone={badgeTone("priority", r.priority)}>{r.priority}</Badge>
              </View>
              <View style={[s.cell, { width: `${COLS[10]}%`, borderRightWidth: 0 }]}>
                <Badge tone={badgeTone("status", r.status)}>{r.status}</Badge>
              </View>
            </View>
          ))}
        </View>

        {/* Summaries */}
        <View style={s.secTitle}>
          <View style={s.secBar} />
          <Text style={s.secTitleTxt}>Summary & Handover</Text>
        </View>
        <View style={s.sums}>
          <View style={s.sumsRow} wrap={false}>
            <View style={s.sumCard}>
              <View style={s.sumHd}><View style={[s.sumTag, { backgroundColor: C.green }]} /><Text style={s.sumHdTxt}>Fixed Directly by Dispatch</Text></View>
              <View style={s.sumBody}><Text style={s.sumTxt}>{d.summaries.fixed}</Text></View>
            </View>
            <View style={s.sumCard}>
              <View style={s.sumHd}><View style={[s.sumTag, { backgroundColor: C.rose }]} /><Text style={s.sumHdTxt}>Escalated — & To Whom</Text></View>
              <View style={s.sumBody}><Text style={s.sumTxt}>{d.summaries.escalated}</Text></View>
            </View>
          </View>
          <View style={s.sumsRow} wrap={false}>
            <View style={s.sumCard}>
              <View style={s.sumHd}><View style={[s.sumTag, { backgroundColor: C.amber }]} /><Text style={s.sumHdTxt}>Finance Actions</Text></View>
              <View style={s.sumBody}><Text style={s.sumTxt}>{d.summaries.finance}</Text></View>
            </View>
            <View style={s.sumCard}>
              <View style={s.sumHd}><View style={[s.sumTag, { backgroundColor: C.blue }]} /><Text style={s.sumHdTxt}>End-of-Shift Handover</Text></View>
              <View style={s.sumBody}>
                <Text style={s.sumSub}>Resolved During Shift</Text>
                <Text style={s.sumTxt}>{d.summaries.resolved}</Text>
                <Text style={[s.sumSub, s.sumSubGap]}>Still Open / Next Shift</Text>
                <Text style={s.sumTxt}>{d.summaries.open}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footTxt}>Prepared for Operations & Finance — dashboard layout optimized for quick review.</Text>
          <Text style={s.footTxt}>Confidential · Aventus Dispatch Operations</Text>
        </View>
        </View>
      </Page>
    </Document>
  );
}
