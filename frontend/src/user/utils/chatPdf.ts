import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
const CHART_COLORS: [number, number, number][] = [CIMF_RED, DARK, MUTED, [170, 170, 170]];

type MarkdownTable = {
  columns: string[];
  rows: Record<string, string>[];
};

type ContentSegment =
  | { type: "text"; value: string }
  | { type: "table"; value: MarkdownTable };

type NumericDataset = {
  labels: string[];
  series: {
    name: string;
    values: number[];
  }[];
};

function cleanMarkdownCell(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

function splitMarkdownRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cleanMarkdownCell);
}

function isSeparatorRow(line: string) {
  const cells = splitMarkdownRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdownTable(lines: string[], startIndex: number) {
  const header = splitMarkdownRow(lines[startIndex]);
  const rows: Record<string, string>[] = [];
  let index = startIndex + 2;

  while (index < lines.length && lines[index].includes("|") && !isSeparatorRow(lines[index])) {
    const cells = splitMarkdownRow(lines[index]);
    if (cells.length >= 2) {
      const row: Record<string, string> = {};
      header.forEach((column, columnIndex) => {
        row[column] = cells[columnIndex] ?? "";
      });
      rows.push(row);
    }
    index += 1;
  }

  return {
    table: { columns: header, rows },
    nextIndex: index,
  };
}

function parseContent(content: string): ContentSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: ContentSegment[] = [];
  const textBuffer: string[] = [];
  let index = 0;

  function flushText() {
    const text = textBuffer.join("\n").trim();
    if (text) {
      segments.push({ type: "text", value: text });
    }
    textBuffer.length = 0;
  }

  while (index < lines.length) {
    const line = lines[index];
    const nextLine = lines[index + 1] ?? "";

    if (line.includes("|") && isSeparatorRow(nextLine)) {
      flushText();
      const parsed = parseMarkdownTable(lines, index);
      if (parsed.table.columns.length > 0 && parsed.table.rows.length > 0) {
        segments.push({ type: "table", value: parsed.table });
      }
      index = parsed.nextIndex;
      continue;
    }

    textBuffer.push(line);
    index += 1;
  }

  flushText();
  return segments;
}

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (!value) {
    return null;
  }

  const normalized = String(value)
    .replace(/\s/g, "")
    .replace(/dinars?/gi, "")
    .replace(/%$/, "")
    .replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function getNumericDataset(table: MarkdownTable): NumericDataset | null {
  const numericColumns = table.columns.filter((column) =>
    table.rows.some((row) => parseNumber(row[column]) !== null),
  );

  if (numericColumns.length === 0) {
    return null;
  }

  const labelColumn =
    table.columns.find((column) => !numericColumns.includes(column)) ??
    table.columns[0];

  const labels = table.rows.map((row, index) => String(row[labelColumn] || `Element ${index + 1}`));
  const series = numericColumns.map((column) => ({
    name: column,
    values: table.rows.map((row) => parseNumber(row[column]) ?? 0),
  }));

  return { labels, series };
}

function formatChartValue(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value);
}

function truncateLabel(value: string, maxLength = 24) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function buildChartSummary(dataset: NumericDataset) {
  const points = dataset.labels.flatMap((label, index) =>
    dataset.series.map((serie) => ({
      label: dataset.series.length > 1 ? `${label} - ${serie.name}` : label,
      value: serie.values[index] ?? 0,
    })),
  );
  const sorted = points.filter((point) => Number.isFinite(point.value)).sort((a, b) => b.value - a.value);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  if (!highest || !lowest || highest.label === lowest.label) {
    return null;
  }

  return `Synthese: ${highest.label} presente la valeur la plus elevee (${formatChartValue(highest.value)}), tandis que ${lowest.label} presente la valeur la plus faible (${formatChartValue(lowest.value)}).`;
}

