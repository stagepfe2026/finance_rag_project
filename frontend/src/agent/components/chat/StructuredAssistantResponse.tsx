import type { ReactNode } from "react";

import ComparisonTable, { type ComparisonTableRow } from "./ComparisonTable";
import StatsChart, { type StatsChartKind, type StatsChartPoint } from "./StatsChart";

type StructuredAssistantResponseProps = {
  content: string;
  searchQuery?: string;
  highlightText: (content: string, query: string) => ReactNode;
};

type MarkdownTable = {
  columns: string[];
  rows: ComparisonTableRow[];
};

type ContentSegment =
  | { type: "text"; value: string }
  | { type: "table"; value: MarkdownTable };

type NumericSeries = {
  title: string;
  points: StatsChartPoint[];
  kind: StatsChartKind;
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
  const rows: ComparisonTableRow[] = [];
  let index = startIndex + 2;

  while (index < lines.length && lines[index].includes("|") && !isSeparatorRow(lines[index])) {
    const cells = splitMarkdownRow(lines[index]);
    if (cells.length >= 2) {
      const row: ComparisonTableRow = {};
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
    .replace(/%$/, "")
    .replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function chooseChartKind(labelColumn: string, valueColumn: string, points: StatsChartPoint[]): StatsChartKind {
  const normalizedLabel = labelColumn.toLowerCase();
  const normalizedValue = valueColumn.toLowerCase();

  if (/date|annee|année|mois|periode|période|evolution|évolution/.test(normalizedLabel)) {
    return "line";
  }

  if (/part|taux|pourcentage|%|repartition|répartition|distribution/.test(normalizedValue) && points.length <= 6) {
    return "pie";
  }

  return "bar";
}

function getNumericSeries(table: MarkdownTable): NumericSeries | null {
  const numericColumns = table.columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => table.rows.some((row) => parseNumber(row[column]) !== null));

  if (numericColumns.length === 0) {
    return null;
  }

  const labelColumn =
    table.columns.find((column) => !numericColumns.some((numericColumn) => numericColumn.column === column)) ??
    table.columns[0];
  const valueColumn = numericColumns[0].column;
  const points = table.rows
    .map((row, rowIndex) => {
      const value = parseNumber(row[valueColumn]);
      if (value === null) {
        return null;
      }

      return {
        label: String(row[labelColumn] ?? `Element ${rowIndex + 1}`),
        value,
      };
    })
    .filter((point): point is StatsChartPoint => point !== null);

  if (points.length === 0) {
    return null;
  }

  return {
    title: valueColumn,
    points,
    kind: chooseChartKind(labelColumn, valueColumn, points),
  };
}

function buildSummary(series: NumericSeries) {
  const sorted = [...series.points].sort((a, b) => b.value - a.value);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  if (!highest || !lowest || highest.label === lowest.label) {
    return null;
  }

  return `Synthese: ${highest.label} presente la valeur la plus elevee (${highest.value}), tandis que ${lowest.label} presente la valeur la plus faible (${lowest.value}).`;
}

export default function StructuredAssistantResponse({
  content,
  searchQuery = "",
  highlightText,
}: StructuredAssistantResponseProps) {
  const segments = parseContent(content);
  const hasTable = segments.some((segment) => segment.type === "table");

  if (!hasTable) {
    return <p className="whitespace-pre-line">{highlightText(content, searchQuery)}</p>;
  }

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <p key={`structured-text-${index}`} className="whitespace-pre-line">
              {highlightText(segment.value, searchQuery)}
            </p>
          );
        }

        const series = getNumericSeries(segment.value);
        const summary = series ? buildSummary(series) : null;

        return (
          <div key={`structured-table-${index}`} className="space-y-3">
            <ComparisonTable columns={segment.value.columns} rows={segment.value.rows} />
            {series ? <StatsChart data={series.points} title={series.title} kind={series.kind} /> : null}
            {summary ? <p className="rounded-md border border-[#d1d5db] bg-[#f3f4f6] px-3 py-2 text-[#111111]">{summary}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
