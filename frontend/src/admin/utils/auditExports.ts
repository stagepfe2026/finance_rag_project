import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import type { AuditActivity } from "../../models/audit";

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function formatDateTime(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function mapRows(activities: AuditActivity[]) {
  return activities.map((activity) => ({
    date: formatDateTime(activity.occurredAt),
    utilisateur: activity.userName || activity.userEmail || "-",
    email: activity.userEmail || "-",
    action: activity.actionLabel,
    categorie: activity.category,
    element: activity.entityLabel,
    resume: activity.summary,
  }));
}

function makeFilename(prefix: string, extension: "json" | "xlsx" | "pdf") {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${sanitizeFilenamePart(prefix)}-${sanitizeFilenamePart(stamp)}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportAuditToJson(activities: AuditActivity[], prefix: string) {
  const blob = new Blob([JSON.stringify(activities, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, makeFilename(prefix, "json"));
}

export function exportAuditToExcel(activities: AuditActivity[], prefix: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(mapRows(activities));
  XLSX.utils.book_append_sheet(workbook, worksheet, "Audit");
  XLSX.writeFile(workbook, makeFilename(prefix, "xlsx"));
}

export function exportAuditToPdf(activities: AuditActivity[], prefix: string) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  pdf.setFillColor(207, 32, 39);
  pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 60, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Journal d activite", 40, 38);

  pdf.setTextColor(80, 74, 72);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Genere le ${formatDateTime(new Date().toISOString())}`, 40, 82);

  autoTable(pdf, {
    startY: 96,
    head: [["Date", "Utilisateur", "Action", "Categorie", "Element", "Resume"]],
    body: activities.map((activity) => [
      formatDateTime(activity.occurredAt),
      activity.userName || activity.userEmail || "-",
      activity.actionLabel,
      activity.category,
      activity.entityLabel,
      activity.summary,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [207, 32, 39],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [61, 55, 53],
      lineColor: [236, 228, 225],
      lineWidth: 0.6,
    },
    alternateRowStyles: {
      fillColor: [251, 248, 247],
    },
    styles: {
      fontSize: 9,
      cellPadding: 8,
      valign: "middle",
    },
  });

  pdf.save(makeFilename(prefix, "pdf"));
}
