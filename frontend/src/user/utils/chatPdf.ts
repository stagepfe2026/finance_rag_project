import jsPDF from "jspdf";
import cimfLogo from "../../assets/cimf-logo.png";

import type { ChatMessage, Conversation } from "../../models/chat";

function sanitizeFileName(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/[\\/:*?"<>|]+/g, "-") : "conversation";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeStyle: "short",
  }).format(date);
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const CIMF_RED:   [number, number, number] = [184, 47, 41];
const DARK:       [number, number, number] = [22,  22,  22];
const MUTED:      [number, number, number] = [115, 115, 115];
const LIGHT_GRAY: [number, number, number] = [230, 230, 230];
const WHITE:      [number, number, number] = [255, 255, 255];
const USER_BG:    [number, number, number] = [252, 248, 248];
const ASST_BG:    [number, number, number] = [248, 248, 249];

// ─── Header (48 pt tall) ──────────────────────────────────────────────────────
function addPageHeader(
  doc: jsPDF,
  conversation: Conversation,
  pageWidth: number,
  margin: number,
  isFirstPage: boolean,
) {
  const headerH = 48;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, pageWidth, headerH, "F");

  // Logo
  const logoW = 110;
  const logoH = 24;
  try {
    doc.addImage(cimfLogo, "PNG", margin, (headerH - logoH) / 2, logoW, logoH);
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...CIMF_RED);
    doc.text("CIMF", margin, headerH / 2 + 4);
  }

  if (isFirstPage) {
    // Conversation title aligned right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const maxTitleW = pageWidth - margin - (logoW + margin + 12);
    const titleLines = doc.splitTextToSize(conversation.summary, maxTitleW);
    const titleX = pageWidth - margin;
    const titleY = titleLines.length === 1 ? headerH / 2 + 3 : headerH / 2 - 1;
    doc.text(titleLines.slice(0, 2), titleX, titleY, { align: "right", lineHeightFactor: 1.4 });
  }

  // Red bottom border
  doc.setDrawColor(...CIMF_RED);
  doc.setLineWidth(1);
  doc.line(0, headerH, pageWidth, headerH);
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function addPageFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  pageNumber: number,
  totalDate: string,
) {
  const footerY = pageHeight - 20;

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Exporté le ${totalDate}`, margin, footerY);
  doc.text(`Page ${pageNumber}`, pageWidth - margin, footerY, { align: "right" });
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function exportConversationToPdf(
  conversation: Conversation | null,
  messages: ChatMessage[],
) {
  if (!conversation || messages.length === 0) {
    throw new Error("Aucune conversation à exporter.");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin     = 40;
  const contentW   = pageWidth - margin * 2;
  const headerH    = 48;
  const footerH    = 30;
  const bottomBound = pageHeight - footerH - 8;

  let pageNumber  = 1;
  let isFirstPage = true;
  let cursorY     = headerH + 18;

  const exportedAt = formatDate(new Date().toISOString());

  const startPage = () => {
    addPageHeader(doc, conversation, pageWidth, margin, isFirstPage);
    if (isFirstPage) {
      // Metadata strip
      cursorY = headerH + 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `${messages.length} message${messages.length > 1 ? "s" : ""}  ·  Créée le ${formatDate(conversation.createdAt)}  ·  Mise à jour le ${formatDate(conversation.updatedAt)}`,
        margin,
        cursorY,
      );
      cursorY += 14;

      doc.setDrawColor(...LIGHT_GRAY);
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 14;

      isFirstPage = false;
    } else {
      cursorY = headerH + 16;
    }
  };

  const newPage = () => {
    addPageFooter(doc, pageWidth, pageHeight, margin, pageNumber, exportedAt);
    doc.addPage();
    pageNumber += 1;
    startPage();
  };

  const ensureSpace = (h: number) => {
    if (cursorY + h > bottomBound) newPage();
  };

  // ── Render first page header ────────────────────────────────────────────────
  startPage();

  // ── Messages ────────────────────────────────────────────────────────────────
  const LINE_H      = 11.5;
  const CARD_PAD_V  = 9;
  const CARD_PAD_H  = 11;
  const LABEL_H     = 12;
  const SEP_H       = 3;
  const GAP_BETWEEN = 6;

  messages.forEach((message, index) => {
    const isUser   = message.role === "user";
    const label    = isUser ? "UTILISATEUR" : "ASSISTANT";
    const bgColor  = isUser ? USER_BG : ASST_BG;
    const barColor = isUser ? CIMF_RED : ([80, 80, 85] as [number, number, number]);

    const safeContent = (message.content ?? "").trim() || "—";
    const textLines   = doc.splitTextToSize(safeContent, contentW - CARD_PAD_H * 2 - 5);

    const cardH = CARD_PAD_V + LABEL_H + SEP_H + textLines.length * LINE_H + CARD_PAD_V;

    ensureSpace(cardH);

    // Card background
    doc.setFillColor(...bgColor);
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, cursorY, contentW, cardH, 3, 3, "FD");

    // Left accent bar
    doc.setFillColor(...barColor);
    doc.roundedRect(margin, cursorY, 3, cardH, 1.5, 1.5, "F");

    const textX = margin + CARD_PAD_H;
    let   lineY = cursorY + CARD_PAD_V;

    // Role label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...barColor);
    doc.text(label, textX, lineY + 8);

    // Timestamp right-aligned
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    const timeStr = `${formatDate(message.createdAt)}  ${formatTime(message.createdAt)}`;
    doc.text(timeStr, margin + contentW - 6, lineY + 8, { align: "right" });

    lineY += LABEL_H + SEP_H;

    // Thin separator
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(textX, lineY, margin + contentW - 6, lineY);

    lineY += 7;

    // Message body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(textLines, textX, lineY, { lineHeightFactor: 1.45 });

    cursorY += cardH + (index < messages.length - 1 ? GAP_BETWEEN : 0);
  });

  addPageFooter(doc, pageWidth, pageHeight, margin, pageNumber, exportedAt);

  doc.save(`${sanitizeFileName(conversation.summary)}.pdf`);
}