/** Bring-your-own-schema (CSV) constants shared by the Step 1 screen and the upload panel. */

/** The backend refuses a larger file (MAX_CSV_BYTES, 10 MB by default); checking here saves the round trip. */
export const MAX_CSV_BYTES = 10 * 1024 * 1024;
export const CSV_ACCEPT = '.csv,text/csv';

/** Where a CSV can come from. Only a file from this computer is offered for now. */
export const csvSources = [{ id: 'direct', label: 'From this computer' }] as const;

/** The columns the importer reads. `name`, `dtype` and `gen` are required; the rest are optional. */
export const CSV_COLUMNS: { name: string; required: boolean; note: string }[] = [
  { name: 'name', required: true, note: 'Column name in the generated data' },
  { name: 'dtype', required: true, note: 'string, int, float, categorical, datetime, bool ...' },
  { name: 'gen', required: true, note: 'How values are made, e.g. weighted_choice, uniform_int' },
  { name: 'params', required: false, note: 'Settings for the generator, as JSON or key=value pairs' },
  { name: 'depends_on', required: false, note: 'Other columns this one is derived from' },
  { name: 'description', required: false, note: 'What the column means' },
];

export const CSV_TEMPLATE_FILE_NAME = 'schema_template.csv';

/** A small, valid example the person can download, edit and upload again. */
export const CSV_TEMPLATE = [
  'name,dtype,gen,params,depends_on,description',
  'customer_id,string,uuid_string,,,Unique customer identifier (entity key)',
  'account_type,categorical,weighted_choice,"{""choices"":[""SAVINGS"",""CURRENT"",""SALARY""],""weights"":[0.5,0.3,0.2]}",,Kind of account',
  'txn_ts,datetime,recent_datetime,"{""days_back"":90}",,When the transaction happened',
  'txn_amount,float,lognormal,"{""mu"":6.5,""sigma"":1.1,""min"":50,""max"":250000,""precision"":2}",,Transaction amount',
  'txn_count_30d,int,uniform_int,"{""min"":0,""max"":60}",,Transactions in the last 30 days',
  '',
].join('\n');

/** A message when the chosen file cannot be used, or null when it can. */
export function csvFileProblem(file: File): string | null {
  if (!/\.csv$/i.test(file.name)) return 'Only .csv files can be uploaded.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_CSV_BYTES) return `The file is larger than ${Math.round(MAX_CSV_BYTES / 1024 / 1024)} MB.`;
  return null;
}

export const formatBytes = (n: number): string => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