function drawBarChart(
  doc: jsPDF,
  dataset: NumericDataset,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const chartPad = 18;
  const plotX = x + 44;
  const plotY = y + 32;
  const plotW = width - 62;
  const plotH = height - 70;
  const allValues = dataset.series.flatMap((serie) => serie.values);
  const maxValue = Math.max(...allValues, 1);
  const groupW = plotW / Math.max(dataset.labels.length, 1);
  const barGap = 3;
  const barW = Math.max(5, (groupW - 12) / Math.max(dataset.series.length, 1) - barGap);

  doc.setFillColor(...WHITE);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.roundedRect(x, y, width, height, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text("Visualisation statistique", x + chartPad, y + 18);

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.5);
  doc.line(plotX, plotY, plotX, plotY + plotH);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(formatChartValue(maxValue), x + chartPad, plotY + 4);
  doc.text("0", x + chartPad + 10, plotY + plotH + 3, { align: "right" });

  dataset.labels.forEach((label, labelIndex) => {
    const groupX = plotX + labelIndex * groupW + 6;
    dataset.series.forEach((serie, serieIndex) => {
      const value = serie.values[labelIndex] ?? 0;
      const barH = Math.max(1, (value / maxValue) * (plotH - 6));
      const color = CHART_COLORS[serieIndex % CHART_COLORS.length];
      const barX = groupX + serieIndex * (barW + barGap);
      const barY = plotY + plotH - barH;

      doc.setFillColor(...color);
      doc.rect(barX, barY, barW, barH, "F");
    });

    doc.setFontSize(5.8);
    doc.setTextColor(...MUTED);
    doc.text(truncateLabel(label, 18), groupX, plotY + plotH + 11, {
      maxWidth: Math.max(groupW - 8, 20),
    });
  });

  let legendX = x + chartPad;
  const legendY = y + height - 16;
  dataset.series.forEach((serie, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    doc.setFillColor(...color);
    doc.circle(legendX, legendY - 2, 3, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(...DARK);
    doc.text(truncateLabel(serie.name, 22), legendX + 8, legendY);
    legendX += Math.min(130, doc.getTextWidth(serie.name) + 24);
  });
}

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
    const bodyW = contentW - CARD_PAD_H * 2 - 5;
    const segments = !isUser ? parseContent(safeContent) : [{ type: "text" as const, value: safeContent }];
    const contentH = segments.reduce((height, segment) => {
      if (segment.type === "text") {
        const textLines = doc.splitTextToSize(segment.value, bodyW);
        return height + textLines.length * LINE_H + 6;
      }

      const dataset = getNumericDataset(segment.value);
      return height + 24 + segment.value.rows.length * 19 + (dataset ? 190 : 0);
    }, 0);

    const cardH = CARD_PAD_V + LABEL_H + SEP_H + contentH + CARD_PAD_V;

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
    segments.forEach((segment) => {
      if (segment.type === "text") {
        const textLines = doc.splitTextToSize(segment.value, bodyW);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(textLines, textX, lineY, { lineHeightFactor: 1.45 });
        lineY += textLines.length * LINE_H + 8;
        return;
      }

      autoTable(doc, {
        startY: lineY,
        head: [segment.value.columns],
        body: segment.value.rows.map((row) =>
          segment.value.columns.map((column) => row[column] ?? ""),
        ),
        margin: { left: textX, right: margin + CARD_PAD_H },
        tableWidth: bodyW,
        pageBreak: "avoid",
        styles: {
          font: "helvetica",
          fontSize: 7.3,
          cellPadding: 4,
          lineColor: LIGHT_GRAY,
          lineWidth: 0.4,
          textColor: DARK,
        },
        headStyles: {
          fillColor: DARK,
          textColor: WHITE,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
      });

      const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
      lineY = (lastTable?.finalY ?? lineY) + 10;

      const dataset = getNumericDataset(segment.value);
      if (dataset) {
        const chartH = 160;
        drawBarChart(doc, dataset, textX, lineY, bodyW, chartH);
        lineY += chartH + 8;

        const summary = buildChartSummary(dataset);
        if (summary) {
          const summaryLines = doc.splitTextToSize(summary, bodyW - 16);
          const summaryH = summaryLines.length * LINE_H + 12;
          doc.setFillColor(243, 244, 246);
          doc.setDrawColor(...LIGHT_GRAY);
          doc.roundedRect(textX, lineY, bodyW, summaryH, 3, 3, "FD");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.8);
          doc.setTextColor(...DARK);
          doc.text(summaryLines, textX + 8, lineY + 12, { lineHeightFactor: 1.4 });
          lineY += summaryH + 8;
        }
      }
    });

    cursorY = Math.max(cursorY + cardH, lineY + CARD_PAD_V) + (index < messages.length - 1 ? GAP_BETWEEN : 0);
  });

  addPageFooter(doc, pageWidth, pageHeight, margin, pageNumber, exportedAt);

  doc.save(`${sanitizeFileName(conversation.summary)}.pdf`);
}
