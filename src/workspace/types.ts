import { type ExportFormat } from '../lib/exportData';

export type DomainType = 'telecom' | 'bfsi' | 'healthcare' | 'manufacturing' | 'trust_safety';
export type PipelineStageId = 1 | 2 | 3 | 4 | 5;
export type WorkbenchTab = 'table' | 'records' | 'graph' | 'ast' | 'stageDetails';
export type DownloadFormat = ExportFormat;
