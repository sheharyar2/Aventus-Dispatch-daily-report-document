// Shared data model + derivation logic used by BOTH the on-screen dashboard
// and the PDF document, so the two always stay in sync.

export const defaultRow = {
  site: "Bernal Dwellings",
  reviewed: "Yes",
  attendance: "On Time",
  attMins: "",
  checkout: "On Time",
  earlyOutMins: "",
  reportQuality: "Good",
  issueType: "None",
  action: "",
  escalated: "No",
  owner: "",
  finance: "No Action",
  priority: "Low",
  status: "Clear",
};

export const blankRow = {
  ...defaultRow,
  site: "",
  action: "",
};

export const defaultMeta = {
  reportDate: "July 9, 2026",
  coverage: "2:00 AM - 10:00 AM",
  preparedBy: "Faseeh",
  reviewedBy: "Matt / Elizabeth",
  handoverTo: "Next CSR",
  submittedTime: "10:15 AM PST",
};

export const OVERALL_STATUSES = [
  "Issues Found & Action Taken",
  "All Clear",
  "Operations Follow-Up Required",
  "Finance Review Required",
  "Urgent Escalation",
];

let _id = 0;
export function newRowId() {
  _id += 1;
  return `row-${_id}-${Math.round(Math.abs(Math.sin(_id) * 1e6))}`;
}

export function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max - 1) + "…" : str || "";
}

export function attendanceNote(r) {
  if (r.attendance === "Late Check-In" && r.attMins) return `Late check-in ${r.attMins} min.`;
  if (r.attendance === "Early Check-In" && r.attMins) return `Early check-in ${r.attMins} min.`;
  if (r.attendance === "On Time") return "On time.";
  return r.attendance ? r.attendance + "." : "";
}

// Suggested finance action based on attendance + minutes (matches the 10-min grace rule)
export function financeSuggestion(r) {
  let suggested = "No Action";
  let hintText = "";
  let hintClass = "";
  const mins = parseInt(r.attMins || "0", 10) || 0;
  if (r.attendance === "Late Check-In") {
    if (mins > 10) {
      suggested = "Deduct";
      hintText = `Late by ${mins} min — beyond 10 min grace period.`;
      hintClass = "red";
    } else if (mins > 0) {
      suggested = "No Deduction";
      hintText = `Late by ${mins} min — within 10 min grace period.`;
      hintClass = "amber";
    }
  } else if (r.attendance === "Early Check-In" && mins > 0) {
    hintText = `Checked in ${mins} min early.`;
    hintClass = "green";
  }
  return { suggested, hintText, hintClass };
}

export function computeDashboard(rows) {
  const active = rows.length;
  const reviewed = rows.filter((r) => r.reviewed === "Yes").length;
  const late = rows.filter((r) => r.attendance === "Late Check-In").length;
  const earlyOut = rows.filter((r) => r.checkout === "Early Check-Out").length;
  const incidents = rows.filter((r) => r.issueType !== "None").length;
  const escFinance = rows.filter(
    (r) =>
      r.escalated === "Yes" ||
      r.status === "Escalated" ||
      !["No Action", "No Deduction", ""].includes(r.finance)
  ).length;
  const coveragePct = active ? Math.round((reviewed / active) * 100) : 0;

  const fixed = [];
  const escalated = [];
  const finance = [];
  const resolved = [];
  const open = [];

  rows.forEach((r) => {
    if (!r.site) return;
    const note = attendanceNote(r);
    const earlyOutNote =
      r.checkout === "Early Check-Out" && r.earlyOutMins ? ` Early checkout ${r.earlyOutMins} min.` : "";
    const issueNote = r.issueType !== "None" ? ` ${r.issueType}.` : "";
    const actionText = r.action ? ` ${r.action}` : "";

    if ((r.status === "Resolved" || r.status === "Clear") && r.escalated === "No") {
      fixed.push(`• ${r.site} — ${note}${earlyOutNote}${issueNote}${actionText}`.trim());
      resolved.push(`• ${r.site} — ${r.status}${actionText ? ": " + truncate(r.action, 60) : ""}`);
    }
    if (r.escalated === "Yes" || r.status === "Escalated") {
      escalated.push(
        `• ${r.site} — ${r.issueType !== "None" ? r.issueType : "Issue"}${r.owner ? " → " + r.owner : ""}${
          r.action ? " | " + r.action : ""
        }`
      );
    }
    if (!["No Action", "No Deduction", ""].includes(r.finance)) {
      finance.push(
        `• ${r.site} — ${r.finance}${note ? " | " + note : ""}${earlyOutNote ? " | " + earlyOutNote.trim() : ""}`
      );
    }
    if (["Watch", "Action", "Escalated"].includes(r.status) || r.escalated === "Yes") {
      open.push(`• ${r.site} — ${r.status}${r.owner ? " | Owner: " + r.owner : ""}`);
    }
  });

  return {
    kpis: { active, reviewed, late, earlyOut, incidents, escFinance },
    coveragePct,
    summaries: {
      fixed: fixed.length ? fixed.join("\n") : "No resolved items yet.",
      escalated: escalated.length ? escalated.join("\n") : "No escalations yet.",
      finance: finance.length ? finance.join("\n") : "No finance actions yet.",
      resolved: resolved.length ? resolved.join("\n") : "No resolved items yet.",
      open: open.length ? open.join("\n") : "No open follow-ups.",
    },
  };
}

// Shared badge color mapping used by dashboard + PDF
export function badgeTone(kind, value) {
  switch (kind) {
    case "reviewed":
      return value === "Yes" ? "green" : "plain";
    case "attendance":
      if (value === "Early Check-In") return "green";
      if (value === "Late Check-In") return "red";
      return "plain";
    case "checkout":
      return value === "Early Check-Out" ? "amber" : "plain";
    case "quality":
      if (value === "Poor") return "red";
      if (value === "Needs Improvement") return "amber";
      if (value === "Excellent") return "green";
      return "plain";
    case "issue":
      return value === "None" ? "plain" : "slate";
    case "finance":
      if (value === "No Action" || value === "No Deduction") return "plain";
      if (value === "Deduct") return "red";
      if (value === "Bill") return "amber";
      return "slate";
    case "priority":
      if (value === "High") return "red";
      if (value === "Medium") return "amber";
      return "plain";
    case "status": {
      const map = { Clear: "plain", Resolved: "green", Watch: "amber", Action: "amber", Escalated: "red" };
      return map[value] || "plain";
    }
    default:
      return "plain";
  }
}
