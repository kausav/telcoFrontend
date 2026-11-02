import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Download, FileText, Upload, X } from 'lucide-react';
import { checkCsvFile, CSV_COLUMNS, CSV_TEMPLATE, CSV_TEMPLATE_FILE_NAME, formatBytes, SAMPLE_ROWS } from '../lib/csvImport';
import { downloadText } from '../lib/exportData';

interface Props {
  file: File | null;
  disabled?: boolean;
  onFile: (file: File | null) => void;
  /** Tells the user why a file was refused (too big, not a .csv, empty). */
  onRefused: (message: string) => void;
}

/** Choose (or drop) the CSV that defines the scenario's variables, with a sample file to start from. */
export default function CsvImportPanel({ file, disabled = false, onFile, onRefused }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const take = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = checkCsvFile(candidate);
    if (problem) {
      onRefused(problem);
      return;
    }
    onFile(candidate);
  };

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        data-testid="csv-input"
        onChange={event => {
          take(event.target.files?.[0]);
          event.target.value = ''; // choosing the same file again must still count
        }}
      />

      {file ? (
        <div className="flex items-center gap-2.5 p-2.5 rounded-xs border border-[#247153]/40 bg-[#247153]/5">
          <FileText className="w-4 h-4 text-[#247153] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#0B0B0C] truncate" title={file.name}>{file.name}</p>
            <p className="text-[10px] text-[#626263]">{formatBytes(file.size)} · ready to import</p>
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={disabled}
            className="text-[10px] font-medium text-[#626263] hover:text-[#E31837] underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onFile(null)}
            disabled={disabled}
            aria-label="Remove the chosen file"
            title="Remove the chosen file"
            className="p-1 rounded-xs hover:bg-white text-[#626263] hover:text-[#9C1936] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            take(event.dataTransfer.files?.[0]);
          }}
          className={`w-full flex flex-col items-center gap-1 px-3 py-4 rounded-xs border border-dashed text-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-techm ${
            dragging ? 'border-[#E31837] bg-[#F8F7F4]' : 'border-[#BDBDB9] bg-[#F1F0EC]/50 hover:border-[#E31837] hover:bg-[#F8F7F4]'
          }`}
        >
          <Upload className="w-4 h-4 text-[#E31837]" />
          <span className="text-xs font-semibold text-[#0B0B0C]">Choose a CSV file, or drop it here</span>
          <span className="text-[10px] text-[#626263]">One variable per row · up to 10 MB</span>
        </button>
      )}

      {/* The sample: download it, or read it here first */}
      <div className="rounded-xs border border-[#D3D2CE] bg-white">
        <div className="flex items-center justify-between gap-2 p-2">
          <button
            type="button"
            onClick={() => setShowExample(open => !open)}
            aria-expanded={showExample}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B0B0C] hover:text-[#E31837] cursor-pointer"
          >
            {showExample ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            What does the file look like?
          </button>
          <button
            type="button"
            onClick={() => downloadText(CSV_TEMPLATE_FILE_NAME, CSV_TEMPLATE, 'text/csv;charset=utf-8')}
            title={`Download ${CSV_TEMPLATE_FILE_NAME}: ${SAMPLE_ROWS.length} example variables to start from`}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border border-[#E31837] text-[11px] font-semibold text-[#E31837] hover:bg-[#E31837] hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download sample CSV
          </button>
        </div>

        {showExample && (
          <div className="border-t border-[#D3D2CE] p-2 space-y-2" data-testid="csv-example">
            <p className="text-[10px] text-[#626263] leading-snug">
              One variable per row, with these columns. Only <span className="font-semibold text-[#0B0B0C]">name</span>,{' '}
              <span className="font-semibold text-[#0B0B0C]">dtype</span> and <span className="font-semibold text-[#0B0B0C]">gen</span> are required.
            </p>
            <div className="overflow-x-auto rounded-xs border border-[#D3D2CE]">
              <table className="w-full text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="bg-[#F1F0EC] text-left text-[#626263]">
                    {['name', 'dtype', 'gen', 'params', 'description', 'nullable'].map(column => (
                      <th key={column} className="px-1.5 py-1 font-semibold whitespace-nowrap">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map(row => (
                    <tr key={row.name} className="border-t border-[#D3D2CE] text-[#0B0B0C]">
                      <td className="px-1.5 py-1 whitespace-nowrap font-semibold">{row.name}</td>
                      <td className="px-1.5 py-1 whitespace-nowrap">{row.dtype}</td>
                      <td className="px-1.5 py-1 whitespace-nowrap">{row.gen}</td>
                      <td className="px-1.5 py-1 whitespace-nowrap">{row.params}</td>
                      <td className="px-1.5 py-1 whitespace-nowrap font-sans">{row.description}</td>
                      <td className="px-1.5 py-1 whitespace-nowrap">{row.nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] leading-snug">
              {CSV_COLUMNS.map(column => (
                <React.Fragment key={column.name}>
                  <dt className="font-mono font-medium text-[#0B0B0C]">
                    {column.name}
                    {column.required && <span className="text-[#E31837]"> *</span>}
                  </dt>
                  <dd className="text-[#626263]">{column.help}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
