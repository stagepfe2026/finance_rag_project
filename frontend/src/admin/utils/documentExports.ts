import {
  documentCategoryLabels,
  documentStatusLabels,
  type DocumentCategoryValue,
  type DocumentItem,
  type DocumentStatusValue,
} from "../../models/document";

type ExportFilters = {
  search: string;
  category: "all" | DocumentCategoryValue;
  status: "all" | DocumentStatusValue;
};

type ExportRow = {
  title: string;
  description: string;
  category: string;
  status: string;
  date: string;
  fileType: string;
  fileSize: string;
};

const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_MARGIN = 36;
const PDF_TABLE_BOTTOM = 58;
const PDF_ROW_PADDING = 10;
const PDF_ROW_LINE_HEIGHT = 12;
const PDF_TABLE_HEADER_HEIGHT = 24;
const PDF_TABLE_START_Y = 612;
const PDF_COLUMNS = [
  { label: "Document", width: 238 },
  { label: "Categorie", width: 88 },
  { label: "Statut", width: 72 },
  { label: "Date", width: 82 },
  { label: "Type", width: 43 },
] as const;

function sanitizeAscii(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizeAscii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatDocumentDate(document: DocumentItem) {
  const rawDate = document.realizedAt || document.indexedAt || document.createdAt;
  if (!rawDate) {
    return "-";
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
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

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeFileType(fileType: string) {
  const value = sanitizeAscii(fileType).toLowerCase();

  if (value.includes("pdf")) {
    return "PDF";
  }

  if (value.includes("word") || value.includes("docx") || value.includes("doc")) {
    return "DOCX";
  }

  if (value.includes("excel") || value.includes("sheet") || value.includes("xlsx") || value.includes("xls")) {
    return "XLS";
  }

  if (!value || value === "-") {
    return "-";
  }

  return value.slice(0, 10).toUpperCase();
}

function formatFilterValue(filters: ExportFilters, key: "search" | "category" | "status") {
  if (key === "search") {
    return filters.search.trim() || "Aucune recherche";
  }

  if (key === "category") {
    return filters.category === "all" ? "Toutes categories" : documentCategoryLabels[filters.category];
  }

  return filters.status === "all" ? "Tous statuts" : documentStatusLabels[filters.status];
}

function buildRows(documents: DocumentItem[]): ExportRow[] {
  return documents.map((document) => ({
    title: document.title || "-",
    description: document.description || "-",
    category: documentCategoryLabels[document.category],
    status: documentStatusLabels[document.documentStatus],
    date: formatDocumentDate(document),
    fileType: normalizeFileType(document.fileType || "-"),
    fileSize: formatFileSize(document.fileSize),
  }));
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function makeFilename(extension: "pdf" | "xls") {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `documents-export-${sanitizeFilenamePart(stamp)}.${extension}`;
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(value: string, maxChars: number) {
  const input = sanitizeAscii(value) || "-";
  const words = input.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (word.length <= maxChars) {
      currentLine = word;
      return;
    }

    let remaining = word;
    while (remaining.length > maxChars) {
      lines.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars);
    }
    currentLine = remaining;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ["-"];
}

function clampLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) {
    return lines;
  }

  const trimmed = lines.slice(0, maxLines);
  const lastLine = trimmed[maxLines - 1];
  trimmed[maxLines - 1] = `${lastLine.slice(0, Math.max(0, lastLine.length - 3))}...`;
  return trimmed;
}

function buildPdfContent(documents: DocumentItem[], filters: ExportFilters) {
  const rows = buildRows(documents);
  const generatedAt = formatDateTime(new Date().toISOString());
  const pages: string[] = [];

  let commands: string[] = [];
  let cursorY = PDF_TABLE_START_Y;

  const drawText = (
    text: string,
    x: number,
    y: number,
    font: "F1" | "F2",
    size: number,
    color: [number, number, number],
  ) => {
    commands.push(
      `BT /${font} ${size} Tf ${color[0]} ${color[1]} ${color[2]} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`,
    );
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, width = 1, color = "0.90 0.88 0.87") => {
    commands.push(`${color} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  const drawFilledRect = (x: number, y: number, width: number, height: number, color: string) => {
    commands.push(`${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  };

  const drawInfoCard = (x: number, y: number, width: number, title: string, value: string) => {
    drawFilledRect(x, y - 30, width, 34, "0.985 0.976 0.972");
    drawText(title, x + 10, y - 10, "F1", 8, [0.50, 0.46, 0.45]);
    drawText(value, x + 10, y - 23, "F2", 10, [0.10, 0.10, 0.10]);
  };

  const drawPageHeader = (pageIndex: number) => {
    commands = [];
    cursorY = PDF_TABLE_START_Y;

    drawFilledRect(PDF_MARGIN, 790, PDF_PAGE_WIDTH - PDF_MARGIN * 2, 5, "0.81 0.13 0.15");
    drawText("Export des documents indexes", PDF_MARGIN, 752, "F2", 22, [0.07, 0.07, 0.07]);
    drawText("Rapport professionnel de la liste des documents", PDF_MARGIN, 732, "F1", 11, [0.43, 0.40, 0.39]);
    drawText(`Page ${pageIndex + 1}`, PDF_PAGE_WIDTH - 88, 752, "F1", 10, [0.43, 0.40, 0.39]);
    drawText(`Genere le ${generatedAt}`, PDF_MARGIN, 714, "F1", 9, [0.52, 0.49, 0.48]);

    drawInfoCard(PDF_MARGIN, 682, 110, "Documents", String(documents.length));
    drawInfoCard(PDF_MARGIN + 120, 682, 180, "Categorie", formatFilterValue(filters, "category"));
    drawInfoCard(PDF_MARGIN + 310, 682, 120, "Statut", formatFilterValue(filters, "status"));

    drawFilledRect(PDF_MARGIN, 620, PDF_PAGE_WIDTH - PDF_MARGIN * 2, 42, "0.995 0.994 0.993");
    drawText("Recherche", PDF_MARGIN + 12, 648, "F1", 8, [0.50, 0.46, 0.45]);
    clampLines(wrapText(formatFilterValue(filters, "search"), 72), 2).forEach((line, index) => {
      drawText(line, PDF_MARGIN + 12, 635 - index * 11, "F1", 9, [0.15, 0.15, 0.15]);
    });

    let currentX = PDF_MARGIN;
    drawFilledRect(
      PDF_MARGIN,
      cursorY - PDF_TABLE_HEADER_HEIGHT + 4,
      PDF_PAGE_WIDTH - PDF_MARGIN * 2,
      PDF_TABLE_HEADER_HEIGHT,
      "0.96 0.94 0.93",
    );
    PDF_COLUMNS.forEach((column) => {
      drawText(column.label, currentX + 8, cursorY - 11, "F2", 9, [0.44, 0.40, 0.39]);
      currentX += column.width;
    });
    drawLine(
      PDF_MARGIN,
      cursorY - PDF_TABLE_HEADER_HEIGHT,
      PDF_PAGE_WIDTH - PDF_MARGIN,
      cursorY - PDF_TABLE_HEADER_HEIGHT,
      1,
      "0.88 0.86 0.85",
    );
    cursorY -= PDF_TABLE_HEADER_HEIGHT;
  };

  const pushPage = () => {
    drawText("Rapport genere automatiquement depuis la liste des documents.", PDF_MARGIN, 30, "F1", 8, [0.58, 0.55, 0.54]);
    pages.push(commands.join("\n"));
  };

  drawPageHeader(0);

  rows.forEach((row, index) => {
    const titleLines = clampLines(wrapText(row.title, 34), 2);
    const descriptionLines = row.description !== "-" ? clampLines(wrapText(row.description, 40), 2) : [];
    const rowLineCount = titleLines.length + descriptionLines.length;
    const rowHeight = Math.max(
      38,
      PDF_ROW_PADDING * 2 + rowLineCount * PDF_ROW_LINE_HEIGHT + (descriptionLines.length ? 2 : 0),
    );

    if (cursorY - rowHeight < PDF_TABLE_BOTTOM) {
      pushPage();
      drawPageHeader(pages.length);
    }

    if (index % 2 === 0) {
      drawFilledRect(PDF_MARGIN, cursorY - rowHeight + 1, PDF_PAGE_WIDTH - PDF_MARGIN * 2, rowHeight - 1, "0.995 0.992 0.991");
    }

    const titleX = PDF_MARGIN + 8;
    let currentY = cursorY - 15;

    titleLines.forEach((line) => {
      drawText(line, titleX, currentY, "F2", 9, [0.07, 0.07, 0.07]);
      currentY -= PDF_ROW_LINE_HEIGHT;
    });

    descriptionLines.forEach((line) => {
      drawText(line, titleX, currentY, "F1", 8, [0.47, 0.43, 0.42]);
      currentY -= PDF_ROW_LINE_HEIGHT;
    });

    const midY = cursorY - 19;
    let textX = PDF_MARGIN + PDF_COLUMNS[0].width + 8;
    drawText(row.category, textX, midY, "F1", 9, [0.18, 0.18, 0.18]);
    textX += PDF_COLUMNS[1].width;
    drawText(row.status, textX, midY, "F1", 9, [0.18, 0.18, 0.18]);
    textX += PDF_COLUMNS[2].width;
    drawText(row.date, textX, midY, "F1", 9, [0.18, 0.18, 0.18]);
    textX += PDF_COLUMNS[3].width;
    drawText(row.fileType, textX, midY, "F1", 9, [0.18, 0.18, 0.18]);

    drawLine(PDF_MARGIN, cursorY - rowHeight, PDF_PAGE_WIDTH - PDF_MARGIN, cursorY - rowHeight, 1, "0.93 0.91 0.90");
    cursorY -= rowHeight;
  });

  if (rows.length === 0) {
    drawFilledRect(PDF_MARGIN, cursorY - 30, PDF_PAGE_WIDTH - PDF_MARGIN * 2, 34, "0.995 0.992 0.991");
    drawText("Aucun document a exporter pour les filtres selectionnes.", PDF_MARGIN + 12, cursorY - 10, "F1", 10, [0.47, 0.43, 0.42]);
  }

  pushPage();
  return pages;
}

function createPdfBlob(pages: string[]) {
  const encoder = new TextEncoder();
  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const fontRegularId = 3 + pages.length * 2;
  const fontBoldId = fontRegularId + 1;

  pages.forEach((content, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);

    objects[pageObjectId - 1] =
      `${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentObjectId} 0 R >>\nendobj\n`;

    const streamBytes = encoder.encode(content);
    objects[contentObjectId - 1] =
      `${contentObjectId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${content}\nendstream\nendobj\n`;
  });

  objects[0] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects[1] = `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>\nendobj\n`;
  objects[fontRegularId - 1] = `${fontRegularId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  objects[fontBoldId - 1] = `${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += object;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function exportDocumentsToPdf(documents: DocumentItem[], filters: ExportFilters) {
  const pages = buildPdfContent(documents, filters);
  const blob = createPdfBlob(pages);
  downloadBlob(blob, makeFilename("pdf"));
}

export function exportDocumentsToExcel(documents: DocumentItem[], filters: ExportFilters) {
  const rows = buildRows(documents);
  const generatedAt = formatDateTime(new Date().toISOString());

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111111"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#111111"/>
  </Style>
  <Style ss:ID="Muted">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#7A7472"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#CF2027" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Cell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EDE7E5"/>
   </Borders>
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Documents">
  <Table>
   <Column ss:Width="220"/>
   <Column ss:Width="180"/>
   <Column ss:Width="130"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Row>
    <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">Export des documents indexes</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="6" ss:StyleID="Muted"><Data ss:Type="String">Genere le ${escapeXml(generatedAt)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Recherche</Data></Cell>
    <Cell ss:MergeAcross="2"><Data ss:Type="String">${escapeXml(formatFilterValue(filters, "search"))}</Data></Cell>
    <Cell><Data ss:Type="String">Categorie</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatFilterValue(filters, "category"))}</Data></Cell>
    <Cell><Data ss:Type="String">Statut</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatFilterValue(filters, "status"))}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Document</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Description</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Categorie</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Statut</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Type</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Taille</Data></Cell>
   </Row>
${rows
  .map(
    (row) => `   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.title)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.description)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.category)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.status)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.date)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.fileType)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.fileSize)}</Data></Cell>
   </Row>`,
  )
  .join("\n")}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  downloadBlob(blob, makeFilename("xls"));
}
