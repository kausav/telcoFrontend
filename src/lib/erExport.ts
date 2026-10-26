import type { ErCell, ErTable } from '../api/erTypes';
import { downloadText, EXPORT_MIME } from './exportData';

/** One cell of a CSV. A text that a spreadsheet would run as a formula starts with an apostrophe, as in the backend's own CSV files. */
function csvCell(value: ErCell | undefined): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A table as CSV text in the delivered column order (key, foreign keys, then the declared columns). */
export function erTableToCsv(table: Pick<ErTable, 'fields' | 'records'>): string {
  const lines = [table.fields.join(','), ...table.records.map(record => table.fields.map(field => csvCell(record[field])).join(','))];
  return `${lines.join('\r\n')}\r\n`;
}

export const downloadErTableCsv = (name: string, table: Pick<ErTable, 'fields' | 'records'>): void =>
  downloadText(`${name}.csv`, erTableToCsv(table), EXPORT_MIME.csv);

/** Hand a binary file (the zip) to the browser as a download. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
