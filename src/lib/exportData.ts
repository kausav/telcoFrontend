import type { ScenarioGenerateResponse } from '../api/types';

export type ExportFormat = 'csv' | 'json';

type Row = Record<string, unknown>;
type GenerateResult = Pick<ScenarioGenerateResponse, 'typeOfData' | 'records' | 'fields' | 'scenario_label' | 'requested_scenario_id' | 'scenario_id'>;

export const EXPORT_MIME: Record<ExportFormat, string> = {
  csv: 'text/csv;charset=utf-8;',
  json: 'application/json',
};

/**
 * The keys in the order of `fields`, the column order the backend delivers (the data's story: customer before account, a start before its
 * end, then each event). A key `fields` does not list follows, in the order it was met.
 */
export function inFieldOrder(keys: string[], fields: readonly string[] | null | undefined): string[] {
  const rank = new Map((fields ?? []).map((name, index) => [name, index] as const));
  const unlisted = Number.MAX_SAFE_INTEGER;
  return keys
    .map((key, index) => ({ key, index }))
    .sort((a, b) => (rank.get(a.key) ?? unlisted) - (rank.get(b.key) ?? unlisted) || a.index - b.index)
    .map(({ key }) => key);
}

/**
 * One flat row per record.
 * A transactional result is one object per user with that user's history under `records`; each history record becomes a row
 * that carries the user's own fields. An aggregational result is already one row per record.
 */
export function flattenRecords(result: Pick<GenerateResult, 'typeOfData' | 'records'>): Row[] {
  const records: unknown[] = Array.isArray(result.records) ? result.records : [];
  const rows: Row[] = [];
  const isObject = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);

  if (result.typeOfData === 'transactional') {
    records.forEach(entityValue => {
      if (!isObject(entityValue)) return;
      const history: unknown[] = Array.isArray(entityValue.records) ? entityValue.records : [];
      const entityFields: Row = {};
      Object.entries(entityValue).forEach(([key, value]) => {
        if (key !== 'records') entityFields[key] = value;
      });
      history.forEach(recordValue => {
        if (isObject(recordValue)) rows.push({ ...entityFields, ...recordValue });
      });
    });
  } else {
    records.forEach(recordValue => {
      if (isObject(recordValue)) rows.push(recordValue);
    });
  }
  return rows;
}

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  let stringValue: string;
  if (typeof value === 'object') {
    try {
      stringValue = JSON.stringify(value);
    } catch {
      stringValue = String(value);
    }
  } else {
    stringValue = String(value);
  }
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `="${stringValue}"`;
};

/** The generated records as a file's text, in the chosen format. Returns an empty string when there is nothing to export. */
export function buildExport(format: ExportFormat, result: GenerateResult): string {
  if (format === 'json') return JSON.stringify(result.records, null, 2);

  const rows = flattenRecords(result);
  if (rows.length === 0) return '';
  // A user's own fields come first in each flat row, but the file follows the delivered column order so a CSV reads as the story.
  const columns: string[] = inFieldOrder(Array.from(new Set(rows.flatMap(row => Object.keys(row)))), result.fields);
  if (columns.length === 0) return '';

  return [columns.map(escapeCsvValue).join(','), ...rows.map(row => columns.map(column => escapeCsvValue(row[column])).join(','))].join('\r\n');
}

/** The scenario's name for file names and headings. */
export function exportLabel(result: Pick<GenerateResult, 'scenario_label' | 'requested_scenario_id' | 'scenario_id'>): string {
  return String(result.scenario_label || result.requested_scenario_id || result.scenario_id || 'generated_records');
}

export const exportFileName = (format: ExportFormat, result: GenerateResult): string => `${exportLabel(result)}_records.${format}`;

/** Hand the text to the browser as a file download. */
export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
