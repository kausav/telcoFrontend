import React, { useState, useId, useEffect, useRef } from 'react';
import {
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Sliders,
  Shield,
  Activity,
  FileText,
  Table,
  Image as ImageIcon,
  MessageSquare,
  Download,
  RefreshCw,
  Play,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Edit3,
  Filter,
  Terminal,
  Settings,
  Radio,
  PhoneCall,
  Landmark,
  HeartPulse,
  Factory,
  Bell,
  User,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
  Code,
  Zap,
  FileSpreadsheet,
  Network,
  ArrowLeft,
  Cpu,
  Server,
  Lock,
  Unlock,
  FileCheck,
  Upload,
  Cloud,
  FlaskConical,
  Video
} from 'lucide-react';

import { BrandHeader } from './components/BrandHeader';
import { BtnLabel } from './components/BtnLabel';
import { StepIntro } from './components/StepIntro';
import { ContextBar } from './components/ContextBar';
import { LandingPage } from './components/landing/LandingPage';
import { GeneratedRecords } from './components/GeneratedRecords';
import type {
  CatalogCountry,
  CatalogScenario,
  CatalogScenarioDetail,
  ScenarioConfirmResponse,
  ScenarioDraftResponse,
  ScenarioGenerateResponse,
  SchemaVariable
} from './api/types';
import { proposeScenario, importScenarioCsv, confirmScenario, generateScenario } from './api/scenarioApi';
import VariableModal, { type VariableAccess, type VariableSave } from './components/VariableModal';
import { getCountries, getScenarioDetail } from './api/catalogApi';
import { useCatalog } from './hooks/useCatalog';
import { notify, notifyApiError, type ToastKind } from './lib/notify';
import { getDomainVisual } from './lib/domainVisual';
import { setting } from './lib/appConfig';
import { bySequence, toDataField, toDataFields, type DataField } from './lib/schema';
import { csvSources, CSV_TEMPLATE, CSV_TEMPLATE_FILE_NAME } from './lib/csvImport';
import CsvImportPanel from './components/CsvImportPanel';
import { buildExport, downloadText, exportFileName, EXPORT_MIME, type ExportFormat } from './lib/exportData';

// =========================================================================
// DATASETS & CATALOGS FOR DEDICATED SIDEBAR VIEWS
// =========================================================================

interface ContractItem {
  id: string;
  code: string;
  title: string;
  domain: DomainType;
  standard: string;
  version: string;
  fieldCount: number;
  status: 'ACTIVE' | 'FLAGGED' | 'CERTIFIED';
  checksum: string;
  description: string;
  fields: { name: string; type: string; constraints: string; sensitivity: string }[];
  pydanticCode: string;
}

const CONTRACTS_CATALOG: ContractItem[] = [
  {
    id: 'c1',
    code: 'TMF-622-PROD-ORD',
    title: 'TMF 622 Product Ordering Contract',
    domain: 'telecom',
    standard: 'TM Forum SID v22.5 (Open API 4.2.1)',
    version: 'v4.2.1',
    fieldCount: 48,
    status: 'ACTIVE',
    checksum: 'sha256:7f9a12c8b0914d3f',
    description: 'Defines the contractual schema for multi-tenant 5G slice orders, pricing components, billing accounts, and fulfillment milestones.',
    fields: [
      { name: 'order_id', type: 'VARCHAR(36)', constraints: 'UUID v4 format', sensitivity: 'Operational' },
      { name: 'customer_ref', type: 'VARCHAR(24)', constraints: 'NOT NULL; Ref TMF 632', sensitivity: 'PII / Masked' },
      { name: 'order_item_price', type: 'DECIMAL(12,2)', constraints: 'val >= 0.00', sensitivity: 'Financial' },
      { name: 'billing_account_ref', type: 'VARCHAR(32)', constraints: 'Ref TMF 654 Bucket', sensitivity: 'Financial' },
      { name: 'fulfillment_state', type: 'VARCHAR(16)', constraints: 'in [acknowledged, in_progress, completed]', sensitivity: 'Operational' }
    ],
    pydanticCode: `from pydantic import BaseModel, Field, constr
from decimal import Decimal
from typing import Literal

class TMF622ProductOrder(BaseModel):
    order_id: constr(regex=r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
    customer_ref: str = Field(..., max_length=24)
    order_item_price: Decimal = Field(..., ge=0.00)
    billing_account_ref: str
    fulfillment_state: Literal['acknowledged', 'in_progress', 'completed']`
  },
  {
    id: 'c2',
    code: '3GPP-32-298-5G-CDR',
    title: '3GPP TS 32.298 (5G CDR Contract)',
    domain: 'telecom',
    standard: '3GPP Rel-17 Charging Architecture',
    version: 'v17.4.0',
    fieldCount: 64,
    status: 'FLAGGED',
    checksum: 'sha256:3d8e5b41290fa8bc',
    description: 'High-velocity 5G charging data record telemetry specification encompassing slice handoffs, QoS flows, and usage buckets.',
    fields: [
      { name: 'msisdn', type: 'VARCHAR(15)', constraints: 'E.164 (+1[2-9]\\d{9})', sensitivity: 'PII / Masked' },
      { name: 'data_depletion_pct', type: 'FLOAT(4)', constraints: '0.00 <= val <= 100.00', sensitivity: 'Operational' },
      { name: 'cdr_event_raw', type: 'JSONB', constraints: 'gNodeB session FK linked', sensitivity: 'Operational' },
      { name: 'network_slice_id', type: 'VARCHAR(32)', constraints: 'eMBB-01 | URLLC-02 | MIoT-03', sensitivity: 'Operational' },
      { name: 'churn_risk_score', type: 'FLOAT(3)', constraints: '0.000 <= val <= 1.000', sensitivity: 'Synthetic Target' }
    ],
    pydanticCode: `from pydantic import BaseModel, Field, condecimal
from typing import Literal, Dict, Any

class FiveGChargingRecord(BaseModel):
    msisdn: str = Field(..., regex=r'^\\+1[2-9]\\d{9}$')
    data_depletion_pct: float = Field(..., ge=0.0, le=100.0)
    cdr_event_raw: Dict[str, Any]
    network_slice_id: Literal['eMBB-01', 'URLLC-02', 'MIoT-03']
    churn_risk_score: float = Field(..., ge=0.0, le=1.0)`
  },
  {
    id: 'c3',
    code: 'BIAN-PACS-008-WIRE',
    title: 'BIAN & ISO 20022 (pacs.008) Wire Contract',
    domain: 'bfsi',
    standard: 'BIAN v10.0 / ISO 20022 Settlement',
    version: 'v10.0',
    fieldCount: 52,
    status: 'CERTIFIED',
    checksum: 'sha256:91bc74e2a5d901f4',
    description: 'Interbank credit transfer contract with calibrated AML anomaly splits, PEP fuzzy naming, and sanctions screening tags.',
    fields: [
      { name: 'end_to_end_id', type: 'VARCHAR(35)', constraints: 'Alpha-numeric ISO string', sensitivity: 'Operational' },
      { name: 'settlement_amt', type: 'DECIMAL(14,2)', constraints: '0.01 <= val <= 10,000,000.00', sensitivity: 'Financial' },
      { name: 'debtor_iban', type: 'VARCHAR(34)', constraints: 'Valid IBAN checksum mod-97', sensitivity: 'Financial' },
      { name: 'creditor_iban', type: 'VARCHAR(34)', constraints: 'Valid IBAN checksum mod-97', sensitivity: 'Financial' },
      { name: 'sanctions_hit_flag', type: 'BOOLEAN', constraints: 'Bernoulli(p=0.02)', sensitivity: 'Operational' }
    ],
    pydanticCode: `from pydantic import BaseModel, Field
from decimal import Decimal

class ISO20022Pacs008(BaseModel):
    end_to_end_id: str = Field(..., max_length=35)
    settlement_amt: Decimal = Field(..., gt=0.00, le=10000000.00)
    debtor_iban: str = Field(..., min_length=15, max_length=34)
    creditor_iban: str = Field(..., min_length=15, max_length=34)
    sanctions_hit_flag: bool`
  },
  {
    id: 'c4',
    code: 'FHIR-R4-ENCOUNTER',
    title: 'HL7 FHIR v4.3 Clinical Encounter & Vital Telemetry',
    domain: 'healthcare',
    standard: 'HL7 FHIR US-Core v4.3',
    version: 'v4.3.0',
    fieldCount: 78,
    status: 'ACTIVE',
    checksum: 'sha256:56ea89d0231cf412',
    description: 'Longitudinal electronic health record encounter bundles, diagnostic observations, LOINC vital telemetry, and HIPAA Safe Harbor masking.',
    fields: [
      { name: 'patient_pseudo_id', type: 'VARCHAR(32)', constraints: 'HMAC-SHA256 salted', sensitivity: 'PII / Masked' },
      { name: 'encounter_class', type: 'VARCHAR(12)', constraints: 'in [AMB, EMER, IMP, OBSENC]', sensitivity: 'Operational' },
      { name: 'systolic_bp', type: 'INT(2)', constraints: '60 <= val <= 240 mmHg', sensitivity: 'Operational' },
      { name: 'heart_rate', type: 'INT(2)', constraints: '30 <= val <= 220 bpm', sensitivity: 'Operational' },
      { name: 'icu_escalation_flag', type: 'BOOLEAN', constraints: 'Bernoulli hazard target', sensitivity: 'Synthetic Target' }
    ],
    pydanticCode: `from pydantic import BaseModel, Field
from typing import Literal

class FHIRPatientEncounter(BaseModel):
    patient_pseudo_id: str
    encounter_class: Literal['AMB', 'EMER', 'IMP', 'OBSENC']
    systolic_bp: int = Field(..., ge=60, le=240)
    heart_rate: int = Field(..., ge=30, le=220)
    icu_escalation_flag: bool`
  },
  {
    id: 'c5',
    code: 'OPC-UA-PART-4-IOT',
    title: 'OPC UA Part 4 Manufacturing Device Telemetry',
    domain: 'manufacturing',
    standard: 'OPC Foundation UA 1.05 / ISA-95',
    version: 'v1.05',
    fieldCount: 36,
    status: 'ACTIVE',
    checksum: 'sha256:1a84f5093bc712e0',
    description: 'Industrial IoT telemetry specification for CNC high-speed spindles, vibration harmonics, bearing resonance, and thermal runaway alarms.',
    fields: [
      { name: 'node_id', type: 'VARCHAR(32)', constraints: 'ns=2;s=Spindle_CNC_01', sensitivity: 'Operational' },
      { name: 'spindle_rpm', type: 'FLOAT(4)', constraints: '0.0 <= val <= 24000.0', sensitivity: 'Operational' },
      { name: 'vibration_rms', type: 'FLOAT(4)', constraints: '0.0 <= val <= 50.0 mm/s', sensitivity: 'Operational' },
      { name: 'bearing_temp_c', type: 'FLOAT(4)', constraints: '-10.0 <= val <= 130.0 °C', sensitivity: 'Operational' },
      { name: 'fault_mode', type: 'VARCHAR(24)', constraints: 'Categorical [none, fluting, overheat]', sensitivity: 'Synthetic Target' }
    ],
    pydanticCode: `from pydantic import BaseModel, Field
from typing import Literal

class OPCDeviceTelemetry(BaseModel):
    node_id: str
    spindle_rpm: float = Field(..., ge=0.0, le=24000.0)
    vibration_rms: float = Field(..., ge=0.0, le=50.0)
    bearing_temp_c: float = Field(..., ge=-10.0, le=130.0)
    fault_mode: Literal['none', 'fluting', 'overheat']`
  }
];

interface DkpPackageItem {
  id: string;
  name: string;
  domain: DomainType;
  version: string;
  entitiesCount: number;
  triplesCount: number;
  status: 'SYNCED' | 'MOUNTED' | 'AVAILABLE';
  lastSync: string;
  description: string;
  ontologyNodes: { name: string; category: string; relationships: string[] }[];
}

const DKP_PACKAGES: DkpPackageItem[] = [
  {
    id: 'dkp-1',
    name: 'TMForum SID v22.5 Ontology Core',
    domain: 'telecom',
    version: 'v22.5.2',
    entitiesCount: 8420,
    triplesCount: 42900,
    status: 'SYNCED',
    lastSync: '12m ago',
    description: 'Full telecom shared information & data (SID) ontology encompassing Customer, Product, Service, and Resource domains.',
    ontologyNodes: [
      { name: 'CustomerAccount', category: 'Customer', relationships: ['hasProductOrder (1:N)', 'hasBillingBucket (1:N)'] },
      { name: 'ProductOrder', category: 'Product', relationships: ['specifiesService (1:1)', 'generatesInvoice (1:1)'] },
      { name: 'ServiceInstance', category: 'Service', relationships: ['allocatesResource (1:N)', 'bindsToSlice (1:1)'] },
      { name: 'UsageResourceBucket', category: 'Resource', relationships: ['recordsCDR (1:N)', 'tracksDepletion (1:1)'] }
    ]
  },
  {
    id: 'dkp-2',
    name: '3GPP Rel-17 Network Telemetry Graph',
    domain: 'telecom',
    version: 'v17.4',
    entitiesCount: 1840,
    triplesCount: 9200,
    status: 'MOUNTED',
    lastSync: '2h ago',
    description: 'Semantic network functions graph mapping gNodeB, UPF, SMF session states, and 5G network slicing QoS telemetry.',
    ontologyNodes: [
      { name: 'gNodeB_Cell', category: 'RadioAccess', relationships: ['hostsPDU_Session (1:N)', 'reportsSignalRSRP (1:1)'] },
      { name: 'PDU_Session', category: 'CoreNetwork', relationships: ['bindsNSSAI (1:1)', 'generatesCDR (1:N)'] },
      { name: 'NetworkSlice_NSSAI', category: 'Slicing', relationships: ['enforcesSLA (1:1)', 'measuresPacketDelay (1:1)'] }
    ]
  },
  {
    id: 'dkp-3',
    name: 'BIAN Semantic Service Domain Matrix',
    domain: 'bfsi',
    version: 'v10.0',
    entitiesCount: 3200,
    triplesCount: 15100,
    status: 'AVAILABLE',
    lastSync: '1d ago',
    description: 'Banking Industry Architecture Network semantic standard defining 180+ service domains and ISO20022 message invariants.',
    ontologyNodes: [
      { name: 'PaymentExecution', category: 'Operations', relationships: ['initiatesPacs008 (1:1)', 'screensSanctions (1:1)'] },
      { name: 'PartyAuthentication', category: 'Security', relationships: ['validatesKYC (1:1)', 'checksPEP (1:1)'] },
      { name: 'CurrentAccount', category: 'Accounts', relationships: ['holdsLedgerBalance (1:1)', 'postsTransaction (1:N)'] }
    ]
  },
  {
    id: 'dkp-4',
    name: 'HL7 FHIR Resource Ontology v4.3',
    domain: 'healthcare',
    version: 'v4.3.0',
    entitiesCount: 2100,
    triplesCount: 11400,
    status: 'AVAILABLE',
    lastSync: '2d ago',
    description: 'HL7 Fast Healthcare Interoperability Resources ontology defining Patient, Encounter, Observation, and Condition entities.',
    ontologyNodes: [
      { name: 'PatientResource', category: 'Demographics', relationships: ['hasEncounter (1:N)', 'hasCondition (1:N)'] },
      { name: 'ClinicalObservation', category: 'Diagnostics', relationships: ['measuresVitalLOINC (1:1)', 'timestampsReading (1:1)'] },
      { name: 'EncounterTriage', category: 'CarePlan', relationships: ['escalatesToICU (1:1)', 'billsClaim (1:1)'] }
    ]
  }
];

interface AstRuleItem {
  id: string;
  name: string;
  field: string;
  ruleType: 'RANGE' | 'REGEX' | 'FOREIGN_KEY' | 'PROBABILITY' | 'CATEGORICAL';
  expression: string;
  status: 'PASS' | 'FLAGGED';
  enabled: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
}

const INITIAL_AST_RULES: AstRuleItem[] = [
  {
    id: 'r1',
    name: 'non_negative_balance',
    field: 'account_balance',
    ruleType: 'RANGE',
    expression: "pa.Check(lambda s: s >= 0.00, name='non_negative_balance')",
    status: 'PASS',
    enabled: true,
    severity: 'CRITICAL',
    message: 'Guarantees account balances remain non-negative for prepaid subscriber base.'
  },
  {
    id: 'r2',
    name: 'e164_format',
    field: 'msisdn',
    ruleType: 'REGEX',
    expression: "pa.Check.str_matches(r'^\\+1[2-9]\\d{9}$')",
    status: 'PASS',
    enabled: true,
    severity: 'CRITICAL',
    message: 'Enforces international ITU-T E.164 MSISDN phone numbering specifications.'
  },
  {
    id: 'r3',
    name: 'data_depletion_bounds',
    field: 'data_depletion_pct',
    ruleType: 'RANGE',
    expression: 'pa.Check.in_range(0.00, 100.00)',
    status: 'PASS',
    enabled: true,
    severity: 'CRITICAL',
    message: 'Usage depletion percentage strictly bounded between 0% and 100% inclusive.'
  },
  {
    id: 'r4',
    name: 'foreign_key_session_check',
    field: 'cdr_event_raw',
    ruleType: 'FOREIGN_KEY',
    expression: "pa.Check(lambda x: x['session_id'] in active_sessions)",
    status: 'FLAGGED',
    enabled: true,
    severity: 'WARNING',
    message: 'Foreign key integrity warning: unlinked gNodeB session ID in 3GPP slice handoff block.'
  },
  {
    id: 'r5',
    name: 'churn_risk_probability',
    field: 'churn_risk_score',
    ruleType: 'PROBABILITY',
    expression: 'pa.Check.in_range(0.000, 1.000)',
    status: 'PASS',
    enabled: true,
    severity: 'CRITICAL',
    message: 'Synthetic predictive churn probability calibrated between 0.0 and 1.0.'
  },
  {
    id: 'r6',
    name: 'slice_id_valid_snssai',
    field: 'network_slice_id',
    ruleType: 'CATEGORICAL',
    expression: "pa.Check.isin(['eMBB-01', 'URLLC-02', 'MIoT-03'])",
    status: 'PASS',
    enabled: true,
    severity: 'WARNING',
    message: 'Permitted 3GPP S-NSSAI network slice identifiers only.'
  }
];

interface AuditRecordItem {
  runId: string;
  timestamp: string;
  operator: string;
  domain: string;
  engine: string;
  recordsCount: number;
  dpEpsilon: number;
  seed: number;
  hash: string;
  status: 'VERIFIED' | 'COMPLIANT';
}

const AUDIT_RECORDS: AuditRecordItem[] = [
  {
    runId: 'RUN-9042-5G',
    timestamp: '2026-09-29 07:14:02 UTC',
    operator: 'ap00731492@techmahindra.com',
    domain: 'Telecommunication',
    engine: 'DuckDB In-Memory',
    recordsCount: 100000,
    dpEpsilon: 0.5,
    seed: 42901,
    hash: 'sha256:8f4c29a1b023de98a44b1c742918df',
    status: 'VERIFIED'
  },
  {
    runId: 'RUN-9039-BIAN',
    timestamp: '2026-09-28 16:45:10 UTC',
    operator: 'ap00731492@techmahindra.com',
    domain: 'BFSI & Payments',
    engine: 'Polars Arrow Buffer',
    recordsCount: 50000,
    dpEpsilon: 0.5,
    seed: 11029,
    hash: 'sha256:2b1a99cd4091e84a229cb01174d89a',
    status: 'VERIFIED'
  },
  {
    runId: 'RUN-9031-FHIR',
    timestamp: '2026-09-28 09:12:33 UTC',
    operator: 'ap00731492@techmahindra.com',
    domain: 'Healthcare & Life Sciences',
    engine: 'DuckDB In-Memory',
    recordsCount: 25000,
    dpEpsilon: 0.25,
    seed: 99402,
    hash: 'sha256:9c0e33418820f49a117b9c34e20981',
    status: 'VERIFIED'
  },
  {
    runId: 'RUN-9028-OPC',
    timestamp: '2026-09-27 14:05:44 UTC',
    operator: 'ap00731492@techmahindra.com',
    domain: 'Manufacturing (IoT)',
    engine: 'Spark Cluster Partition',
    recordsCount: 200000,
    dpEpsilon: 1.0,
    seed: 73120,
    hash: 'sha256:44ab1190cf0234ea77881c90df1122',
    status: 'COMPLIANT'
  }
];

// =========================================================================
// DEDICATED VIEW COMPONENTS
// =========================================================================

// 1. SCHEMA CONTRACTS VIEW
function ContractsView({
  onBack,
  onLoadContract,
  showToast
}: {
  onBack: () => void;
  onLoadContract: (contract: ContractItem) => void;
  showToast: (msg: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>('c1');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contractTab, setContractTab] = useState<'fields' | 'pydantic' | 'json'>('fields');

  const selectedContract = CONTRACTS_CATALOG.find(c => c.id === selectedId) || CONTRACTS_CATALOG[0];

  const filteredContracts = CONTRACTS_CATALOG.filter(c => {
    if (filterDomain !== 'all' && c.domain !== filterDomain) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.standard.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      {/* Top Header */}
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-xs bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
              Enterprise Schema Contracts Repository
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-emerald-50 text-[#247153] border border-emerald-200">
            5 Verified Contracts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exported all 5 schema contracts as ZIP')}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 "
          >
            <Download className="w-3 h-3" />
            <span>Export Catalog</span>
          </button>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 pt-2 overflow-hidden">
        {/* Left Column: Contracts List (Span 5) */}
        <section className="col-span-5 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden">
          <div className="p-2.5 border-b border-[#D3D2CE] space-y-2 bg-[#F1F0EC]/40">
            <div className="flex items-center bg-white border border-[#D3D2CE] rounded-xs px-2 py-1 text-xs">
              <Search className="w-3.5 h-3.5 text-[#626263] mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search contracts by name, standard, or code..."
                className="bg-transparent text-xs text-[#0B0B0C] w-full outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} aria-label="Clear contract search" className="text-[#626263]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {['all', 'telecom', 'bfsi', 'healthcare', 'manufacturing'].map(dom => (
                <button
                  key={dom}
                  onClick={() => setFilterDomain(dom)}
                  className={`text-[11px] px-2 py-0.5 rounded-xs border transition-colors capitalize ${
                    filterDomain === dom
                      ? 'bg-[#0B0B0C] text-white border-[#0B0B0C]'
                      : 'bg-white border-[#D3D2CE] text-[#626263] hover:border-[#0B0B0C]'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredContracts.map(c => {
              const isSelected = selectedContract.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-2.5 rounded-xs border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F1F0EC] border-[#0B0B0C] '
                      : 'bg-white border-[#D3D2CE] hover:border-[#626263]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-medium text-[#E31837]">{c.code}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-xs border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#247153] border-emerald-200'
                          : c.status === 'CERTIFIED'
                          ? 'bg-blue-50 text-[#185F8D] border-blue-200'
                          : 'bg-amber-50 text-[#8A5200] border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#0B0B0C] leading-tight mb-1">{c.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-[#626263]">
                    <span className="truncate">{c.standard}</span>
                    <span className="font-mono shrink-0">{c.fieldCount} fields</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Contract Inspector & Code Preview (Span 7) */}
        <section className="col-span-7 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden">
          {/* Inspector Header */}
          <div className="p-3 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#0B0B0C]">{selectedContract.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-white border border-[#D3D2CE] text-[#626263]">
                  {selectedContract.version}
                </span>
              </div>
              <p className="text-xs text-[#626263] leading-tight mb-1.5">{selectedContract.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#626263] font-mono">
                <span>Standard: <strong>{selectedContract.standard}</strong></span>
                <span>Checksum: <code>{selectedContract.checksum}</code></span>
              </div>
            </div>

            <button
              onClick={() => onLoadContract(selectedContract)}
              className="px-3 py-1.5 bg-[#E31837] hover:bg-[#141416] text-white rounded-xs font-medium text-xs flex items-center gap-1.5 focus-techm transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Load into Canvas</span>
            </button>
          </div>

          {/* Sub-view Tab Switcher */}
          <div className="h-9 min-h-9 px-3 border-b border-[#D3D2CE] flex items-center justify-between bg-white">
            <div className="flex items-center gap-1 bg-[#F1F0EC] p-0.5 rounded-xs border border-[#D3D2CE]">
              <button
                onClick={() => setContractTab('fields')}
                className={`px-2.5 py-0.5 text-xs rounded-xs transition-colors ${
                  contractTab === 'fields' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#626263]'
                }`}
              >
                Field Specifications ({selectedContract.fields.length})
              </button>
              <button
                onClick={() => setContractTab('pydantic')}
                className={`px-2.5 py-0.5 text-xs rounded-xs transition-colors ${
                  contractTab === 'pydantic' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#626263]'
                }`}
              >
                Pydantic v2 Model
              </button>
              <button
                onClick={() => setContractTab('json')}
                className={`px-2.5 py-0.5 text-xs rounded-xs transition-colors ${
                  contractTab === 'json' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#626263]'
                }`}
              >
                JSON Schema Spec
              </button>
            </div>

            <button
              onClick={() => showToast(`Copied ${selectedContract.code} schema to clipboard`)}
              className="text-xs text-[#626263] hover:text-[#0B0B0C] flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Schema</span>
            </button>
          </div>

          {/* Inspector Body Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {contractTab === 'fields' && (
              <div className="border border-[#D3D2CE] rounded-xs overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F1F0EC] text-[#626263] border-b border-[#D3D2CE] text-[11px] font-semibold">
                    <tr>
                      <th className="p-2">Field Name</th>
                      <th className="p-2">Physical Type</th>
                      <th className="p-2">Constraints & Bounds</th>
                      <th className="p-2">Sensitivity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D3D2CE] font-mono text-[11px]">
                    {selectedContract.fields.map(f => (
                      <tr key={f.name} className="hover:bg-[#F1F0EC]/40">
                        <td className="p-2 font-semibold text-[#0B0B0C]">{f.name}</td>
                        <td className="p-2 text-[#626263]">{f.type}</td>
                        <td className="p-2 text-[#0B0B0C]">{f.constraints}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-sans ${
                              f.sensitivity.includes('PII')
                                ? 'bg-red-50 text-[#9C1936] border border-red-200'
                                : f.sensitivity.includes('Financial')
                                ? 'bg-amber-50 text-[#8A5200] border border-amber-200'
                                : 'bg-gray-50 text-[#626263] border border-gray-200'
                            }`}
                          >
                            {f.sensitivity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {contractTab === 'pydantic' && (
              <pre className="p-3 bg-[#0B0B0C] text-emerald-400 rounded-xs font-mono text-xs leading-relaxed overflow-x-auto">
                {selectedContract.pydanticCode}
              </pre>
            )}

            {contractTab === 'json' && (
              <pre className="p-3 bg-[#0B0B0C] text-blue-300 rounded-xs font-mono text-xs leading-relaxed overflow-x-auto">
                {JSON.stringify(
                  {
                    $schema: 'https://json-schema.org/draft/2020-12/schema',
                    title: selectedContract.title,
                    type: 'object',
                    standard: selectedContract.standard,
                    version: selectedContract.version,
                    properties: selectedContract.fields.reduce((acc, f) => {
                      acc[f.name] = { type: f.type, constraints: f.constraints, sensitivity: f.sensitivity };
                      return acc;
                    }, {} as Record<string, any>)
                  },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// 2. DKP MANAGER VIEW
function DkpView({
  onBack,
  onMount,
  showToast
}: {
  onBack: () => void;
  onMount: (pkgName: string) => void;
  showToast: (msg: string) => void;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('dkp-1');
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedPkg = DKP_PACKAGES.find(p => p.id === selectedPkgId) || DKP_PACKAGES[0];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Synced all Domain Knowledge Packages with upstream Git & SQLite repository.');
    }, 1200);
  };

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      {/* Top Header */}
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-xs bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <Network className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
              Domain Knowledge Packages (DKP) & SID Ontology Engine
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-blue-50 text-[#185F8D] border border-blue-200">
            Vector Index: 15,560 Triples
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Git/SQLite...' : 'Sync Upstream'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 pt-2 overflow-hidden">
        {/* Left Column: DKP Packages List (Span 4) */}
        <section className="col-span-4 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden">
          <div className="p-2.5 border-b border-[#D3D2CE] bg-[#F1F0EC]/40">
            <span className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
              Installed Knowledge Packages
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {DKP_PACKAGES.map(pkg => {
              const isSelected = selectedPkg.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`p-3 rounded-xs border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F1F0EC] border-[#0B0B0C] '
                      : 'bg-white border-[#D3D2CE] hover:border-[#626263]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#0B0B0C]">{pkg.name}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-xs border ${
                        pkg.status === 'SYNCED'
                          ? 'bg-emerald-50 text-[#247153] border-emerald-200'
                          : pkg.status === 'MOUNTED'
                          ? 'bg-blue-50 text-[#185F8D] border-blue-200'
                          : 'bg-gray-50 text-[#626263] border-gray-200'
                      }`}
                    >
                      {pkg.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#626263] line-clamp-2 leading-tight mb-2">{pkg.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#626263] font-mono pt-1 border-t border-[#D3D2CE]">
                    <span>{pkg.entitiesCount.toLocaleString()} Entities</span>
                    <span>{pkg.triplesCount.toLocaleString()} Triples</span>
                    <span>Sync: {pkg.lastSync}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Interactive Ontology Graph & Hierarchy Inspector (Span 8) */}
        <section className="col-span-8 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden">
          <div className="p-3 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-xs font-semibold text-[#0B0B0C]">{selectedPkg.name}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white border border-[#D3D2CE] rounded-xs text-[#626263]">
                  {selectedPkg.version}
                </span>
              </div>
              <p className="text-[11px] text-[#626263]">{selectedPkg.description}</p>
            </div>

            <button
              onClick={() => onMount(selectedPkg.name)}
              className="px-3 py-1.5 bg-[#E31837] hover:bg-[#141416] text-white rounded-xs font-medium text-xs flex items-center gap-1.5 focus-techm transition-colors shrink-0"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mount to Stage 1 Pipeline</span>
            </button>
          </div>

          {/* Interactive Graph Node Explorer */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <div className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] mb-2 font-mono">
                Ontology Entity Relational Graph
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedPkg.ontologyNodes.map(node => (
                  <div key={node.name} className="p-2.5 rounded-xs border border-[#D3D2CE] bg-[#F1F0EC]/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium font-mono text-[#0B0B0C]">{node.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-white border border-[#D3D2CE] text-[#626263]">
                        {node.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-[#626263] uppercase">Graph Predicates:</span>
                      {node.relationships.map(rel => (
                        <div key={rel} className="text-[11px] font-mono text-[#185F8D] bg-white px-2 py-0.5 rounded-xs border border-[#D3D2CE]">
                          ──&gt; {rel}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RAG Vector Embedding Index Stats */}
            <div className="p-3 rounded-xs border border-[#D3D2CE] bg-white space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B0B0C]">
                <span>RAG Vector Similarity Sub-Schema Pruning</span>
                <span className="text-[#247153] font-mono">Cosine Threshold: 0.84</span>
              </div>
              <p className="text-[11px] text-[#626263] leading-relaxed">
                When business input prompts are submitted, ModelOS queries this package's vector embeddings (FAISS/SQLite) to extract only the minimum sub-schema subtree, pruning 95% of irrelevant SID entities prior to LLM schema parameterization.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// 3. QUALITY GATES VIEW
function QualityGatesView({
  onBack,
  onResolveWarnings,
  showToast
}: {
  onBack: () => void;
  onResolveWarnings: () => void;
  showToast: (msg: string) => void;
}) {
  const [rules, setRules] = useState<AstRuleItem[]>(INITIAL_AST_RULES);
  const [dpEpsilon, setDpEpsilon] = useState<number>(0.5);
  const [testingExpr, setTestingExpr] = useState<string>("account_balance >= 0.00");
  const [testValue, setTestValue] = useState<string>("125.40");
  const [testResult, setTestResult] = useState<string>("PASS: Value 125.40 satisfies predicate");

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    showToast('Updated Pandera AST rule gate status.');
  };

  const flaggedCount = rules.filter(r => r.status === 'FLAGGED' && r.enabled).length;

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      {/* Top Header */}
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-xs bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
              Pandera AST Quality Gates & Differential Privacy Center
            </h2>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-xs border ${
              flaggedCount > 0
                ? 'bg-amber-50 text-[#8A5200] border-amber-200'
                : 'bg-emerald-50 text-[#247153] border-emerald-200'
            }`}
          >
            {flaggedCount > 0 ? `${flaggedCount} AST Check Flagged` : 'All Gates Passing'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <button
              onClick={() => {
                setRules(prev => prev.map(r => (r.id === 'r4' ? { ...r, status: 'PASS', message: 'Auto-resolved via session synthetic link generator' } : r)));
                onResolveWarnings();
              }}
              className="px-2.5 py-1 text-xs bg-[#8A5200] text-white rounded-xs font-medium hover:bg-[#6c4000]"
            >
              Auto-Resolve Flagged Rule
            </button>
          )}
          <button
            onClick={() => showToast('Re-evaluated all 14 Pandera AST Quality Gates: 100% compliant.')}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 "
          >
            <RefreshCw className="w-3 h-3" />
            <span>Run QA Suite</span>
          </button>
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 pt-2 overflow-hidden">
        {/* Left Column: Rules Matrix Table (Span 8) */}
        <section className="col-span-8 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden">
          <div className="p-2.5 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
              Active AST Constraint Predicates
            </span>
            <span className="text-[10px] text-[#626263] font-mono">
              {rules.filter(r => r.enabled).length} of {rules.length} enabled
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F1F0EC] text-[#626263] border-b border-[#D3D2CE] text-[11px] font-semibold sticky top-0">
                <tr>
                  <th className="p-2 w-12 text-center">Gate</th>
                  <th className="p-2">Rule Identifier</th>
                  <th className="p-2">Field</th>
                  <th className="p-2">Pandera AST Expression</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D2CE] font-mono text-[11px]">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-[#F1F0EC]/40">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={() => toggleRule(r.id)}
                        className="rounded-xs border-[#D3D2CE] text-[#E31837] focus:ring-[#E31837]"
                      />
                    </td>
                    <td className="p-2 font-semibold text-[#0B0B0C]">{r.name}</td>
                    <td className="p-2 text-[#626263]">{r.field}</td>
                    <td className="p-2 text-[#185F8D] font-mono text-[10px] truncate max-w-xs">{r.expression}</td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-sans font-semibold ${
                          r.status === 'PASS'
                            ? 'bg-emerald-50 text-[#247153] border border-emerald-200'
                            : 'bg-amber-50 text-[#8A5200] border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Privacy Budget & AST Evaluator (Span 4) */}
        <section className="col-span-4 h-full flex flex-col bg-white border border-[#D3D2CE] rounded-xs overflow-hidden p-3 space-y-3.5">
          {/* Privacy Budget */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-semibold text-[#0B0B0C]">Differential Privacy (DP) Budget</span>
              <span className="font-mono font-medium text-[#E31837]">ε = {dpEpsilon}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={dpEpsilon}
              onChange={e => setDpEpsilon(parseFloat(e.target.value))}
              className="w-full accent-[#E31837]"
            />
            <div className="flex justify-between text-[10px] text-[#626263] mt-1 font-mono">
              <span>High Privacy (ε=0.1)</span>
              <span>High Fidelity (ε=2.0)</span>
            </div>
          </div>

          {/* Statistical Drift Metrics */}
          <div className="border border-[#D3D2CE] rounded-xs p-2.5 bg-[#F1F0EC]/40 space-y-2">
            <span className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] block font-mono">
              Statistical Fidelity Metrics
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xs border border-[#D3D2CE]">
                <div className="text-[10px] text-[#626263]">KS-Test Drift</div>
                <div className="font-medium text-[#247153] font-mono">0.012 (Pass)</div>
              </div>
              <div className="p-2 bg-white rounded-xs border border-[#D3D2CE]">
                <div className="text-[10px] text-[#626263]">Mutual Info</div>
                <div className="font-medium text-[#247153] font-mono">0.94 (Pass)</div>
              </div>
            </div>
          </div>

          {/* Interactive Live AST Sandbox */}
          <div className="border border-[#D3D2CE] rounded-xs p-2.5 bg-white space-y-2 flex-1 flex flex-col">
            <span className="text-[11px] font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
              Live AST Predicate Sandbox
            </span>

            <div className="space-y-1.5 flex-1">
              <div>
                <label className="text-[10px] text-[#626263]">Predicate Expression:</label>
                <input
                  type="text"
                  value={testingExpr}
                  onChange={e => setTestingExpr(e.target.value)}
                  className="w-full p-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#626263]">Sample Test Value:</label>
                <input
                  type="text"
                  value={testValue}
                  onChange={e => {
                    const val = e.target.value;
                    setTestValue(val);
                    const n = parseFloat(val);
                    if (!isNaN(n) && n >= 0) {
                      setTestResult(`PASS: Value ${val} satisfies predicate`);
                    } else {
                      setTestResult(`FAIL: Value ${val} breaches constraint`);
                    }
                  }}
                  className="w-full p-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs font-mono"
                />
              </div>

              <div className="p-2 rounded-xs bg-[#0B0B0C] text-emerald-400 font-mono text-[10px] mt-2">
                {testResult}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// 4. AUDIT LOGS VIEW
function AuditLogsView({
  onBack,
  showToast
}: {
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecordItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = AUDIT_RECORDS.filter(r => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return r.runId.toLowerCase().includes(q) || r.operator.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q);
  });

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      {/* Top Header */}
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-xs bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
              Compliance & Synthetic Generation Audit Ledger
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-emerald-50 text-[#247153] border border-emerald-200">
            Immutable SHA-256 Ledger
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exported audit history report as CSV')}
            className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] font-medium flex items-center gap-1.5 "
          >
            <Download className="w-3 h-3" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="flex-1 bg-white border border-[#D3D2CE] rounded-b-xs overflow-hidden flex flex-col mt-2">
        <div className="p-2.5 border-b border-[#D3D2CE] bg-[#F1F0EC]/40 flex items-center justify-between">
          <div className="flex items-center bg-white border border-[#D3D2CE] rounded-xs px-2 py-1 text-xs w-72">
            <Search className="w-3.5 h-3.5 text-[#626263] mr-1.5 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search audit runs by ID, operator, or domain..."
              className="bg-transparent text-xs text-[#0B0B0C] w-full outline-none"
            />
          </div>
          <span className="text-xs text-[#626263]">All runs cryptographically sealed and immutable.</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#F1F0EC] text-[#626263] border-b border-[#D3D2CE] text-[11px] font-semibold sticky top-0">
              <tr>
                <th className="p-2">Execution Run ID</th>
                <th className="p-2">Timestamp (UTC)</th>
                <th className="p-2">Operator ID</th>
                <th className="p-2">Domain Target</th>
                <th className="p-2">Engine</th>
                <th className="p-2">Records</th>
                <th className="p-2">DP Epsilon</th>
                <th className="p-2">SHA-256 Digest</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D2CE] font-mono text-[11px]">
              {filtered.map(r => (
                <tr
                  key={r.runId}
                  onClick={() => setSelectedRecord(r)}
                  className="hover:bg-[#F1F0EC] cursor-pointer transition-colors"
                >
                  <td className="p-2 font-semibold text-[#E31837]">{r.runId}</td>
                  <td className="p-2 text-[#626263]">{r.timestamp}</td>
                  <td className="p-2 text-[#0B0B0C] font-sans">{r.operator}</td>
                  <td className="p-2 text-[#0B0B0C] font-sans">{r.domain}</td>
                  <td className="p-2 text-[#626263]">{r.engine}</td>
                  <td className="p-2 font-semibold text-[#0B0B0C]">{r.recordsCount.toLocaleString()}</td>
                  <td className="p-2 text-[#247153]">ε={r.dpEpsilon}</td>
                  <td className="p-2 text-[#626263] truncate max-w-[140px]">{r.hash}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-sans font-semibold bg-emerald-50 text-[#247153] border border-emerald-200">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Verification Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 wb-backdrop bg-[#0B0B0C]/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="wb-modal bg-white border border-[#D3D2CE] rounded-xs shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] w-full max-w-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#247153]" />
                <h3 className="text-xs font-semibold text-[#0B0B0C]">
                  Cryptographic Verification Certificate: {selectedRecord.runId}
                </h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} aria-label="Close certificate modal" className="text-[#626263] hover:text-[#0B0B0C]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-[#F1F0EC] rounded-xs border border-[#D3D2CE] space-y-1">
                <div>Run Identifier: <strong>{selectedRecord.runId}</strong></div>
                <div>Operator: <strong>{selectedRecord.operator}</strong></div>
                <div>Volume: <strong>{selectedRecord.recordsCount.toLocaleString()} rows</strong></div>
                <div>Differential Privacy Budget: <strong>ε = {selectedRecord.dpEpsilon}</strong></div>
                <div>Random Seed: <strong>{selectedRecord.seed}</strong></div>
                <div>Timestamp: <strong>{selectedRecord.timestamp}</strong></div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#626263] block mb-1">SHA-256 Provenance Digest:</label>
                <div className="p-2 bg-[#0B0B0C] text-emerald-400 rounded-xs text-[11px] break-all">
                  {selectedRecord.hash}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-sans text-[#247153] bg-emerald-50 p-2 rounded-xs border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cryptographic verification verified against Tech Mahindra ModelOS audit chain. Compliant with GDPR Article 25 & HIPAA Safe Harbor.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D3D2CE]">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#626263]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('Downloaded verification certificate JSON');
                  setSelectedRecord(null);
                }}
                className="px-3 py-1 text-xs bg-[#E31837] text-white rounded-xs font-medium "
              >
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// 5. SETTINGS VIEW
function SettingsView({
  onBack,
  showToast
}: {
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [duckdbMemory, setDuckdbMemory] = useState('4096');
  const [polarsThreads, setPolarsThreads] = useState('8');
  const [defaultEpsilon, setDefaultEpsilon] = useState('0.5');

  const handleSave = () => {
    showToast('Saved ModelOS engine settings.');
    onBack();
  };

  return (
    <main className="flex-1 h-full overflow-hidden bg-[#F1F0EC] p-2 flex flex-col">
      <div className="h-10 min-h-10 border border-[#D3D2CE] rounded-t-xs bg-white px-3 flex items-center justify-between ">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs text-[#0B0B0C] hover:border-[#0B0B0C] font-medium focus-techm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Canvas</span>
          </button>
          <div className="h-4 w-[1px] bg-[#D3D2CE]" />
          <div className="flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-[#E31837]" />
            <h2 className="text-xs font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
              ModelOS Workbench Settings & Engine Configurations
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-[#D3D2CE] rounded-b-xs p-4 max-w-xl space-y-4 text-xs mt-2 overflow-y-auto">
        <div>
          <label className="font-semibold text-[#0B0B0C] block mb-1">DuckDB Memory Limit (MB)</label>
          <input
            type="number"
            value={duckdbMemory}
            onChange={e => setDuckdbMemory(e.target.value)}
            className="w-full p-2 border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
          />
          <span className="text-[10px] text-[#626263]">Max in-memory buffer allocated for high-speed DuckDB synthetic aggregation.</span>
        </div>

        <div>
          <label className="font-semibold text-[#0B0B0C] block mb-1">Polars Thread Pool Worker Count</label>
          <input
            type="number"
            value={polarsThreads}
            onChange={e => setPolarsThreads(e.target.value)}
            className="w-full p-2 border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
          />
          <span className="text-[10px] text-[#626263]">Number of parallel Rayon worker threads for vectorized Parquet generation.</span>
        </div>

        <div>
          <label className="font-semibold text-[#0B0B0C] block mb-1">Default Differential Privacy Budget (ε)</label>
          <input
            type="number"
            step="0.1"
            value={defaultEpsilon}
            onChange={e => setDefaultEpsilon(e.target.value)}
            className="w-full p-2 border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
          />
          <span className="text-[10px] text-[#626263]">Standard privacy noise parameter applied to continuous numerical telemetry.</span>
        </div>

        <div className="pt-2 border-t border-[#D3D2CE] flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#E31837] text-white rounded-xs font-medium hover:bg-[#141416]"
          >
            Save Configurations
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-[#D3D2CE] rounded-xs text-[#626263]"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
type DomainType = 'telecom' | 'bfsi' | 'healthcare' | 'manufacturing' | 'trust_safety';
type PipelineStageId = 1 | 2 | 3 | 4 | 5;
type WorkbenchTab = 'table' | 'records' | 'graph' | 'ast' | 'stageDetails';

// =========================================================================
// GENERATION LIMITS OF THE BACKEND (POST /scenario/generate)
// A transactional run returns `count` users x `recordsPerUser` (max 10) records; an aggregational run returns `count` rows.
// =========================================================================
const MAX_USERS = 5000;
const MAX_RECORDS_PER_USER = 10;
const DEFAULT_RECORD_COUNT = 100;
const RECORD_PRESETS = [10, 100, 1000, 5000];
const MAX_SEED = 2_147_483_647;

/** Country preselected in the Country dropdown (and used if /catalog/countries cannot be loaded). Set VITE_DEFAULT_COUNTRY to change it. */
const DEFAULT_COUNTRY: string = setting('VITE_DEFAULT_COUNTRY', import.meta.env.VITE_DEFAULT_COUNTRY as string | undefined) || 'IN';

type DownloadFormat = ExportFormat;

/** Domains shown for completeness only: they have no catalog data yet, so they are not loaded from the API and cannot be selected. */
// Only these industries are offered for now (matched on the catalog name); anything else the API returns is hidden.
const ENABLED_INDUSTRIES = [/telecom/i, /bank/i];
// Display names only: the catalog name is still what the API and the scenario data use.
const industryLabel = (name: string) => (/bank/i.test(name) ? 'BFSI' : name);
// Greyed-out "coming soon" tiles. Empty for now; add names here to show them again.
const COMING_SOON_DOMAINS: string[] = [];

/** The plain-language line that explains a scenario: its description, or the first sentence of its business brief when it has none. */
const scenarioExplanation = (scenario?: { description?: string | null; businessScenario?: string | null } | null): string => {
  const description = scenario?.description?.trim();
  if (description) return description;
  const brief = (scenario?.businessScenario ?? '').replace(/\s+/g, ' ').trim();
  const sentence = brief.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? brief;
  return sentence.length > 220 ? `${sentence.slice(0, 217)}...` : sentence;
};

const DATA_TYPE_OPTIONS: { value: 'transactional' | 'aggregational'; label: string; hint: string }[] = [
  { value: 'transactional', label: 'Transactional', hint: 'A history of records for each user' },
  { value: 'aggregational', label: 'Aggregational', hint: 'One summary row per record' }
];

/** The most users (transactional) or rows (aggregational) one run can generate. */
const MAX_VOLUME = MAX_USERS;

/** Users (transactional) or rows (aggregational) in the run, and how many history records each user gets. */
function planGeneration(volume: number, typeOfData: string | undefined, recordsPerUser: number): { count: number; recordsPerUser: number } {
  if (typeOfData === 'aggregational') return { count: volume, recordsPerUser: 1 };
  return { count: volume, recordsPerUser };
}

const pct = (score: number | undefined): string => (typeof score === 'number' ? `${(score * 100).toFixed(1)}%` : 'n/a');

export default function App() {
  // View mode: 'frontpage' (document front page) vs 'studio' (workbench canvas)
  const [currentView, setCurrentView] = useState<'frontpage' | 'studio'>('frontpage');

  // Navigation & Domain state
  const [activeNav, setActiveNav] = useState<'workbench' | 'contracts' | 'dkp' | 'quality' | 'audit' | 'settings'>('workbench');
  // The cascading dropdowns (industry -> sub-domain -> use case -> journeys) come from the catalog API.
  const catalog = useCatalog();
  const activeDomain = catalog.industryId;
  const visibleIndustries = catalog.industries.filter(industry => ENABLED_INDUSTRIES.some(rx => rx.test(industry.name)));

  // The sub-domain field is switched off for now (see the commented block in the form), so the first sub-domain of the
  // chosen industry is picked automatically; the use cases are loaded from it exactly as before.
  useEffect(() => {
    if (catalog.subDomainsState === 'ready' && !catalog.subDomainId && catalog.subDomains.length > 0) {
      void catalog.chooseSubDomain(catalog.subDomains[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.subDomainsState, catalog.subDomains, catalog.subDomainId]);
  const [countries, setCountries] = useState<CatalogCountry[]>([]);
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY);
  const useCaseId = catalog.useCaseId;
  const customerJourneys = catalog.journeys;
  const [activeStage, setActiveStage] = useState<PipelineStageId>(3);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('table');
  
  // Progressive 3-Pane Sequential Workflow State
  const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<1 | 2 | 3>(1);
  
  // Pipeline stage statuses
  const [stageStatuses, setStageStatuses] = useState<Record<PipelineStageId, 'COMPLETE' | 'WARNING' | 'PENDING' | 'READY'>>({
    1: 'READY',
    2: 'READY',
    3: 'READY',
    4: 'READY',
    5: 'READY'
  });

  // Business context state
  const [openJourneyIndex, setOpenJourneyIndex] = useState<number>(-1);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [scenarioDetail, setScenarioDetail] = useState<CatalogScenarioDetail | null>(null);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  // How the schema is created: proposed for the scenario ('prompt'), or read from a CSV the user provides ('import').
  const [inputMode, setInputMode] = useState<'prompt' | 'import'>('prompt');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  // Set while the schema under review was read from a CSV (POST /scenario/import-csv) rather than proposed.
  const [csvImport, setCsvImport] = useState<{ fileName: string } | null>(null);
  const [promptText, setPromptText] = useState('');
  const [showPromptInfo, setShowPromptInfo] = useState(false);
  const [showCanvasToolbar, setShowCanvasToolbar] = useState(false);

  // Data contract fields state
  const [fields, setFields] = useState<DataField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  // Rows ticked in the variable table for "Delete selected" (variable ids).
  const [checkedFieldIds, setCheckedFieldIds] = useState<string[]>([]);
  const [fieldFilter, setFieldFilter] = useState<'all' | 'flagged' | 'pii'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Schema review (POST /scenario/propose -> /scenario/confirm)
  const [draft, setDraft] = useState<ScenarioDraftResponse | null>(null);
  const [confirmed, setConfirmed] = useState<ScenarioConfirmResponse | null>(null);
  const [deletedFieldNames, setDeletedFieldNames] = useState<string[]>([]);
  const [confirmedDeletions, setConfirmedDeletions] = useState('');
  // Variables the reviewer adds or changes before approving (sent with POST /scenario/confirm as add / edit)
  const [addedVariables, setAddedVariables] = useState<SchemaVariable[]>([]);
  const [variableEdits, setVariableEdits] = useState<Record<string, Record<string, unknown>>>({});
  useEffect(() => {
    setCheckedFieldIds([]); // a new proposal starts with nothing ticked
  }, [draft]);
  const [variableModal, setVariableModal] = useState<{ mode: 'add' } | { mode: 'edit'; name: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [generated, setGenerated] = useState<ScenarioGenerateResponse | null>(null);
  // Lets an answer that arrives after the user changed the selection be dropped.
  const pipelineTurn = useRef(0);
  const scenarioTurn = useRef(0);

  /* DISABLED: editing a field's constraints, adding a field by hand and the "Recommended Variables" dialog are not
     backed by the API yet (a confirmed schema accepts removals and description/nullable/params edits only).
    // Editing field modal state
  const [editingField, setEditingField] = useState<DataField | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('VARCHAR(64)');
  const [newFieldStandard, setNewFieldStandard] = useState('TMF 638');
  const [newFieldConstraint, setNewFieldConstraint] = useState('NOT NULL');

  // Recommended Scenario Variables Modal state (matches screenshot)
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [availableVars, setAvailableVars] = useState<ScenarioVariableOption[]>(AVAILABLE_SCENARIO_VARIABLES);
  const [recommendedVars, setRecommendedVars] = useState<ScenarioVariableOption[]>([]);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<Set<string>>(new Set());
  const [selectedRecommendedIds, setSelectedRecommendedIds] = useState<Set<string>>(new Set());
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchRecommended, setSearchRecommended] = useState('');

  // Move all available to recommended (>>)
  const handleMoveAllToRecommended = () => {
    if (availableVars.length === 0) return;
    setRecommendedVars(prev => [...prev, ...availableVars]);
    setAvailableVars([]);
    setSelectedAvailableIds(new Set());
    setSelectedRecommendedIds(new Set());
  };

  // Move selected available to recommended (→)
  const handleMoveSelectedToRecommended = () => {
    if (selectedAvailableIds.size === 0) {
      showToast('Please select variables on the left first');
      return;
    }
    const toMove = availableVars.filter(v => selectedAvailableIds.has(v.id));
    const remaining = availableVars.filter(v => !selectedAvailableIds.has(v.id));
    setRecommendedVars(prev => [...prev, ...toMove]);
    setAvailableVars(remaining);
    setSelectedAvailableIds(new Set());
  };

  // Move selected recommended back to available (←)
  const handleMoveSelectedToAvailable = () => {
    if (selectedRecommendedIds.size === 0) {
      showToast('Please select variables on the right to move back');
      return;
    }
    const toMove = recommendedVars.filter(v => selectedRecommendedIds.has(v.id));
    const remaining = recommendedVars.filter(v => !selectedRecommendedIds.has(v.id));
    setAvailableVars(prev => [...prev, ...toMove]);
    setRecommendedVars(remaining);
    setSelectedRecommendedIds(new Set());
  };

  // Move all recommended back to available (<<)
  const handleMoveAllToAvailable = () => {
    if (recommendedVars.length === 0) return;
    setAvailableVars(prev => [...prev, ...recommendedVars]);
    setRecommendedVars([]);
    setSelectedAvailableIds(new Set());
    setSelectedRecommendedIds(new Set());
  };

  // Persist recommended variables into Data Contract Table
  const handleApplyRecommended = () => {
    if (recommendedVars.length === 0) {
      showToast('No recommended variables selected. Select variables first.');
      return;
    }
    const newFieldsToAdd: DataField[] = recommendedVars.map(v => ({
      id: `rec-${v.id}-${Date.now()}`,
      name: v.name,
      standardRef: v.standardRef || 'TM Forum SID',
      physicalType: v.type,
      constraints: v.constraints || 'Standard Schema Constraint',
      sensitivity: v.sensitivity || 'Operational',
      qaStatus: 'PASS',
      distribution: 'Normal distribution'
    }));
    const existingNames = new Set(fields.map(f => f.name));
    const toAdd = newFieldsToAdd.filter(f => !existingNames.has(f.name));
    if (toAdd.length > 0) {
      setFields(prev => [...prev, ...toAdd]);
      showToast(`Added ${toAdd.length} recommended variable${toAdd.length > 1 ? 's' : ''} to Standard Flow Schema Variables`);
    } else {
      showToast('Selected variables are already present in Schema Variables');
    }
    setShowRecommendModal(false);
  };
  */

  // Multi-modal parameters state
  const [targetEngine, setTargetEngine] = useState<'duckdb' | 'polars' | 'spark' | null>(null);
  // Only structured data is generated for now, so it is always selected (the other modalities are not offered).
  const [modalities, setModalities] = useState({
    structured: true,
    text: false,
    vision: false,
    telemetry: false
  });
  const [recordCount, setRecordCount] = useState<number | ''>('');
  const [recordsPerUser, setRecordsPerUser] = useState<number | ''>(MAX_RECORDS_PER_USER);
  const [typeOfData, setTypeOfData] = useState<'transactional' | 'aggregational' | ''>('');
  const [randomSeed, setRandomSeed] = useState<number | ''>('');
  const [modalitiesDropdownOpen, setModalitiesDropdownOpen] = useState(false);
  const [seedSectionExpanded, setSeedSectionExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Hidden by default with side arrow option
  const [pane3Collapsed, setPane3Collapsed] = useState(false);

  // Execution & results state
  const [pipelineRun, setPipelineRun] = useState(false);
  const [isPipelineRunning, setIsRunningPipeline] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('csv');

  /* DISABLED: static AST sandbox of the unused AST tab
  // AST Live Sandbox state
  const [sandboxExpr, setSandboxExpr] = useState("pa.Check(lambda s: s['account_balance'] >= 0, name='non_negative_balance')");
  const [sandboxValue, setSandboxValue] = useState('142.50');
  const [sandboxResult, setSandboxResult] = useState<{ passed: boolean; message: string }>({
    passed: true,
    message: 'Pandera AST Rule Evaluated: PASS (Value 142.50 satisfies predicate account_balance >= 0)'
  });
  */

  const recordCountInputId = useId();
  const recordsPerUserInputId = useId();
  const randomSeedInputId = useId();

  // Toast feedback helper (react-toastify)
  const showToast = (msg: string, kind: ToastKind = 'info') => notify(msg, kind);

  const allStagesReady = { 1: 'READY', 2: 'READY', 3: 'READY', 4: 'READY', 5: 'READY' } as const;

  // Forget everything derived from the current selection (schema draft, confirmation, generated data).
  const resetPipeline = () => {
    pipelineTurn.current += 1;
    setActiveTab('table');
    setPipelineRun(false);
    setIsRunningPipeline(false);
    setIsConfirming(false);
    setIsExecuting(false);
    setIsExecutionComplete(false);
    setDraft(null);
    setCsvImport(null);
    setConfirmed(null);
    setDeletedFieldNames([]);
    setConfirmedDeletions('');
    setAddedVariables([]);
    setVariableEdits({});
    setVariableModal(null);
    setFields([]);
    setSelectedFieldId(null);
    setGenerated(null);
    setStageStatuses({ ...allStagesReady });
    setMaxUnlockedStep(1);
    setWorkflowStep(1);
  };

  const resetSelection = () => {
    scenarioTurn.current += 1;
    setIsScenarioLoading(false);
    setOpenJourneyIndex(-1);
    setSelectedScenario('');
    setScenarioDetail(null);
    setTypeOfData('');
    setPromptText('');
    setShowPromptInfo(false);
  };

  // Handle Domain Change (industries come from GET /catalog/industries)
  const handleDomainChange = (industryId: string) => {
    resetPipeline();
    resetSelection();
    setCsvFile(null);
    if (activeDomain === industryId) {
      void catalog.chooseIndustry(null);
      showToast('Deselected domain context');
      return;
    }
    void catalog.chooseIndustry(industryId);
    // const name = catalog.industries.find(item => item.id === industryId)?.name ?? 'domain';
    // showToast(`Activated ${name}`);
  };

  const handleSubDomainChange = (subDomainId: string) => {
    resetPipeline();
    resetSelection();
    setCsvFile(null);
    void catalog.chooseSubDomain(subDomainId);
  };

  const handleUseCaseChange = (nextUseCaseId: string) => {
    resetPipeline();
    resetSelection();
    setCsvFile(null);
    void catalog.chooseUseCase(nextUseCaseId);
    // const name = catalog.useCases.find(item => item.id === nextUseCaseId)?.name;
    // if (name) showToast(`Scoped use case: ${name} — customer journeys loaded`);
  };

  // Select (or deselect) a scenario; its propose defaults and business description come from GET /catalog/scenarios/{id}
  const handleScenarioSelect = async (scenario: CatalogScenario) => {
    resetPipeline();
    if (selectedScenario === scenario.scenarioId) {
      resetSelection();
      showToast(`Deselected scenario: ${scenario.label}`);
      return;
    }
    resetSelection();
    const turn = scenarioTurn.current;
    setSelectedScenario(scenario.scenarioId);
    setIsScenarioLoading(true);
    try {
      const detail = await getScenarioDetail(scenario.scenarioId);
      if (turn !== scenarioTurn.current) return;
      setScenarioDetail(detail);
      setTypeOfData(detail.proposeRequest.typeOfData);
      setPromptText(detail.proposeRequest.businessScenario ?? '');
      showToast(`Selected scenario: ${scenario.label} — specification loaded`, 'success');
    } catch (error) {
      if (turn !== scenarioTurn.current) return;
      setSelectedScenario('');
      notifyApiError(error, `Could not load scenario ${scenario.scenarioId}.`);
    } finally {
      if (turn === scenarioTurn.current) setIsScenarioLoading(false);
    }
  };

  // Load the industries when the studio opens.
  useEffect(() => {
    if (currentView === 'studio' && catalog.industriesState === 'idle') void catalog.loadIndustries();
  }, [currentView]);

  // Load the country choices once (GET /catalog/countries); keep the default if the call fails.
  const countriesRequested = useRef(false);
  useEffect(() => {
    if (currentView !== 'studio' || countriesRequested.current) return;
    countriesRequested.current = true;
    getCountries()
      .then(list => {
        setCountries(list);
        setCountryCode(prev => (list.some(c => c.code === prev) ? prev : list[0]?.code ?? prev));
      })
      .catch(error => {
        countriesRequested.current = false;
        notifyApiError(error, 'Could not load the country list.');
      });
  }, [currentView]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K, Cmd+Enter / Ctrl+Enter); the ref keeps the handler current.
  const runPipelineRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runPipelineRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The start of step 1 -> 2, whichever way the schema is created: forget the previous draft, show the review pane while it is built.
  const beginDraft = (message: string): number => {
    const turn = ++pipelineTurn.current;
    setDraft(null);
    setCsvImport(null);
    setConfirmed(null);
    setDeletedFieldNames([]);
    setConfirmedDeletions('');
    setAddedVariables([]);
    setVariableEdits({});
    setVariableModal(null);
    setFields([]);
    setGenerated(null);
    setActiveTab('table');
    setIsExecutionComplete(false);
    setMaxUnlockedStep(prev => Math.max(prev, 2) as 1 | 2 | 3);
    setWorkflowStep(2);
    setIsRunningPipeline(true);
    setStageStatuses({ 1: 'COMPLETE', 2: 'PENDING', 3: 'PENDING', 4: 'PENDING', 5: 'READY' });
    setActiveStage(2);
    showToast(message);
    return turn;
  };

  // Step 1 -> 2: POST /scenario/propose proposes the schema for the selected scenario.
  const handleRunPipeline = async () => {
    if (isPipelineRunning) return;
    if (!activeDomain) {
      showToast('Please select an industry domain first', 'warning');
      return;
    }
    if (!scenarioDetail) {
      showToast(selectedScenario ? 'The scenario is still loading' : 'Please select a customer journey scenario first', 'warning');
      return;
    }
    const defaults = scenarioDetail.proposeRequest;
    const businessScenario = (promptText.trim() || defaults.businessScenario || '').trim();
    if (!businessScenario) {
      showToast('This scenario has no business description yet; add one to the catalog first', 'error');
      return;
    }
    const turn = beginDraft('Proposing the schema for this scenario...');
    try {
      const result = await proposeScenario({
        requestedScenarioId: defaults.requestedScenarioId,
        scenarioType: defaults.scenarioType,
        industryType: defaults.industryType,
        domain: defaults.domain,
        businessScenario,
        typeOfData: typeOfData || defaults.typeOfData,
        country: countryCode,
        useCase: defaults.useCase,
        ...(defaults.entityKey ? { entityKey: defaults.entityKey } : {})
      });
      if (turn !== pipelineTurn.current) return;
      setDraft(result);
      setFields(toDataFields(result.variables, result.variableSources, result.entityKey));
      setStageStatuses({ 1: 'COMPLETE', 2: 'COMPLETE', 3: 'PENDING', 4: 'PENDING', 5: 'READY' });
      setActiveStage(3);
      setPipelineRun(true);
      showToast(`Schema proposed: ${result.variables.length} variables. Review it, then approve.`, 'success');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      setMaxUnlockedStep(1);
      setWorkflowStep(1);
      setStageStatuses({ ...allStagesReady });
      notifyApiError(error, 'Could not propose a schema for this scenario.');
    } finally {
      if (turn === pipelineTurn.current) setIsRunningPipeline(false);
    }
  };

  // Step 1 -> 2, from a file: POST /scenario/import-csv reads the variables from the CSV and returns a draft to review.
  const handleImportCsv = async () => {
    if (isPipelineRunning) return;
    if (!activeDomain) {
      showToast('Please select an industry domain first', 'warning');
      return;
    }
    if (!scenarioDetail) {
      showToast(selectedScenario ? 'The scenario is still loading' : 'Please select a customer journey scenario first', 'warning');
      return;
    }
    if (!csvFile) {
      showToast('Choose the CSV file that defines the variables first', 'warning');
      return;
    }
    const defaults = scenarioDetail.proposeRequest;
    const file = csvFile;
    const turn = beginDraft(`Reading the variables from ${file.name}...`);
    try {
      const result = await importScenarioCsv({
        file,
        requestedScenarioId: defaults.requestedScenarioId,
        domain: defaults.domain,
        industryType: defaults.industryType,
        typeOfData: typeOfData || defaults.typeOfData,
        country: countryCode,
        businessScenario: (promptText.trim() || defaults.businessScenario || '').trim(),
        scenarioType: defaults.scenarioType,
        useCase: defaults.useCase,
        label: scenarioDetail.label,
        entityKey: defaults.entityKey
      });
      if (turn !== pipelineTurn.current) return;
      // The server leaves the source of CSV variables empty; mark them as yours so the table says where they came from.
      const imported = { ...result, variableSources: { ...result.variableSources, ...csvSources(result.variables) } };
      setDraft(imported);
      setCsvImport({ fileName: file.name });
      setFields(toDataFields(imported.variables, imported.variableSources, imported.entityKey));
      setStageStatuses({ 1: 'COMPLETE', 2: 'COMPLETE', 3: 'PENDING', 4: 'PENDING', 5: 'READY' });
      setActiveStage(3);
      setPipelineRun(true);
      showToast(`Imported ${result.variables.length} variables from ${file.name}. Review them, then approve.`, 'success');
      const problems = Array.isArray(result.specReport?.problems) ? (result.specReport?.problems as unknown[]) : [];
      if (result.specReport?.status === 'unavailable') {
        showToast(`The data design could not be prepared yet${problems[0] ? `: ${String(problems[0])}` : ''}. It will be tried again when you generate.`, 'warning');
      }
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      setMaxUnlockedStep(1);
      setWorkflowStep(1);
      setStageStatuses({ ...allStagesReady });
      notifyApiError(error, `Could not import ${file.name}.`);
    } finally {
      if (turn === pipelineTurn.current) setIsRunningPipeline(false);
    }
  };
  runPipelineRef.current = () => void (inputMode === 'import' ? handleImportCsv() : handleRunPipeline());

  // Step 2 -> 3: POST /scenario/confirm approves the draft, with the variables the reviewer removed.
  const handleApproveSchema = async () => {
    if (!draft) {
      showToast('Run the pipeline first to propose a schema', 'warning');
      return;
    }
    if (isConfirming) return;
    // What the reviewer changed travels with the approval: variables added (add) and variables changed (edit). Where a column sits is
    // set by the system, so a sequence is only sent when the reviewer overrode it.
    const addedNames = new Set(addedVariables.map(v => String(v.name)));
    const originalSequence = new Map(draft.variables.map(v => [String(v.name), typeof v.sequence === 'number' ? v.sequence : undefined]));
    const editMap = new Map<string, Record<string, unknown>>();
    for (const f of fields) {
      if (addedNames.has(f.name) || f.sequence === undefined || f.sequence === originalSequence.get(f.name)) continue;
      editMap.set(f.name, { sequence: f.sequence });
    }
    for (const [name, changes] of Object.entries(variableEdits) as [string, Record<string, unknown>][]) {
      if (deletedFieldNames.includes(name) || addedNames.has(name)) continue;
      editMap.set(name, { ...(editMap.get(name) ?? {}), ...changes });
    }
    const edits = [...editMap].map(([name, changes]) => ({ name, changes }));
    const additions = addedVariables.map(v => {
      const field = fields.find(f => f.name === v.name);
      return field?.sequence !== undefined && v.sequence === undefined ? { ...v, sequence: field.sequence } : v;
    });
    const deletions = [...deletedFieldNames].sort().join('|')
      + (edits.length ? `#${JSON.stringify(edits)}` : '')
      + (additions.length ? `+${JSON.stringify(additions)}` : '');
    if (confirmed && deletions === confirmedDeletions) {
      setActiveStage(4);
      setMaxUnlockedStep(3);
      setWorkflowStep(3);
      return;
    }
    const turn = pipelineTurn.current;
    setIsConfirming(true);
    try {
      const result = await confirmScenario({
        draft_id: draft.draft_id,
        delete: deletedFieldNames,
        ...(additions.length ? { add: additions } : {}),
        ...(edits.length ? { edit: edits } : {})
      });
      if (turn !== pipelineTurn.current) return;
      setConfirmed(result);
      setConfirmedDeletions(deletions);
      setFields(toDataFields(result.variables, { ...(csvImport ? draft.variableSources : {}), ...result.variableSources }, result.entityKey));
      setStageStatuses(prev => ({ ...prev, 3: 'COMPLETE', 4: 'COMPLETE' }));
      setActiveStage(4);
      setMaxUnlockedStep(3);
      setWorkflowStep(3);
      showToast('Schema approved. Core data generation is unlocked.', 'success');
      if (result.scenario_id_reassigned) showToast(`The scenario id was reassigned to ${result.scenario_id}`, 'warning');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      notifyApiError(error, 'Could not approve the schema.');
    } finally {
      if (turn === pipelineTurn.current) setIsConfirming(false);
    }
  };

  // Step 3: POST /scenario/generate generates the validated dataset from the confirmed schema.
  const handleExecuteEngine = async () => {
    if (!confirmed) {
      showToast('Approve the schema first', 'warning');
      return;
    }
    if (isExecuting) return;
    const isTransactional = confirmed.typeOfData !== 'aggregational';
    const volume = typeof recordCount === 'number' && recordCount > 0 ? Math.floor(recordCount) : DEFAULT_RECORD_COUNT;
    if (volume > MAX_VOLUME) {
      showToast(`A run can generate at most ${MAX_VOLUME.toLocaleString()} ${isTransactional ? 'users' : 'rows'}`, 'error');
      return;
    }
    const perUser = typeof recordsPerUser === 'number' && recordsPerUser > 0 ? Math.floor(recordsPerUser) : MAX_RECORDS_PER_USER;
    if (isTransactional && perUser > MAX_RECORDS_PER_USER) {
      showToast(`Records per user can be at most ${MAX_RECORDS_PER_USER}`, 'error');
      return;
    }
    if (randomSeed !== '' && !(Number.isInteger(randomSeed) && randomSeed >= 0 && randomSeed <= MAX_SEED)) {
      showToast(`The seed must be a whole number from 0 to ${MAX_SEED.toLocaleString()}`, 'error');
      return;
    }
    const plan = planGeneration(volume, confirmed.typeOfData, perUser);
    const turn = pipelineTurn.current;
    setIsExecuting(true);
    setIsExecutionComplete(false);
    setGenerated(null);
    setActiveTab('table');
    try {
      const result = await generateScenario(
        { draftId: confirmed.draft_id, ...plan, ...(randomSeed !== '' ? { seed: randomSeed } : {}) },
        (seconds, attempt) => showToast(`The scenario behaviour is still being designed. Retrying in ${seconds}s (attempt ${attempt})...`)
      );
      if (turn !== pipelineTurn.current) return;
      setGenerated(result);
      setActiveTab('records');
      setIsExecutionComplete(true);
      setStageStatuses(s => ({ ...s, 5: 'COMPLETE' }));
      showToast(`Data generation complete: ${result.total_records.toLocaleString()} synthetic records generated.`, 'success');
      if (result.errors.length > 0) showToast(`The run reported ${result.errors.length} issue(s): ${result.errors[0]}`, 'warning');
    } catch (error) {
      if (turn !== pipelineTurn.current) return;
      notifyApiError(error, 'Data generation failed.');
    } finally {
      if (turn === pipelineTurn.current) setIsExecuting(false);
    }
  };

  // Download the generated records in the selected format (CSV, JSON, SQL, NDJSON)
  const handleDownloadSyntheticData = (formatToUse?: DownloadFormat) => {
    if (!generated) {
      showToast('Generate the data first', 'warning');
      return;
    }
    const fmt = formatToUse || downloadFormat;
    const text = buildExport(fmt, generated);
    if (!text) {
      showToast('There are no records to download.', 'warning');
      return;
    }
    downloadText(exportFileName(fmt, generated), text, EXPORT_MIME[fmt]);
    showToast(`Downloaded synthetic data in ${fmt.toUpperCase()} format (${generated.total_records.toLocaleString()} records).`, 'success');
  };

  // Remove the ticked variables from the schema; the removal is sent with the approval (POST /scenario/confirm).
  // Required variables and the entity key cannot be ticked, and are skipped here as well.
  const handleDeleteSelected = () => {
    const doomed = fields.filter(f => checkedFieldIds.includes(f.id) && !f.required);
    if (doomed.length === 0) return;
    const doomedIds = new Set(doomed.map(f => f.id));
    const doomedNames = new Set(doomed.map(f => f.name));
    // A variable the reviewer added has nothing to delete on the server: it is simply not sent.
    const addedNames = new Set(addedVariables.filter(v => doomedNames.has(v.name)).map(v => v.name));
    const serverNames = doomed.map(f => f.name).filter(name => !addedNames.has(name));
    setFields(prev => prev.filter(f => !doomedIds.has(f.id)));
    setVariableEdits(prev => Object.fromEntries(Object.entries(prev).filter(([name]) => !doomedNames.has(name))));
    setAddedVariables(prev => prev.filter(v => !addedNames.has(v.name)));
    setDeletedFieldNames(prev => [...prev, ...serverNames.filter(name => !prev.includes(name))]);
    setCheckedFieldIds([]);
    const what = doomed.length === 1 ? `field "${doomed[0].name}"` : `${doomed.length} fields`;
    showToast(serverNames.length === 0 ? `Removed ${what}.` : `Removed ${what}. Approve the schema to apply it.`);
  };

  // Variables can be added and changed until the schema is approved.
  const canReview = Boolean(draft) && !confirmed;
  const sourceOf = (name: string): string =>
    String(draft?.variableSources?.[name.trim().toLowerCase()] ?? draft?.variableSources?.[name] ?? '').toUpperCase();
  /** The definition shown for a variable: as proposed, with the reviewer's changes applied (or the variable the reviewer added). */
  const variableFor = (name: string): SchemaVariable | undefined => {
    const added = addedVariables.find(v => v.name === name);
    if (added) return added;
    const base = draft?.variables.find(v => v.name === name);
    return base ? { ...base, ...(variableEdits[name] ?? {}) } : undefined;
  };
  const accessOf = (name: string): VariableAccess => {
    if (addedVariables.some(v => v.name === name)) return 'full';
    return ['DB_RECOMMENDED', 'USER_SELECTED'].includes(sourceOf(name)) ? 'locked' : 'limited';
  };

  const handleSaveVariable = (save: VariableSave) => {
    const modal = variableModal;
    if (!modal || !draft) return;
    const entityKey = draft.entityKey ?? null;
    const sources = { ...draft.variableSources, ...Object.fromEntries(addedVariables.map(v => [String(v.name).toLowerCase(), 'USER_ADDED'])) };
    if (save.kind === 'definition') {
      const definition = save.definition as SchemaVariable;
      const row = toDataField({ ...definition, source: 'USER_ADDED' }, { ...sources, [String(definition.name).toLowerCase()]: 'USER_ADDED' }, entityKey);
      if (modal.mode === 'add') {
        setAddedVariables(prev => [...prev, definition]);
        setFields(prev => [...prev, row]); // placed at the end for now; the backend puts it in story order when the schema is approved
        showToast(`Added "${definition.name}". Approve the schema to apply it.`);
      } else {
        setAddedVariables(prev => prev.map(v => (v.name === modal.name ? definition : v)));
        setFields(prev => prev.map(f => (f.name === modal.name ? { ...row, sequence: definition.sequence ?? f.sequence } : f)));
        showToast(`Updated "${definition.name}".`);
      }
    } else if (modal.mode === 'edit') {
      const { sequence, ...others } = save.changes;
      const merged = Object.keys(others).length ? { ...(variableEdits[modal.name] ?? {}), ...others } : variableEdits[modal.name];
      if (merged) setVariableEdits(prev => ({ ...prev, [modal.name]: merged }));
      const base = draft.variables.find(v => v.name === modal.name);
      setFields(prev => {
        const next = prev.map(f => {
          if (f.name !== modal.name) return f;
          const shown = base ? toDataField({ ...base, ...(merged ?? {}) }, sources, entityKey) : f;
          return { ...shown, id: f.id, sequence: typeof sequence === 'number' ? sequence : f.sequence };
        });
        return typeof sequence === 'number' ? bySequence(next) : next;
      });
      showToast(`Updated "${modal.name}". Approve the schema to apply it.`);
    }
    setVariableModal(null);
  };

  // Filtered fields
  const filteredFields = fields.filter(f => {
    if (fieldFilter === 'flagged' && f.qaStatus !== 'FLAGGED') return false;
    if (fieldFilter === 'pii' && !f.sensitivity.includes('PII') && !f.sensitivity.includes('Financial')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.standardRef.toLowerCase().includes(q) || f.physicalType.toLowerCase().includes(q);
    }
    return true;
  });

  // Ticking rows for "Delete selected": required variables cannot be ticked, and the header box acts on the rows shown.
  const checkedFields = fields.filter(f => checkedFieldIds.includes(f.id) && !f.required);
  const shownRemovable = filteredFields.filter(f => !f.required);
  const allShownChecked = shownRemovable.length > 0 && shownRemovable.every(f => checkedFieldIds.includes(f.id));
  const someShownChecked = shownRemovable.some(f => checkedFieldIds.includes(f.id));
  const toggleChecked = (id: string) => setCheckedFieldIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleAllShown = () =>
    setCheckedFieldIds(prev =>
      allShownChecked ? prev.filter(id => !shownRemovable.some(f => f.id === id)) : [...prev, ...shownRemovable.map(f => f.id).filter(id => !prev.includes(id))],
    );

  /* DISABLED: recommended-variables dialog filters and the volume-calibrated seed suggestions (static content, not backed by the API)
  // Filtered recommended scenario variables (from modal search)
  const filteredAvailable = availableVars.filter(v =>
    v.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    v.description.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    v.type.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  const filteredRecommended = recommendedVars.filter(v =>
    v.name.toLowerCase().includes(searchRecommended.toLowerCase()) ||
    v.description.toLowerCase().includes(searchRecommended.toLowerCase()) ||
    v.type.toLowerCase().includes(searchRecommended.toLowerCase())
  );

  // Seed recommendations calibrated by record volume
  const getVolumeSeedSuggestions = (volume: number | '') => {
    const count = typeof volume === 'number' && volume > 0 ? volume : 100000;
    if (count <= 10000) {
      return [
        {
          seed: 10421,
          tag: 'Fast Baseline',
          category: 'Deterministic Prototyping',
          desc: 'Calibrated for 10K rapid synthesis with zero empty categorical buckets.',
          rationale: 'Minimizes hash collisions on small MSISDN lookup tables'
        },
        {
          seed: 13370,
          tag: 'Anomaly Stress',
          category: 'Edge-Case Injection',
          desc: 'Exercises extreme distribution boundaries for stress validation.',
          rationale: 'Forces 30% boundary anomaly cases into the first 1,000 batches'
        },
        {
          seed: 42001,
          tag: 'Balanced Spread',
          category: 'Uniform Stratification',
          desc: 'Deterministic uniform distribution across subscriber balance tiers.',
          rationale: 'Guarantees equal coverage across low balance and credit tiers'
        }
      ];
    } else if (count <= 50000) {
      return [
        {
          seed: 50892,
          tag: 'Cross-Validation',
          category: 'K-Fold Stratification',
          desc: 'Optimized for 50K multi-fold splits with balanced demographic strata.',
          rationale: 'Preserves identical demographic distribution across 5 cross-validation folds'
        },
        {
          seed: 54321,
          tag: '5G Telemetry',
          category: 'Markov Process',
          desc: 'Smooth Markov transition matrix for high-frequency CDR streams.',
          rationale: 'Generates realistic session handoff chains between cell towers'
        },
        {
          seed: 77104,
          tag: 'Low Drift',
          category: 'Distribution Stability',
          desc: 'Minimizes empirical KS-statistic across 50K generated samples.',
          rationale: 'Ensures KS-test p-value > 0.20 against baseline CDR tables'
        }
      ];
    } else if (count <= 100000) {
      return [
        {
          seed: 42901,
          tag: 'TM Forum Standard',
          category: 'Enterprise SID v22.5',
          desc: 'Recommended TM Forum SID baseline seed for enterprise compliance.',
          rationale: 'Calibrated to production telco subscriber base distributions'
        },
        {
          seed: 99120,
          tag: 'Longitudinal Cohort',
          category: 'Multi-Day Temporal',
          desc: 'Preserves multi-day subscriber journey correlation at 100K records.',
          rationale: 'Simulates 30-day top-up lifecycle with realistic decay rate'
        },
        {
          seed: 10042,
          tag: 'Diff-Privacy Certified',
          category: 'GDPR / HIPAA Safe',
          desc: 'Ensures ε ≤ 0.5 differential privacy budget bounds strictly hold.',
          rationale: 'Guarantees Laplacian noise scale meets zero re-identification criteria'
        }
      ];
    } else {
      return [
        {
          seed: 88204,
          tag: 'High-Scale Stress',
          category: 'High Throughput',
          desc: 'Optimized for 500K+ high-throughput DuckDB/Polars IPC buffers.',
          rationale: 'Prevents PRNG cycle exhaustion and aligns multi-threaded memory buffers'
        },
        {
          seed: 52941,
          tag: 'Weibull Hazard',
          category: 'Survival Analysis',
          desc: 'Ensures asymptotic convergence for churn hazard regression models.',
          rationale: 'Stabilizes heavy-tailed Pareto distributions for extreme data usage'
        },
        {
          seed: 98765,
          tag: 'Slice Distribution',
          category: '5G Network Slicing',
          desc: 'Uniform partition across 5G network slices (eMBB, URLLC, MIoT).',
          rationale: 'Preserves QoS telemetry across enterprise and IoT sub-networks'
        }
      ];
    }
  };
  */

  if (currentView === 'frontpage') {
    // The landing page scrolls with the window (its pinned sections need that), so no scroll container wraps it.
    return <LandingPage onOpenWorkspace={() => setCurrentView('studio')} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F1F0EC] text-[#0B0B0C] font-sans select-none">
      {/* =========================================================================
          TOP APPLICATION HEADER (Fixed 56px, ink bar to match the landing page)
          ========================================================================= */}
      <header className="h-14 min-h-14 border-b border-white/10 bg-[#0B0B0C] px-4 flex items-center justify-between z-20">
        {/* Left: the ModelOS Source logo (one image; opens the ModelOS platform) */}
        <h1 className="sr-only">ModelOS - Synthetic Data Generator</h1>
        <BrandHeader />

        {/* Right side controls */}
        <span className="wb-cap text-[#F1F0EC]/60">Synthetic data workbench</span>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE WRAPPER (Fixed height, 56px Nav Sidebar + 3-Pane Grid)
          ========================================================================= */}
      <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
        {/* =======================================================================
            B. WORKBENCH NAV SIDEBAR (Collapsible via side arrow option)
            ======================================================================= */}
        <aside className={`${
          sidebarCollapsed
            ? 'w-0 min-w-0 opacity-0 overflow-hidden border-r-0 pointer-events-none'
            : 'w-[64px] min-w-[64px] border-r border-white/10'
        } bg-[#0B0B0C] text-[#F1F0EC] flex flex-col items-center py-2 justify-between z-10 transition-all duration-200 relative shrink-0`}>
          <div className="flex flex-col items-center gap-1 w-full">
            {/* Collapse Side Arrow Button */}
            <button
              type="button"
              onClick={() => {
                setSidebarCollapsed(true);
                showToast('Collapsed side navigation panel');
              }}
              title="Hide side panel (Click side arrow)"
              aria-label="Hide side panel"
              className="w-full h-7 flex items-center justify-center text-[#F1F0EC]/50 hover:text-[#E31837] transition-colors cursor-pointer border-b border-white/10 mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Nav item 0: Front Page */}
            <button
              onClick={() => setCurrentView('frontpage')}
              title="SynthDataAI — Front Page Overview"
              aria-label="Front Page"
              className="w-full h-14 flex flex-col items-center justify-center relative focus-techm transition-colors cursor-pointer text-[#F1F0EC]/55 hover:text-[#F1F0EC] hover:bg-white/5"
            >
              <FlaskConical className="w-4 h-4" />
              <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] mt-1">Home</span>
            </button>
            <div className="w-8 h-px bg-white/10 my-1" />

            {/* Nav item 1: Workbench */}
            <button
              onClick={() => setActiveNav('workbench')}
              title="Multi-Domain Workbench — Interactive 5-Stage Generation Pipeline"
              aria-label="Multi-Domain Workbench"
              className={`w-full h-14 flex flex-col items-center justify-center relative focus-techm transition-colors cursor-pointer ${
                activeNav === 'workbench'
                  ? 'text-[#F1F0EC] bg-white/5'
                  : 'text-[#F1F0EC]/55 hover:text-[#F1F0EC] hover:bg-white/5'
              }`}
            >
              {activeNav === 'workbench' && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E31837]" />
              )}
              <Layers className="w-5 h-5" />
              <span className="font-mono text-[8.5px] uppercase tracking-[0.06em] mt-1">Canvas</span>
            </button>
          </div>
        </aside>

        {/* Expand Side Arrow Button Tab when sidebar is collapsed */}
        {sidebarCollapsed && (
          <div className="z-20 self-center relative flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setSidebarCollapsed(false);
                showToast('Expanded side navigation panel');
              }}
              title="Show side navigation panel (Click side arrow)"
              aria-label="Show side navigation panel"
              className="h-14 w-4 bg-[#0B0B0C] border border-[#0B0B0C] border-l-0 rounded-r-xs flex items-center justify-center text-[#F1F0EC]/60 hover:text-[#E31837] transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* =======================================================================
            C. THREE-PANE SEQUENTIAL PROGRESSIVE WORKSPACE
            ======================================================================= */}
        {activeNav === 'workbench' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F1F0EC]">
            {/* Sequential 3-Step Workspace Navigation Bar */}
            <div className="px-4 py-1.5 bg-white border-b border-[#D3D2CE] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#626263] uppercase tracking-[0.06em] flex items-center gap-1.5 font-mono mr-2">
                  <Sliders className="w-3.5 h-3.5 text-[#626263]" />
                  <span>Workflow</span>
                </span>
                <div className="flex items-stretch gap-0">
                  {([
                    { n: 1, label: 'Scenario', blocked: 'Please choose your scenario in step 1 first' },
                    { n: 2, label: 'Schema', blocked: 'Please choose your scenario in step 1 first' },
                    { n: 3, label: 'Generate', blocked: 'Please review and approve the schema in step 2 first' },
                  ] as const).map(({ n, label, blocked }) => {
                    const active = workflowStep === n;
                    const unlocked = maxUnlockedStep >= n;
                    const done = maxUnlockedStep > n;
                    return (
                      <React.Fragment key={n}>
                        {n > 1 && <span aria-hidden="true" className="self-center w-6 h-px bg-[#D3D2CE] mx-1 shrink-0" />}
                        <button
                          type="button"
                          aria-current={active ? 'step' : undefined}
                          onClick={() => {
                            if (unlocked) setWorkflowStep(n);
                            else showToast(blocked);
                          }}
                          className={`relative px-3 py-2 flex items-center gap-2.5 transition-colors focus-techm ${
                            active
                              ? 'text-[#0B0B0C] cursor-pointer'
                              : unlocked
                                ? 'text-[#626263] hover:text-[#0B0B0C] cursor-pointer'
                                : 'text-[#9A9A9C] cursor-not-allowed'
                          }`}
                        >
                          <span className={`font-mono text-[11px] tracking-[0.06em] ${active ? 'text-[#E31837]' : ''}`}>
                            {String(n).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-medium tracking-[-0.01em]">{label}</span>
                          {!unlocked ? (
                            <Lock className="w-3 h-3" />
                          ) : done ? (
                            <Check className="w-3 h-3 text-[#247153]" />
                          ) : null}
                          <span aria-hidden="true" className={`absolute left-3 right-3 -bottom-1.5 h-[2px] bg-[#E31837] origin-left transition-transform duration-500 ${active ? 'scale-x-100' : 'scale-x-0'}`} />
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[11px] text-[#626263]">
                  Step {workflowStep} of 3
                </span>
                {maxUnlockedStep > 1 && (
                  <button
                    onClick={() => {
                      setMaxUnlockedStep(1);
                      setWorkflowStep(1);
                      showToast('Reset workflow to Step 1');
                    }}
                    className="text-[10px] font-mono text-[#E31837] hover:underline cursor-pointer"
                  >
                    Reset Steps
                  </button>
                )}
              </div>
            </div>

            <main className={`flex-1 min-h-0 grid grid-cols-12 gap-2.5 p-2.5 h-full overflow-hidden ${
              workflowStep === 1 ? 'grid-rows-[minmax(0,1fr)]' : 'grid-rows-[auto_minmax(0,1fr)]'
            }`}>
          {workflowStep >= 2 && maxUnlockedStep >= 2 && (
            <ContextBar
              onEdit={() => setWorkflowStep(1)}
              items={[
                { label: 'Industry', value: industryLabel(catalog.industries.find(i => i.id === activeDomain)?.name ?? '—') },
                { label: 'Use case', value: catalog.useCases.find(u => u.id === useCaseId)?.name ?? '—' },
                { label: 'Journey', value: scenarioDetail?.journey?.name ?? '—' },
                { label: 'Scenario', value: scenarioDetail?.label ?? selectedScenario ?? '—' },
                { label: 'Data', value: DATA_TYPE_OPTIONS.find(o => o.value === typeOfData)?.label ?? '—' },
                { label: 'Schema from', value: csvImport ? `CSV · ${csvImport.fileName}` : 'Proposed for you' },
                { label: 'Country', value: countryCode },
              ]}
            />
          )}
          {workflowStep === 1 && (
            <StepIntro
              items={[
                { label: 'Industry', done: !!activeDomain },
                { label: 'Use case', done: !!useCaseId },
                { label: 'Customer journey', done: !!selectedScenario },
                { label: 'Type of data', done: !!typeOfData },
              ]}
            />
          )}
          {/* =====================================================================
              PANE 1: CONTEXT & BUSINESS INPUT SELECTOR (Step 1)
              ===================================================================== */}
          <section className={`${
            workflowStep === 1 ? 'col-span-12 lg:col-span-10 2xl:col-span-9' : 'hidden'
          } h-full wb-pane flex flex-col bg-[#FFFFFF] border border-[#D3D2CE] rounded-xs overflow-hidden transition-all ${
            workflowStep === 1 ? 'border-t-2 border-t-[#E31837]' : ''
          }`}>
            {/* Pane Header */}
            <div className="h-10 min-h-10 px-4 border-b border-[#D3D2CE] flex items-center justify-between bg-[#FFFFFF]">
              <h2 className="wb-cap text-[#0B0B0C]">Context &amp; Business Input</h2>
            </div>

            {/* Scrollable Context Body */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-12 gap-x-4 gap-y-3 content-start text-xs">
              {/* Domain Picker Pills (industries from GET /catalog/industries) */}
              <div className={!activeDomain ? 'col-span-12 h-full flex flex-col' : 'col-span-12 lg:col-span-5'}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                    Target Industry Domain
                  </label>
                  {activeDomain && (
                    <button
                      type="button"
                      onClick={() => handleDomainChange(activeDomain)}
                      className="text-[10px] text-[#626263] hover:text-[#E31837] hover:underline cursor-pointer flex items-center gap-1 font-medium"
                      title="Show all industry domains"
                    >
                      <span>Change Domain</span>
                    </button>
                  )}
                </div>

                {catalog.industriesState === 'error' ? (
                  <div className="p-3 text-center text-xs border border-dashed border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/40 space-y-1.5">
                    <p className="text-[#9C1936] font-medium">Could not load the industry domains.</p>
                    <button
                      type="button"
                      onClick={() => void catalog.loadIndustries()}
                      className="px-2.5 py-1 text-[11px] bg-white border border-[#D3D2CE] hover:border-[#0B0B0C] rounded-xs font-medium cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : catalog.industriesState !== 'ready' ? (
                  <div className="p-3 text-center text-xs text-[#8F8F8D] italic border border-dashed border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/40">
                    Loading industry domains...
                  </div>
                ) : visibleIndustries.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#8F8F8D] italic border border-dashed border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/40">
                    No industry domains are configured yet.
                  </div>
                ) : (
                  <div className={activeDomain ? "flex flex-col gap-2" : "grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] auto-rows-[64px] content-start gap-2.5"}>
                    {visibleIndustries
                      .filter(industry => !activeDomain || activeDomain === industry.id)
                      .map((industry, tileIdx) => {
                        const { Logo, color } = getDomainVisual(industry.name);
                        const isSelected = activeDomain === industry.id;

                        if (isSelected) {
                          return (
                            <div
                              key={industry.id}
                              className="px-3 h-12 bg-[#E31837] text-white rounded-xs border border-[#C8102E] flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xs bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white ">
                                  <Logo className={`w-5 h-5 ${color}`} />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm font-semibold block leading-tight tracking-wide text-white truncate">
                                    {industryLabel(industry.name)}
                                  </span>
                                  {/* Sub-domain count hidden while the sub-domain field is off:
                                  <span className="text-[11px] text-white/80 font-mono block mt-0.5 truncate">
                                    {catalog.subDomainsState === 'ready'
                                      ? `${catalog.subDomains.length} Sub-domain${catalog.subDomains.length === 1 ? '' : 's'}`
                                      : 'Loading sub-domains...'}
                                  </span> */}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={industry.id}
                            type="button"
                            onClick={() => handleDomainChange(industry.id)}
                            style={{ '--i': tileIdx } as React.CSSProperties}
                            className="wb-row group relative px-3 rounded-xs border border-[#D3D2CE] bg-[#F1F0EC]/70 hover:bg-white hover:border-[#0B0B0C] text-left transition-colors cursor-pointer flex items-center gap-3 focus-techm"
                          >
                            <div className="w-9 h-9 rounded-xs bg-white border border-[#D3D2CE] group-hover:border-[#0B0B0C]/40 flex items-center justify-center shrink-0 transition-colors">
                              <Logo className={`w-5 h-5 ${color}`} />
                            </div>
                            <span className="flex-1 min-w-0 text-[15px] font-medium tracking-[-0.02em] text-[#0B0B0C] truncate">
                              {industryLabel(industry.name)}
                            </span>
                            <span className="font-mono text-[10px] tracking-[0.06em] text-[#8F8F8D]">{String(tileIdx + 1).padStart(2, '0')}</span>
                            <span aria-hidden="true" className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#E31837] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                          </button>
                        );
                      })}
                    {!activeDomain && COMING_SOON_DOMAINS
                      .filter(name => !catalog.industries.some(industry => industry.name.toLowerCase() === name.toLowerCase()))
                      .map(name => {
                        const { Logo, color } = getDomainVisual(name);
                        return (
                          <div
                            key={`coming-soon-${name}`}
                            aria-disabled="true"
                            title="Not available yet"
                            className="px-3 rounded-xs border border-dashed border-[#D3D2CE] bg-transparent text-left flex items-center gap-3 opacity-60 cursor-not-allowed select-none"
                          >
                            <div className="w-9 h-9 rounded-xs bg-white border border-[#D3D2CE] flex items-center justify-center shrink-0 grayscale">
                              <Logo className={`w-5 h-5 ${color}`} />
                            </div>
                            <span className="flex-1 min-w-0 text-[15px] font-medium tracking-[-0.02em] text-[#626263] truncate">{name}</span>
                            <span className="font-mono text-[10px] tracking-[0.06em] text-[#8F8F8D] uppercase">Soon</span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {!activeDomain && catalog.industriesState === 'ready' && (
                  <div className="wb-csv-card mt-4 rounded-xs p-4 flex items-center gap-4 flex-wrap">
                    <span className="shrink-0 w-10 h-10 rounded-xs bg-[#E31837] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </span>
                    <div className="min-w-[220px] flex-1">
                      <p className="flex items-center gap-2 text-[15px] font-medium tracking-[-0.01em]">
                        Start from your own CSV
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#E31837] border border-[#E31837]/60 px-1 py-px">Your data</span>
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#F1F0EC]/65">
                        Pick an industry and a scenario, then choose "Upload a CSV" under schema source. Your column names and types become the schema.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadText(CSV_TEMPLATE_FILE_NAME, CSV_TEMPLATE, 'text/csv;charset=utf-8')}
                      className="wb-link shrink-0 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#F1F0EC] hover:text-[#E31837] transition-colors cursor-pointer focus-techm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Sample CSV
                    </button>
                  </div>
                )}

                {!activeDomain && catalog.industriesState === 'ready' && (
                  <div className="wb-tall-only mt-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#626263]">What happens next</p>
                    <ol className="mt-2 border-t border-[#D3D2CE]">
                      {[
                        ['Review the schema', 'We propose the variables for your scenario, or you bring your own CSV. Add, edit or remove columns.'],
                        ['Approve it', 'Every column has a source, a type and its rules. Approving locks them in.'],
                        ['Generate and download', 'Choose the number of users and records per user, run it, then download the data.'],
                      ].map(([title, text], i) => (
                        <li key={title} className="flex items-baseline gap-5 py-3 border-b border-[#D3D2CE]">
                          <span className="font-mono text-[11px] tracking-[0.06em] text-[#8F8F8D] w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                          <span className="w-[200px] shrink-0 text-[15px] font-medium tracking-[-0.01em] text-[#0B0B0C]">{title}</span>
                          <span className="text-[13px] leading-relaxed text-[#626263]">{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {!activeDomain && catalog.industriesState === 'ready' && (
                  <p className="mt-auto pt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[#8F8F8D]">
                    <span aria-hidden="true" className="h-px flex-1 bg-[#D3D2CE]" />
                    <span>More industries appear here as they are connected</span>
                  </p>
                )}

                {/* Sub-domain and Use Case dropdowns (GET /catalog/sub-domains, GET /catalog/use-cases) */}
                {activeDomain && (
                  <div className="mt-2.5 p-2 bg-[#F1F0EC] rounded-xs border border-[#D3D2CE] space-y-2">
                    {/* Sub-domain field, switched off for now (the first sub-domain is chosen automatically, see the effect above).
                        Restore it by removing this comment marker pair.
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                        Sub-domain
                      </label>
                      <div className="relative">
                        <select
                          value={catalog.subDomainId}
                          onChange={e => handleSubDomainChange(e.target.value)}
                          disabled={catalog.subDomainsState !== 'ready' || catalog.subDomains.length === 0}
                          className={`w-full text-xs font-medium bg-white border border-[#D3D2CE] rounded-xs px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            !catalog.subDomainId ? 'text-[#8F8F8D] italic' : 'text-[#0B0B0C] font-semibold'
                          }`}
                        >
                          <option value="" className="text-[#8F8F8D] not-italic">
                            {catalog.subDomainsState === 'loading' ? 'Loading...' : '---select-----'}
                          </option>
                          {catalog.subDomains.map(sub => (
                            <option key={sub.id} value={sub.id} className="text-[#0B0B0C] py-1 not-italic font-medium">
                              {sub.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#626263] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    */}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                          Use case
                        </label>
                      </div>
                      <div className="relative">
                        <select
                          value={useCaseId}
                          onChange={e => handleUseCaseChange(e.target.value)}
                          disabled={!catalog.subDomainId || catalog.useCasesState !== 'ready' || catalog.useCases.length === 0}
                          className={`w-full text-xs font-medium bg-white border border-[#D3D2CE] rounded-xs px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            !useCaseId ? 'text-[#8F8F8D] italic' : 'text-[#0B0B0C] font-semibold'
                          }`}
                        >
                          <option value="" className="text-[#8F8F8D] not-italic">
                            {catalog.useCasesState === 'loading' ? 'Loading...' : '---select-----'}
                          </option>
                          {catalog.useCases.map(item => (
                            <option key={item.id} value={item.id} className="text-[#0B0B0C] py-1 not-italic font-medium">
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#626263] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={countryCode}
                          onChange={e => setCountryCode(e.target.value)}
                          disabled={countries.length === 0}
                          className="w-full text-xs font-semibold text-[#0B0B0C] bg-white border border-[#D3D2CE] rounded-xs px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {countries.length === 0 && <option value={countryCode}>{countryCode}</option>}
                          {countries.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.name} ({c.currency})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#626263] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {useCaseId && catalog.journeysState === 'ready' ? (
                      <div className="flex items-center justify-between text-[10px] text-[#247153] pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-[#247153]" />
                          Scenarios Loaded
                        </span>
                        <span className="font-mono text-[#E31837] font-medium">
                          {customerJourneys.length} Journey{customerJourneys.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#8F8F8D] italic pt-0.5">
                        {!catalog.subDomainId ? 'Select a sub-domain, then a use case, to load customer journeys' : 'Select a use case to load customer journeys'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Journey Accordion (GET /catalog/journeys, GET /catalog/scenarios) */}
              <div className={activeDomain ? 'col-span-12 lg:col-span-7' : 'hidden'}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                    Customer Journey & Business Scenarios
                  </label>
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs ${
                    customerJourneys.length > 0
                      ? 'text-[#E31837] bg-[#E31837]/10'
                      : 'text-[#626263] bg-[#F1F0EC] border border-[#D3D2CE]'
                  }`}>
                    {catalog.journeysState === 'loading'
                      ? 'Loading...'
                      : customerJourneys.length > 0
                        ? `${customerJourneys.length} Journeys • ${customerJourneys.reduce((acc, j) => acc + j.scenarios.length, 0)} Scenarios`
                        : 'Awaiting Use Case Selection'}
                  </span>
                </div>
                <div className="border border-[#D3D2CE] rounded-xs divide-y divide-[#D3D2CE] bg-[#FFFFFF] overflow-hidden ">
                  {customerJourneys.length === 0 ? (
                    <div className="p-3 bg-white text-center text-xs text-[#8F8F8D] italic">
                      {catalog.journeysState === 'loading'
                        ? 'Loading customer journeys...'
                        : catalog.journeysState === 'ready'
                          ? 'No customer journeys are configured for this use case yet'
                          : 'Select a Use Case from the dropdown above to load customer journeys'}
                    </div>
                  ) : (
                    customerJourneys.map((journey, idx) => {
                      const isOpen = openJourneyIndex === idx;
                      const isJourneyActive = journey.scenarios.some(s => s.scenarioId === selectedScenario);

                      return (
                        <div key={journey.id} className="text-xs">
                          <button
                            onClick={() => setOpenJourneyIndex(isOpen ? -1 : idx)}
                            className={`w-full px-2.5 py-2.5 flex items-center justify-between text-left font-medium transition-colors focus-techm cursor-pointer ${
                              isJourneyActive
                                ? 'bg-[#F8F7F4] border-l-2 border-l-[#E31837]'
                                : 'hover:bg-[#F1F0EC]'
                            }`}
                          >
                            <div className="min-w-0 pr-1 truncate">
                              <span
                                className={`truncate block leading-tight ${
                                  isJourneyActive
                                    ? 'text-[#E31837] font-semibold'
                                    : 'text-[#0B0B0C] font-medium'
                                }`}
                              >
                                {idx + 1}. {journey.name}
                              </span>
                              <span className={`text-[10px] block ${isJourneyActive ? 'text-[#E31837]' : 'text-[#626263]'}`}>
                                {journey.scenarios.length} business scenarios
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isOpen ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[#626263]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[#626263]" />
                              )}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-2 pb-2 pt-1 space-y-1 bg-[#F1F0EC]/40 border-t border-[#D3D2CE]/60 max-h-64 overflow-y-auto">
                              {journey.scenarios.map(scenario => {
                                const isSelected = selectedScenario === scenario.scenarioId;

                                return (
                                  <button
                                    key={scenario.scenarioId}
                                    onClick={() => void handleScenarioSelect(scenario)}
                                    title={isSelected ? `Click to deselect ${scenario.label}` : `Click to select ${scenario.label}`}
                                    className={`w-full text-left px-2 py-1.5 rounded-xs text-[11px] flex flex-col items-stretch gap-1 transition-colors cursor-pointer group ${
                                      isSelected
                                        ? 'bg-[#FFFFFF] text-[#E31837] font-semibold border border-[#D3D2CE] border-l-2 border-l-[#E31837]'
                                        : 'text-[#626263] hover:text-[#0B0B0C] hover:bg-[#FFFFFF]/80'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 min-w-0 truncate pr-1">
                                        <span
                                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border shrink-0 transition-colors ${
                                            isSelected
                                              ? 'bg-[#E31837] text-white border-[#E31837]'
                                              : 'bg-[#FFFFFF] text-[#0B0B0C] border-[#D3D2CE] group-hover:border-[#0B0B0C]'
                                          }`}
                                        >
                                          {scenario.scenarioId}
                                        </span>
                                        <span className="truncate">{scenario.scenarioType}</span>
                                      </div>
                                      {isSelected && (isScenarioLoading
                                        ? <RefreshCw className="w-3.5 h-3.5 text-[#E31837] shrink-0 ml-1 animate-spin" />
                                        : <Check className="w-3.5 h-3.5 text-[#E31837] shrink-0 ml-1" />)}
                                    </div>
                                    {scenarioExplanation(scenario) && (
                                      <p className={`text-[10px] leading-snug font-normal ${isSelected ? 'text-[#626263]' : 'text-[#8F8F8D] group-hover:text-[#626263]'}`}>
                                        {scenarioExplanation(scenario)}
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Type of data: the scenario's journey says which of these it supports (GET /catalog/scenarios/{id}) */}
              {activeDomain && useCaseId && selectedScenario && (
                <div className="col-span-12 lg:col-span-5 wb-rise">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#E31837]" />
                    <label className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                      Type of Data <span className="text-[#E31837]">*</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DATA_TYPE_OPTIONS.map(option => {
                      const supported = !scenarioDetail || scenarioDetail.journey.dataTypes.includes(option.value);
                      const active = typeOfData === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={!supported || isScenarioLoading}
                          onClick={() => {
                            if (active) return;
                            resetPipeline();
                            setTypeOfData(option.value);
                          }}
                          title={supported ? option.hint : `${option.label} data is not available for this journey`}
                          className={`wb-choice text-left p-3 rounded-xs border text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            active
                              ? 'border-[#0B0B0C] bg-[#F8F7F4] is-on'
                              : 'border-[#D3D2CE] bg-white hover:border-[#0B0B0C]'
                          }`}
                        >
                          <span className="block font-semibold text-[#0B0B0C]">{option.label}</span>
                          <span className="block text-[10px] text-[#626263] leading-snug mt-0.5">{option.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* How the schema is created: proposed for the scenario, or read from the user's own CSV (POST /scenario/import-csv) */}
              {activeDomain && useCaseId && selectedScenario && (
                <div className="col-span-12 lg:col-span-7 wb-rise">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#E31837]" />
                    <label className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">Schema source</label>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Schema source">
                    {([
                      { value: 'prompt', label: 'Propose for me', hint: 'The variables are proposed for this scenario' },
                      { value: 'import', label: 'Upload a CSV', hint: 'Bring your own column names and types' }
                    ] as const).map(option => {
                      const active = inputMode === option.value;
                      const isCsv = option.value === 'import';
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={isPipelineRunning}
                          onClick={() => {
                            if (active) return;
                            resetPipeline();
                            setInputMode(option.value);
                          }}
                          className={`text-left p-2.5 rounded-xs text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-techm ${
                            isCsv
                              ? 'wb-csv-card flex items-start gap-3'
                              : `wb-choice border ${active ? 'border-[#0B0B0C] bg-[#F8F7F4] is-on' : 'border-[#D3D2CE] bg-white hover:border-[#0B0B0C]'}`
                          }`}
                        >
                          {isCsv && (
                            <span className="shrink-0 w-8 h-8 rounded-xs bg-[#E31837] flex items-center justify-center">
                              <Upload className="w-4 h-4 text-white" />
                            </span>
                          )}
                          <span className="min-w-0 block">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className={isCsv ? 'text-white' : 'text-[#0B0B0C]'}>{option.label}</span>
                              {isCsv && <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#E31837] border border-[#E31837]/60 px-1 py-px">Your data</span>}
                            </span>
                            <span className={`block text-[10px] leading-snug mt-0.5 ${isCsv ? 'text-[#F1F0EC]/60' : 'text-[#626263]'}`}>{option.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {inputMode === 'import' && (
                    <div className="mt-2">
                      <CsvImportPanel
                        file={csvFile}
                        disabled={isPipelineRunning}
                        onFile={file => {
                          if (draft) resetPipeline(); // a different file means a new draft
                          setCsvFile(file);
                        }}
                        onRefused={message => showToast(message, 'error')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DISABLED: the multi-modality picker: only structured data is generated for now, so it is always selected
              {/ * Multi-Modal Modalities Section: Displayed once user has selected Telecommunication, Use Case, and Customer Journey * /}
              {activeDomain && useCaseId && selectedScenario && (
                <div className="relative pt-2.5 border-t border-[#D3D2CE] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E31837]" />
                      <label className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                        Multi-Modal Modalities <span className="text-[#E31837]">*</span>
                      </label>
                    </div>
                    {Object.values(modalities).some(Boolean) && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalities({ structured: false, text: false, vision: false, telemetry: false });
                          showToast('Cleared all modalities');
                        }}
                        className="text-[10px] text-[#626263] hover:text-[#0B0B0C] underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                {/ * Dropdown Multi-Select Trigger Button * /}
                <button
                  type="button"
                  onClick={() => setModalitiesDropdownOpen(prev => !prev)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xs border text-xs font-medium cursor-pointer transition-all bg-white ${
                    modalitiesDropdownOpen
                      ? 'border-[#E31837]'
                      : !Object.values(modalities).some(Boolean)
                        ? 'border-amber-300 bg-amber-50/20 hover:border-[#0B0B0C]'
                        : 'border-[#D3D2CE] hover:border-[#0B0B0C]'
                  }`}
                  aria-expanded={modalitiesDropdownOpen}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1 text-left mr-2">
                    {!Object.values(modalities).some(Boolean) ? (
                      <span className="text-amber-700 font-medium text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Select modality type to activate Proceed...</span>
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {modalities.text && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#247153]/10 text-[#247153] text-[10px] font-semibold">
                            <FileText className="w-2.5 h-2.5" /> Unstructured Data
                          </span>
                        )}
                        {modalities.structured && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#185F8D]/10 text-[#185F8D] text-[10px] font-semibold">
                            <Table className="w-2.5 h-2.5" /> Structured Data
                          </span>
                        )}
                        {modalities.vision && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#8A5200]/10 text-[#8A5200] text-[10px] font-semibold">
                            <ImageIcon className="w-2.5 h-2.5" /> Image
                          </span>
                        )}
                        {modalities.telemetry && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#9C1936]/10 text-[#9C1936] text-[10px] font-semibold">
                            <Video className="w-2.5 h-2.5" /> Video
                          </span>
                        )}
                        <span className="text-[10px] text-[#626263] font-semibold ml-0.5">
                          ({Object.values(modalities).filter(Boolean).length} selected)
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#626263] transition-transform duration-200 shrink-0 ${modalitiesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/ * Dropdown Multi-Select Menu * /}
                {modalitiesDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-[#D3D2CE] rounded-xs shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] p-2 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#D3D2CE] text-[10px]">
                      <span className="font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
                        Select Modalities
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModalities({ structured: true, text: true, vision: true, telemetry: true });
                            showToast('Selected all 4 multi-modal modalities');
                          }}
                          className="text-[#185F8D] hover:underline cursor-pointer font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-[#D3D2CE]">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setModalities({ structured: false, text: false, vision: false, telemetry: false });
                            showToast('Reset modalities');
                          }}
                          className="text-[#626263] hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-56 overflow-y-auto pt-0.5">
                      {/ * 1. Unstructured Data * /}
                      <label
                        className={`flex items-center justify-between p-2 rounded-xs border cursor-pointer transition-colors ${
                          modalities.text
                            ? 'bg-[#247153]/10 border-[#247153]/40'
                            : 'bg-[#F1F0EC]/40 border-[#D3D2CE] hover:bg-[#F1F0EC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#247153]" />
                          <div>
                            <p className="font-semibold text-xs text-[#0B0B0C]">Unstructured Data</p>
                            <p className="text-[10px] text-[#626263]">Customer chat & USSD transcripts</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={modalities.text}
                          onChange={e => setModalities(m => ({ ...m, text: e.target.checked }))}
                          className="rounded-xs accent-[#E31837] w-4 h-4 cursor-pointer"
                        />
                      </label>

                      {/ * 2. Structured Data * /}
                      <label
                        className={`flex items-center justify-between p-2 rounded-xs border cursor-pointer transition-colors ${
                          modalities.structured
                            ? 'bg-[#185F8D]/10 border-[#185F8D]/40'
                            : 'bg-[#F1F0EC]/40 border-[#D3D2CE] hover:bg-[#F1F0EC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Table className="w-4 h-4 text-[#185F8D]" />
                          <div>
                            <p className="font-semibold text-xs text-[#0B0B0C]">Structured Data</p>
                            <p className="text-[10px] text-[#626263]">Parquet & Arrow IPC buffers</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={modalities.structured}
                          onChange={e => setModalities(m => ({ ...m, structured: e.target.checked }))}
                          className="rounded-xs accent-[#E31837] w-4 h-4 cursor-pointer"
                        />
                      </label>

                      {/ * 3. Image * /}
                      <label
                        className={`flex items-center justify-between p-2 rounded-xs border cursor-pointer transition-colors ${
                          modalities.vision
                            ? 'bg-[#8A5200]/10 border-[#8A5200]/40'
                            : 'bg-[#F1F0EC]/40 border-[#D3D2CE] hover:bg-[#F1F0EC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#8A5200]" />
                          <div>
                            <p className="font-semibold text-xs text-[#0B0B0C]">Image</p>
                            <p className="text-[10px] text-[#626263]">Synthetic ID/KYC cards & portraits</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={modalities.vision}
                          onChange={e => setModalities(m => ({ ...m, vision: e.target.checked }))}
                          className="rounded-xs accent-[#E31837] w-4 h-4 cursor-pointer"
                        />
                      </label>

                      {/ * 4. Video * /}
                      <label
                        className={`flex items-center justify-between p-2 rounded-xs border cursor-pointer transition-colors ${
                          modalities.telemetry
                            ? 'bg-[#9C1936]/10 border-[#9C1936]/40'
                            : 'bg-[#F1F0EC]/40 border-[#D3D2CE] hover:bg-[#F1F0EC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-[#9C1936]" />
                          <div>
                            <p className="font-semibold text-xs text-[#0B0B0C]">Video</p>
                            <p className="text-[10px] text-[#626263]">Synthetic video motion & frame sequences</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={modalities.telemetry}
                          onChange={e => setModalities(m => ({ ...m, telemetry: e.target.checked }))}
                          className="rounded-xs accent-[#E31837] w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="pt-1.5 border-t border-[#D3D2CE] flex items-center justify-between">
                      <span className="text-[10px] text-[#8F8F8D]">
                        {Object.values(modalities).filter(Boolean).length} of 4 chosen
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalitiesDropdownOpen(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#0B0B0C] text-white rounded-xs hover:bg-black cursor-pointer "
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
              */}

              {/* Pipeline Run / Proceed Action Button */}
              {activeDomain && (
                <div className="col-span-12 sticky -bottom-3 -mx-3 -mb-3 px-3 py-2.5 bg-white/95 backdrop-blur-xs border-t border-[#D3D2CE] space-y-2 z-10">
                  {(() => {
                    const hasSelectedModality = true; // structured data is always selected
                    const canProceed = Boolean(
                      activeDomain &&
                      useCaseId &&
                      scenarioDetail &&
                      typeOfData &&
                      !isScenarioLoading &&
                      hasSelectedModality &&
                      !isPipelineRunning &&
                      (inputMode !== 'import' || csvFile)
                    );
                    const importing = inputMode === 'import';

                    return (
                      <>
                        <button
                          onClick={() => {
                            if (!pipelineRun) {
                              void (importing ? handleImportCsv() : handleRunPipeline());
                              return;
                            }
                            setMaxUnlockedStep(prev => Math.max(prev, 2) as 1 | 2 | 3);
                            setWorkflowStep(2);
                          }}
                          disabled={!canProceed}
                          className="wb-btn w-full h-10 px-4 text-[13px] focus-techm"
                          title={
                            !useCaseId
                              ? 'Select a use case from the dropdown above'
                              : !selectedScenario
                                ? 'Select a customer journey scenario above'
                                : isScenarioLoading
                                  ? 'Loading the selected scenario...'
                                  : importing && !csvFile
                                    ? 'Choose the CSV file that defines the variables'
                                  : !hasSelectedModality
                                  ? 'Select at least 1 modality type above to activate this button'
                                  : isPipelineRunning
                                    ? 'Synthesizing Pipeline...'
                                    : 'Continue to schema'
                          }
                        >
                          {isPipelineRunning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{importing ? 'Reading the CSV...' : 'Synthesizing Pipeline...'}</span>
                            </>
                          ) : (
                            <BtnLabel>{importing && !pipelineRun ? 'Import CSV & review schema' : 'Continue to schema'}</BtnLabel>
                          )}
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </section>

          {/* =====================================================================
              PANE 2: INTEGRATED PIPELINE CANVAS & WORKBENCH (Hidden until Step 1 complete)
              ===================================================================== */}
          <section className={`${
            workflowStep < 2 || maxUnlockedStep < 2
              ? 'hidden'
              : workflowStep === 2
                ? 'col-span-12'
                : pane3Collapsed
                  ? 'col-span-11'
                  : 'col-span-9 2xl:col-span-8'
          } h-full wb-pane flex flex-col bg-[#FFFFFF] border border-[#D3D2CE] rounded-xs overflow-hidden transition-all ${
            workflowStep === 2 ? 'border-t-2 border-t-[#E31837]' : ''
          }`}>
            {/* Dynamic Stage Workspace Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {!activeDomain ? (
                <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center bg-[#F1F0EC]/40 border border-dashed border-[#D3D2CE] rounded-xs">
                  <div className="w-14 h-14 rounded-xs bg-white border border-[#D3D2CE] flex items-center justify-center mb-3 ">
                    <Sliders className="w-6 h-6 text-[#E31837]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0B0B0C] tracking-tight">
                    Synthesis Pipeline Canvas
                  </h3>
                </div>
              ) : !pipelineRun ? (
                <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center bg-[#F1F0EC]/40 border border-dashed border-[#D3D2CE] rounded-xs">
                  <div className="w-14 h-14 rounded-xs bg-white border border-[#D3D2CE] flex items-center justify-center mb-3 ">
                    <Zap className="w-6 h-6 text-[#E31837]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0B0B0C] mb-3 tracking-tight">
                    {isPipelineRunning ? 'Executing 5-Stage Synthesis Pipeline...' : 'Pipeline Synthesis Canvas'}
                  </h3>

                  {/* Customer Journey Selection Card - Dynamic Selection State */}
                  <div className="w-full max-w-lg p-3 bg-white border border-[#D3D2CE] rounded-xs text-left">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] mb-2 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#E31837]" />
                        <span>Selected Customer Journey</span>
                      </div>
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-xs font-medium ${
                        selectedScenario
                          ? 'bg-[#E31837]/10 text-[#E31837] font-semibold'
                          : 'bg-[#F1F0EC] text-[#626263] border border-[#D3D2CE]'
                      }`}>
                        {selectedScenario ? (scenarioDetail?.label ?? selectedScenario) : 'Not Selected (Default)'}
                      </span>
                    </div>

                    {selectedScenario ? (() => {
                      const journeyIndex = customerJourneys.findIndex(j => j.scenarios.some(s => s.scenarioId === selectedScenario));
                      const parentJourney = journeyIndex >= 0 ? customerJourneys[journeyIndex] : undefined;
                      return (
                        <div className="p-3 rounded-xs border border-[#0B0B0C] bg-[#F8F7F4]">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-xs bg-[#E31837] text-white text-[11px] font-mono font-medium flex items-center justify-center ">
                                {journeyIndex + 1 || 1}
                              </span>
                              <span className="text-xs font-semibold text-[#0B0B0C]">
                                {parentJourney?.name ?? 'Customer Journey'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#626263] leading-relaxed mb-2">
                            {scenarioExplanation(scenarioDetail) || (isScenarioLoading ? 'Loading the scenario description...' : 'No description is configured for this scenario.')}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-[#D3D2CE] text-[11px]">
                            <span className="text-[#626263]">
                              Scenario:{' '}
                              <strong className="text-[#0B0B0C] font-mono font-medium">
                                {scenarioDetail?.label ?? selectedScenario}
                              </strong>
                            </span>
                            <span className="text-[10px] text-[#247153] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#247153]" />
                              Ready for Synthesis
                            </span>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="p-3.5 rounded-xs border border-dashed border-[#D3D2CE] bg-[#F1F0EC]/40 text-center">
                        <div className="text-xs font-semibold text-[#0B0B0C] mb-1">
                          {useCaseId
                            ? (catalog.useCases.find(item => item.id === useCaseId)?.name ?? 'Use Case')
                            : 'No Use Case Selected'}
                        </div>
                        <p className="text-[11px] text-[#626263] leading-relaxed mb-2 max-w-sm mx-auto">
                          {useCaseId
                            ? 'Select a scenario in step 1 to configure your synthesis requirements.'
                            : 'Select a use case in step 1 to load customer journeys and scenarios.'}
                        </p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-mono text-[#626263] bg-white border border-[#D3D2CE] px-2 py-0.5 rounded-xs ">
                          <span>{useCaseId ? 'Awaiting Scenario Selection' : 'Awaiting Use Case Selection'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPipelineRunning && (
                    <div className="w-full max-w-xs space-y-2 mt-4">
                      <div className="w-full bg-[#D3D2CE] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#E31837] h-full rounded-full animate-pulse w-3/4"></div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#E31837]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing Pydantic AST & Schemas...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
              {/* Schema <-> generated records switch (shown once POST /scenario/generate has returned) */}
              {generated && (activeTab === 'table' || activeTab === 'records') && (
                <div className="flex items-center justify-between pb-2">
                  <div className="inline-flex items-center p-0.5 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('table')}
                      className={`px-3 py-1 rounded-xs text-xs transition-all cursor-pointer ${
                        activeTab === 'table' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#626263] hover:text-[#0B0B0C] font-medium'
                      }`}
                    >
                      Schema ({fields.length} Fields)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('records')}
                      className={`px-3 py-1 rounded-xs text-xs transition-all cursor-pointer ${
                        activeTab === 'records' ? 'bg-white text-[#0B0B0C] font-semibold ' : 'text-[#626263] hover:text-[#0B0B0C] font-medium'
                      }`}
                    >
                      Generated Data ({generated.total_records.toLocaleString()} records)
                    </button>
                  </div>
                </div>
              )}

              {/* GENERATED DATA: accordion per user (transactional) or table (aggregational) */}
              {activeTab === 'records' && generated && <GeneratedRecords result={generated} />}

              {/* TAB 1: DATA CONTRACT TABLE */}
              {activeTab === 'table' && (
                <div className="space-y-3">
                  {workflowStep === 2 && (
                    <div className="pb-3 mb-1 border-b border-[#D3D2CE]">
                      <p className="wb-cap text-[#626263]">Step 02 of 03</p>
                      <h2 className="mt-2 text-[26px] font-medium leading-[1.05] tracking-[-0.035em]">Review the variables we will generate.</h2>
                      <p className="mt-1.5 max-w-[70ch] text-[13px] leading-snug text-[#626263]">
                        Every row becomes a column in your data. Add, edit or remove variables, then approve the schema to move on.
                      </p>
                    </div>
                  )}
                  {/* Clean Table Action Bar */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-medium text-[#0B0B0C] uppercase tracking-[0.06em] font-mono">
                        Standard Flow Schema Variables
                      </h3>
                      <span className="text-[10px] font-mono text-[#247153] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs font-medium">
                        {fields.length} Fields Active
                      </span>
                      {csvImport && (
                        <span
                          className="inline-flex items-center gap-1 max-w-[16rem] text-[10px] font-mono text-[#185F8D] bg-[#185F8D]/10 border border-[#185F8D]/25 px-1.5 py-0.5 rounded-xs font-medium"
                          title={`The variables were read from ${csvImport.fileName}`}
                        >
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">From {csvImport.fileName}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDeleteSelected}
                        disabled={!canReview || checkedFields.length === 0}
                        title={
                          !canReview
                            ? 'The schema is approved; run the pipeline again to change variables'
                            : checkedFields.length === 0
                            ? 'Tick one or more variables to delete them'
                            : `Delete the ${checkedFields.length} selected variable${checkedFields.length === 1 ? '' : 's'}`
                        }
                        className="px-2.5 py-1 text-xs rounded-xs bg-white border border-[#D3D2CE] hover:border-[#9C1936] hover:bg-red-50 text-[#9C1936] font-medium flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#D3D2CE] disabled:hover:bg-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{checkedFields.length > 0 ? `Delete selected (${checkedFields.length})` : 'Delete selected'}</span>
                      </button>
                      <button
                        onClick={() => setVariableModal({ mode: 'add' })}
                        disabled={!canReview}
                        title={canReview ? 'Add a variable of your own to the schema' : 'The schema is approved; run the pipeline again to change variables'}
                        className="px-2.5 py-1 text-xs rounded-xs bg-white border border-[#D3D2CE] hover:border-[#0B0B0C] text-[#0B0B0C] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-[#F1F0EC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-3.5 h-3.5 text-[#E31837]" />
                        <span>Add variable</span>
                    </button>
                    </div>
                    {/* DISABLED: 'Recommended Variables' dialog: not backed by the API yet
                    <button
                      onClick={() => setShowRecommendModal(true)}
                      className="px-2.5 py-1 text-xs rounded-xs bg-[#FFFFFF] border border-[#D3D2CE] hover:border-[#0B0B0C] text-[#0B0B0C] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-[#F1F0EC] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E31837]" />
                      <span>Recommended Variables</span>
                    </button>
                    */}
                  </div>

                  {/* DISABLED: adding a field by hand is not supported for a source-backed schema
                  {/ * Add Field Form (collapsible) * /}
                  {isAddingField && (
                    <div className="p-3 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#0B0B0C]">
                        <span>Add New Field to Data Contract</span>
                        <button onClick={() => setIsAddingField(false)} aria-label="Cancel adding field" className="text-[#626263] hover:text-[#0B0B0C]">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-[#626263] uppercase font-mono">Field Name</label>
                          <input
                            type="text"
                            value={newFieldName}
                            onChange={e => setNewFieldName(e.target.value)}
                            placeholder="e.g. sim_slot_index"
                            className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#626263] uppercase font-mono">Physical Type</label>
                          <input
                            type="text"
                            value={newFieldType}
                            onChange={e => setNewFieldType(e.target.value)}
                            className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#626263] uppercase font-mono">Standard Ref</label>
                          <input
                            type="text"
                            value={newFieldStandard}
                            onChange={e => setNewFieldStandard(e.target.value)}
                            className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#626263] uppercase font-mono">Constraint</label>
                          <input
                            type="text"
                            value={newFieldConstraint}
                            onChange={e => setNewFieldConstraint(e.target.value)}
                            className="w-full p-1 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setIsAddingField(false)}
                          className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#626263]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddField}
                          className="px-3 py-1 text-xs bg-[#E31837] text-white rounded-xs font-medium "
                        >
                          Save Field
                        </button>
                      </div>
                    </div>
                  )}
                  */}
                  {/* High-Density Data Contract Table */}
                  <div className="border border-[#D3D2CE] rounded-xs overflow-auto max-h-[60vh] bg-white">
                    <table className="w-full min-w-[820px] text-left text-[12px] border-collapse">
                      <thead>
                        <tr className="bg-[#F1F0EC] border-b border-[#D3D2CE] text-[#626263] font-mono text-[11px]">
                          <th className="py-2 pl-3 pr-1 w-8">
                            <input
                              type="checkbox"
                              ref={el => {
                                if (el) el.indeterminate = someShownChecked && !allShownChecked;
                              }}
                              checked={allShownChecked}
                              onChange={toggleAllShown}
                              disabled={!canReview || shownRemovable.length === 0}
                              aria-label="Select all variables shown"
                              title="Select all variables shown (required variables cannot be selected)"
                              className="w-3.5 h-3.5 accent-[#E31837] cursor-pointer disabled:cursor-not-allowed"
                            />
                          </th>
                          <th className="py-2 px-2 font-semibold w-12" title="Place of the column in the delivered data. The system orders the columns (customer before account, a start date before its end date, ...)">#</th>
                          <th className="py-2 px-3 font-semibold">Field Name</th>
                          <th className="py-2 px-3 font-semibold">Source</th>
                          <th className="py-2 px-3 font-semibold">Physical Type</th>
                          <th className="py-2 px-3 font-semibold">Constraints / Distribution</th>
                          <th className="py-2 px-3 font-semibold">Sensitivity</th>
                          <th className="py-2 px-3 font-semibold">QA Status</th>
                          <th className="py-2 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D3D2CE]">
                        {filteredFields.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-xs text-[#8F8F8D] bg-white">
                              <p className="font-semibold text-[#0B0B0C] mb-1">No data contract fields match current filter</p>
                              <p className="text-[11px] text-[#626263] mb-3">
                                {fieldFilter === 'flagged'
                                  ? 'All AST constraints are repaired and passing. There are no flagged warnings.'
                                  : 'No fields match the active search or filter criteria.'}
                              </p>
                              {fieldFilter !== 'all' && (
                                <button
                                  onClick={() => setFieldFilter('all')}
                                  className="px-3 py-1 bg-white border border-[#D3D2CE] hover:border-[#0B0B0C] text-[#0B0B0C] font-medium rounded-xs text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <span>View All Fields</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredFields.map((field, rowIdx) => {
                          const isFlagged = field.qaStatus === 'FLAGGED';
                          return (
                            <tr
                              key={field.id}
                              onClick={() => setSelectedFieldId(field.id)}
                              style={{ '--i': Math.min(rowIdx, 12) } as React.CSSProperties}
                              className={`wb-row hover:bg-[#F1F0EC]/60 transition-colors cursor-pointer ${
                                isFlagged ? 'bg-amber-50/50' : ''
                              } ${selectedFieldId === field.id ? 'bg-[#F1F0EC]' : ''} ${checkedFieldIds.includes(field.id) && !field.required ? 'bg-red-50/60' : ''}`}
                            >
                              <td className="py-2 pl-3 pr-1 w-8" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={checkedFieldIds.includes(field.id) && !field.required}
                                  onChange={() => toggleChecked(field.id)}
                                  disabled={!canReview || field.required}
                                  aria-label={`Select ${field.name}`}
                                  title={field.required ? 'Required field (cannot be removed)' : `Select ${field.name}`}
                                  className="w-3.5 h-3.5 accent-[#E31837] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="py-2 px-2 font-mono text-[11px] text-[#8F8F8D]">{fields.findIndex(f => f.id === field.id) + 1}</td>

                              <td className="py-2 px-3 font-mono font-medium text-[#0B0B0C]">
                                <div className="flex items-center gap-1.5">
                                  {isFlagged ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-[#8A5200] shrink-0" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#247153] shrink-0" />
                                  )}
                                  <span className="block truncate max-w-[240px]" title={field.name}>{field.name}</span>
                                </div>
                              </td>

                              <td className="py-2 px-3 text-[#626263]">
                                <span
                                  className="inline-block max-w-[150px] truncate align-middle whitespace-nowrap px-1.5 py-0.5 rounded-xs bg-[#F1F0EC] border border-[#D3D2CE] text-[11px]"
                                  title={field.standardRef}
                                >
                                  {field.standardRef}
                                </span>
                              </td>

                              <td className="py-2 px-3 font-mono text-[#0B0B0C]">
                                <span className="block truncate max-w-[130px] text-[#185F8D] font-medium" title={field.physicalType}>{field.physicalType}</span>
                              </td>

                              <td className="py-2 px-3 text-[#626263] font-mono text-[11px]">
                                <div className="truncate max-w-[200px]" title={field.constraints}>
                                  {field.constraints}
                                </div>
                              </td>

                              <td className="py-2 px-3">
                                <span
                                  title={field.sensitivity}
                                  className={`inline-block max-w-[120px] truncate align-middle whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded-xs font-medium border ${
                                    field.sensitivity.includes('PII')
                                      ? 'bg-red-50 text-[#9C1936] border-red-200'
                                      : field.sensitivity.includes('Financial')
                                      ? 'bg-amber-50 text-[#8A5200] border-amber-200'
                                      : field.sensitivity.includes('Synthetic')
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-[#F8F7F4] text-[#626263] border-[#D3D2CE]'
                                  }`}
                                >
                                  {field.sensitivity}
                                </span>
                              </td>

                              <td className="py-2 px-3">
                                {isFlagged ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-amber-100 text-[#8A5200] font-semibold text-[10px] border border-amber-300">
                                    <AlertTriangle className="w-3 h-3" /> FLAGGED
                                  </span>
                                ) : field.qaStatus === 'RESOLVED' ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-emerald-100 text-[#247153] font-semibold text-[10px] border border-emerald-300">
                                    <Check className="w-3 h-3" /> RESOLVED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-emerald-50 text-[#247153] font-medium text-[10px] border border-emerald-200">
                                    <Check className="w-3 h-3" /> PASS
                                  </span>
                                )}
                              </td>

                              <td className="py-2 px-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVariableModal({ mode: 'edit', name: field.name });
                                    }}
                                    disabled={!canReview}
                                    title={canReview ? 'Edit this variable' : 'The schema is approved; run the pipeline again to change variables'}
                                    aria-label={`Edit ${field.name}`}
                                    className="p-1 rounded-xs text-[#626263] hover:text-[#0B0B0C] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DISABLED: ER graph, Pandera AST and stage-log tabs showed fixed sample content and are not reachable from the UI
              {/ * TAB 2: INTERACTIVE ER GRAPH * /}
              {activeTab === 'graph' && (
                <div className="h-full border border-[#D3D2CE] rounded-xs bg-[#F1F0EC]/30 p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#626263]">
                    <span>Entity Relational Dependency Graph (DuckDB Physical Schema Mapping)</span>
                    <span className="font-mono text-[11px]">4 Core Nodes · 5 Relational Edges</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/ * Node 1: Subscriber Account * /}
                    <div className="bg-white border border-[#D3D2CE] rounded-xs p-3 ">
                      <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                        <span className="font-semibold text-xs text-[#0B0B0C]">tmf_subscriber_account</span>
                        <span className="text-[10px] font-mono text-[#E31837]">TMF 654</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-[#626263]">
                        <div className="flex justify-between">
                          <span className="text-[#0B0B0C] font-semibold">PK msisdn</span>
                          <span>VARCHAR(15)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>account_balance</span>
                          <span>DECIMAL(10,2)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>data_depletion_pct</span>
                          <span>FLOAT(4)</span>
                        </div>
                      </div>
                    </div>

                    {/ * Node 2: 5G CDR Stream * /}
                    <div className="bg-white border border-[#8A5200] rounded-xs p-3 ">
                      <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                        <span className="font-semibold text-xs text-[#0B0B0C]">cdr_telemetry_stream</span>
                        <span className="text-[10px] font-mono text-[#8A5200]">3GPP TS 32.298</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-[#626263]">
                        <div className="flex justify-between">
                          <span className="text-[#0B0B0C] font-semibold">FK msisdn</span>
                          <span className="text-emerald-700">1:N edge</span>
                        </div>
                        <div className="flex justify-between">
                          <span>cdr_event_raw</span>
                          <span className="text-amber-700 font-semibold">JSONB (Warning)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>network_slice_id</span>
                          <span>VARCHAR(32)</span>
                        </div>
                      </div>
                    </div>

                    {/ * Node 3: Product Ordering * /}
                    <div className="bg-white border border-[#D3D2CE] rounded-xs p-3 ">
                      <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                        <span className="font-semibold text-xs text-[#0B0B0C]">tmf_product_order</span>
                        <span className="text-[10px] font-mono text-[#185F8D]">TMF 622</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-[#626263]">
                        <div className="flex justify-between">
                          <span>order_id</span>
                          <span>UUID</span>
                        </div>
                        <div className="flex justify-between">
                          <span>topup_channel</span>
                          <span>USSD | APP</span>
                        </div>
                      </div>
                    </div>

                    {/ * Node 4: Churn Propensity * /}
                    <div className="bg-white border border-[#D3D2CE] rounded-xs p-3 ">
                      <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5 mb-2">
                        <span className="font-semibold text-xs text-[#0B0B0C]">churn_prediction_target</span>
                        <span className="text-[10px] font-mono text-purple-700">MEF LSO</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-[#626263]">
                        <div className="flex justify-between">
                          <span>churn_risk_score</span>
                          <span>FLOAT(3)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>hazard_rate</span>
                          <span>Weibull(λ=0.04)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/ * TAB 3: AST RULE MATRIX * /}
              {activeTab === 'ast' && (
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-[#D3D2CE] rounded-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0B0B0C]">Pandera Python AST Schema Spec</span>
                      <span className="text-[11px] font-mono text-[#247153]">12 Checks Active</span>
                    </div>
                    <pre className="p-2.5 bg-[#0B0B0C] text-emerald-400 rounded-xs text-[11px] font-mono leading-relaxed overflow-x-auto">
{`import pandera as pa
from pandera.typing import Series

class TelecomSyntheticSchema(pa.DataFrameModel):
    msisdn: Series[str] = pa.Field(str_matches=r'^\\+[1-9]\\d{9,14}$')
    account_balance: Series[float] = pa.Field(ge=0.0, le=2500.0)
    data_depletion_pct: Series[float] = pa.Field(ge=0.0, le=100.0)
    churn_risk_score: Series[float] = pa.Field(ge=0.0, le=1.0)

    @pa.check("cdr_event_raw")
    def validate_cdr_integrity(cls, series):
        # Stage 3 Flag: Enforces 3GPP Session Token linkage
        return series.apply(lambda x: "gNodeB_session_id" in x)`}
                    </pre>
                  </div>

                  {/ * Live AST Sandbox * /}
                  <div className="p-3 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs space-y-2">
                    <span className="text-xs font-semibold text-[#0B0B0C]">Interactive AST Expression Evaluator</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sandboxExpr}
                        onChange={e => setSandboxExpr(e.target.value)}
                        className="flex-1 p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
                      />
                      <input
                        type="text"
                        value={sandboxValue}
                        onChange={e => setSandboxValue(e.target.value)}
                        placeholder="Test val"
                        className="w-24 p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(sandboxValue);
                          const passed = !isNaN(val) && val >= 0;
                          setSandboxResult({
                            passed,
                            message: passed
                              ? `Pandera AST Check Evaluated: PASS (Value ${sandboxValue} satisfies constraint)`
                              : `Pandera AST Check Evaluated: FAIL (Negative value violates non_negative constraint)`
                          });
                        }}
                        className="px-3 py-1.5 bg-[#0B0B0C] text-white rounded-xs text-xs font-medium hover:bg-[#E31837]"
                      >
                        Eval AST
                      </button>
                    </div>
                    <div className={`p-2 rounded-xs text-xs font-mono border ${
                      sandboxResult.passed ? 'bg-emerald-50 text-[#247153] border-emerald-200' : 'bg-red-50 text-[#9C1936] border-red-200'
                    }`}>
                      {sandboxResult.message}
                    </div>
                  </div>
                </div>
              )}

              {/ * TAB 4: STAGE DETAILS & PIPELINE LOGS * /}
              {activeTab === 'stageDetails' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white border border-[#D3D2CE] rounded-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0B0B0C]">
                        Stage {activeStage} Execution Inspection
                      </span>
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-emerald-50 text-[#247153] border border-emerald-200">
                        STATUS: {stageStatuses[activeStage]}
                      </span>
                    </div>

                    {activeStage === 1 && (
                      <div className="space-y-2 text-[#626263]">
                        <p><strong>Dynamic Sub-Schema Extraction:</strong> RAG semantic vector similarity search against SID / TMF SQLite catalogue.</p>
                        <div className="p-2 bg-[#F1F0EC] rounded-xs font-mono text-[11px] space-y-1">
                          <div>Target SID Root: <code>TMF 622 ProductOrder / TMF 654 Bucket</code></div>
                          <div>Pruned Entities: 1,420 SID classes reduced to 4 focused domain models</div>
                          <div>Embedding Similarity Score: 0.941 Cosine</div>
                        </div>
                      </div>
                    )}

                    {activeStage === 2 && (
                      <div className="space-y-2 text-[#626263]">
                        <p><strong>Schema Synthesis & Parameterization:</strong> Gemini + Instructor + Pydantic v2 code generator output.</p>
                        <div className="p-2 bg-[#F1F0EC] rounded-xs font-mono text-[11px] space-y-1">
                          <div>Fitted Distributions: LogNormal(account_balance), Beta(data_depletion)</div>
                          <div>Synthesized Constraints: 6 Pydantic validators generated</div>
                          <div>Compilation Time: 142ms</div>
                        </div>
                      </div>
                    )}

                    {activeStage === 5 && (
                      <div className="space-y-2 text-[#626263]">
                        <p><strong>Final Data Contract Compilation:</strong> DuckDB Columnar table DDL & Arrow IPC buffer allocation.</p>
                        <div className="p-2 bg-[#F1F0EC] rounded-xs font-mono text-[11px] space-y-1">
                          <div>Engine Target: DuckDB In-Process Vector Engine</div>
                          <div>Target Buffer: Apache Arrow RecordBatch (Zero-Copy)</div>
                          <div>Output Format: Parquet with Snappy compression</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              */}
                </>
              )}
            </div>

            {/* Bottom Proceed Action Bar (on the generate step it is only needed again if the schema was changed after approval) */}
            <div className={`${workflowStep === 2 || !confirmed ? 'flex' : 'hidden'} h-12 min-h-12 border-t border-[#D3D2CE] bg-[#F1F0EC] px-4 items-center justify-end`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleApproveSchema()}
                  disabled={!pipelineRun || !draft || isConfirming}
                  className="wb-btn h-10 px-4 text-[13px] focus-techm"
                >
                  {isConfirming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Approving schema...</span>
                    </>
                  ) : (
                    <BtnLabel>{workflowStep === 2 ? 'Approve & continue to generate' : 'Approve changes'}</BtnLabel>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* =====================================================================
              PANE 3: MULTI-MODAL GENERATION & ENGINE TARGET (Hidden until Step 2 complete)
              ===================================================================== */}
          <section className={`${
            workflowStep !== 3 || maxUnlockedStep < 3 || pane3Collapsed
              ? 'hidden'
              : 'col-span-3 2xl:col-span-4'
          } h-full wb-pane flex flex-col bg-[#FFFFFF] border border-[#D3D2CE] rounded-xs overflow-hidden transition-all ${
            workflowStep === 3 ? 'border-t-2 border-t-[#E31837]' : ''
          }`}>
            {/* Pane Header */}
            {/* Scrollable Engine Parameters */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="pb-0">
                <p className="wb-cap text-[#626263]">Step 03 of 03</p>
                {/* The heading makes room for the results once data has been generated */}
                {!generated && (
                  <h2 className="mt-2 text-[22px] font-medium tracking-[-0.035em] leading-[1.08] text-[#0B0B0C]">
                    Choose how much data to generate.
                  </h2>
                )}
              </div>
              {/* Selected Modalities Status Indicator */}
              <div className="flex items-center justify-between p-2 rounded-xs bg-[#F1F0EC]/60 border border-[#D3D2CE] text-xs">
                <span className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                  Target Modalities
                </span>
                <div className="flex items-center gap-1">
                  {modalities.text && (
                    <span className="px-1.5 py-0.5 rounded-xs bg-[#247153]/10 text-[#247153] text-[10px] font-semibold flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> Unstructured Data
                    </span>
                  )}
                  {modalities.structured && (
                    <span className="px-1.5 py-0.5 rounded-xs bg-[#185F8D]/10 text-[#185F8D] text-[10px] font-semibold flex items-center gap-1">
                      <Table className="w-2.5 h-2.5" /> Structured Data
                    </span>
                  )}
                  {modalities.vision && (
                    <span className="px-1.5 py-0.5 rounded-xs bg-[#8A5200]/10 text-[#8A5200] text-[10px] font-semibold flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> Image
                    </span>
                  )}
                  {modalities.telemetry && (
                    <span className="px-1.5 py-0.5 rounded-xs bg-[#9C1936]/10 text-[#9C1936] text-[10px] font-semibold flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> Video
                    </span>
                  )}
                </div>
              </div>

              {/* Generation Parameters */}
              <div className="space-y-2.5 pt-1">
                {/* Volume: users (transactional) or rows (aggregational) */}
                {(() => {
                  const isTransactional = (confirmed ?? draft)?.typeOfData !== 'aggregational';
                  const volume = typeof recordCount === 'number' && recordCount > 0 ? recordCount : DEFAULT_RECORD_COUNT;
                  const perUser = typeof recordsPerUser === 'number' && recordsPerUser > 0 ? recordsPerUser : MAX_RECORDS_PER_USER;
                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor={recordCountInputId} className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                            {isTransactional ? 'Number of Users' : 'Record Volume'}
                          </label>
                          <div className="flex gap-1">
                            {RECORD_PRESETS.map(val => (
                              <button
                                key={val}
                                onClick={() => setRecordCount(val)}
                                className={`text-[10px] px-1.5 py-0.5 rounded-xs border cursor-pointer ${
                                  recordCount === val
                                    ? 'bg-[#0B0B0C] text-white border-[#0B0B0C]'
                                    : 'bg-white border-[#D3D2CE] text-[#626263]'
                                }`}
                              >
                                {val >= 1000 ? `${val / 1000}K` : val}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          id={recordCountInputId}
                          type="number"
                          value={recordCount}
                          placeholder={`Enter ${isTransactional ? 'number of users' : 'record volume'} (default ${DEFAULT_RECORD_COUNT.toLocaleString()})`}
                          min={1}
                          max={MAX_VOLUME}
                          onChange={e => setRecordCount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono tabular-nums text-[#0B0B0C] focus-techm"
                        />
                        <p className="mt-1 text-[10px] text-[#8F8F8D]">
                          Up to {MAX_VOLUME.toLocaleString()} {isTransactional ? 'users' : 'rows'} per run.
                        </p>
                      </div>

                      {isTransactional && (
                        <div>
                          <label htmlFor={recordsPerUserInputId} className="block text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] mb-1 font-mono">
                            Records per User
                          </label>
                          <input
                            id={recordsPerUserInputId}
                            type="number"
                            value={recordsPerUser}
                            min={1}
                            max={MAX_RECORDS_PER_USER}
                            onChange={e => setRecordsPerUser(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono tabular-nums text-[#0B0B0C] focus-techm"
                          />
                          <p className="mt-1 text-[10px] text-[#8F8F8D]">
                            Up to {MAX_RECORDS_PER_USER} history records per user. This run: {(volume * perUser).toLocaleString()} records.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* DISABLED: Reproducibility Seed: the seed is not offered for now (generation runs without one)
                {/ * Reproducibility Seed - Hidden by default using downward arrow option * /}
                <div className="rounded-xs border border-[#D3D2CE] bg-[#F1F0EC]/40 overflow-hidden transition-all">
                  {/ * Collapsible Trigger Row with Downward Arrow Option * /}
                  <div
                    onClick={() => setSeedSectionExpanded(prev => !prev)}
                    className="flex items-center justify-between p-2 bg-[#F1F0EC]/70 hover:bg-[#F1F0EC] cursor-pointer transition-colors select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSeedSectionExpanded(prev => !prev);
                      }
                    }}
                    aria-expanded={seedSectionExpanded}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#E31837]" />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                          Reproducibility Seed
                        </span>
                        {randomSeed !== '' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-[#E31837]/10 text-[#E31837] font-medium border border-[#E31837]/20">
                            Seed #{randomSeed}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSeedSectionExpanded(prev => !prev);
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#626263] hover:text-[#0B0B0C] px-1.5 py-0.5 rounded-xs hover:bg-white/80 transition-colors cursor-pointer"
                      title={seedSectionExpanded ? "Hide seed options" : "Show reproducibility seed options"}
                    >
                      <span>{seedSectionExpanded ? "Hide" : "Show Seed"}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#626263] transition-transform duration-200 ${
                          seedSectionExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/ * Seed Configuration Body - Kept hidden until expanded via downward arrow * /}
                  {seedSectionExpanded && (
                    <div className="p-2.5 pt-2 border-t border-[#D3D2CE] bg-white space-y-2 animate-in fade-in duration-150 relative">
                      <div className="flex items-center justify-between mb-0.5">
                        <label htmlFor={randomSeedInputId} className="text-[10px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                          Random Seed Value
                        </label>
                        <div className="flex items-center gap-1.5">
                          {/ * DISABLED: seed suggestions were fixed sample text
                          <button
                            type="button"
                            onClick={() => setShowSeedSuggestions(prev => !prev)}
                            className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                              showSeedSuggestions
                                ? 'bg-[#E31837] text-white border-[#E31837]'
                                : 'bg-[#F8F7F4] text-[#E31837] border-[#D3D2CE] hover:border-[#E31837]'
                            }`}
                            title="View recommended seeds calibrated for your selected record volume"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Seed Suggestions</span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-white/40 text-current border border-current/20">
                              {typeof recordCount === 'number' && recordCount > 0 ? (recordCount >= 1000 ? `${recordCount / 1000}K` : recordCount) : '100K'}
                            </span>
                          </button>
                          * /}
                          <button
                            type="button"
                            onClick={() => {
                              const newSeed = Math.floor(10000 + Math.random() * 90000);
                              setRandomSeed(newSeed);
                              showToast(`Generated random seed: ${newSeed}`);
                            }}
                            className="text-[10px] text-[#185F8D] hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Generate random 5-digit seed"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Re-roll
                          </button>
                        </div>
                      </div>

                      <input
                        id={randomSeedInputId}
                        type="number"
                        value={randomSeed}
                        placeholder="Optional seed (a whole number, 0 to 2147483647)"
                        onChange={e => setRandomSeed(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono tabular-nums text-[#0B0B0C] focus-techm"
                      />

                      {/ * DISABLED: volume-calibrated seed suggestions were fixed sample text; any seed reproduces the same dataset
                      {/ * Volume-calibrated inline seed suggestion pill * /}
                      {(() => {
                        const currentVol = typeof recordCount === 'number' && recordCount > 0 ? recordCount : 100000;
                        const topSuggested = getVolumeSeedSuggestions(recordCount)[0];
                        return (
                          <div className="flex items-center justify-between text-[10px] pt-0.5">
                            <span className="text-[#8F8F8D]">
                              Suggested for {currentVol.toLocaleString()} records:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRandomSeed(topSuggested.seed);
                                showToast(`Applied seed ${topSuggested.seed} (${topSuggested.tag}) calibrated for ${currentVol.toLocaleString()} records`);
                              }}
                              className="text-[#E31837] hover:underline font-mono font-medium flex items-center gap-1 cursor-pointer"
                              title="Apply volume-calibrated baseline seed"
                            >
                              <span>Seed {topSuggested.seed} ({topSuggested.tag})</span>
                              <span className="text-[9px] bg-[#E31837]/10 px-1 rounded-xs font-semibold">Apply</span>
                            </button>
                          </div>
                        );
                      })()}

                      {/ * Seed Suggestions Popup based on record volume * /}
                      {showSeedSuggestions && (
                        <div className="mt-1.5 p-2.5 bg-white border border-[#D3D2CE] rounded-xs shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] space-y-2 z-30 relative animate-in fade-in duration-150">
                          <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#E31837]" />
                              <span className="text-[11px] font-semibold text-[#0B0B0C]">
                                Seed Suggestions ({(typeof recordCount === 'number' && recordCount > 0 ? recordCount : 100000).toLocaleString()} Records)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSeedSuggestions(false)}
                              className="text-[#626263] hover:text-[#0B0B0C] p-0.5 rounded-xs cursor-pointer"
                              aria-label="Close seed suggestions"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/ * Quick Volume Switcher inside popup to test seed suggestions * /}
                          <div className="flex items-center justify-between bg-[#F1F0EC]/60 p-1.5 rounded-xs border border-[#D3D2CE] text-[10px]">
                            <span className="text-[#626263] font-medium">Test volume:</span>
                            <div className="flex gap-1">
                              {[10000, 50000, 100000, 500000].map(v => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => {
                                    setRecordCount(v);
                                    showToast(`Selected ${v >= 1000 ? `${v / 1000}K` : v} records for seed calibration`);
                                  }}
                                  className={`px-1.5 py-0.5 rounded-xs font-mono text-[9px] cursor-pointer transition-colors ${
                                    recordCount === v
                                      ? 'bg-[#E31837] text-white font-semibold'
                                      : 'bg-white text-[#626263] border border-[#D3D2CE] hover:border-[#0B0B0C]'
                                  }`}
                                >
                                  {v >= 1000 ? `${v / 1000}K` : v}
                                </button>
                              ))}
                            </div>
                          </div>

                          <p className="text-[10px] text-[#626263] leading-snug">
                            Calibrated PRNG seeds tailored for entropy and distribution variance at your chosen record volume:
                          </p>

                          <div className="space-y-1.5">
                            {getVolumeSeedSuggestions(recordCount).map(item => (
                              <button
                                key={item.seed}
                                type="button"
                                onClick={() => {
                                  setRandomSeed(item.seed);
                                  setShowSeedSuggestions(false);
                                  showToast(`Applied seed ${item.seed} (${item.tag})`);
                                }}
                                className="w-full text-left p-1.5 rounded-xs border border-[#D3D2CE] hover:border-[#E31837] hover:bg-[#F8F7F4] transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-medium text-xs text-[#0B0B0C] group-hover:text-[#E31837]">
                                      Seed {item.seed}
                                    </span>
                                    <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#F1F0EC] text-[#626263] border border-[#D3D2CE]">
                                      {item.tag}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-[#185F8D] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to Apply →
                                  </span>
                                </div>
                                <p className="text-[10px] text-[#626263] leading-tight">
                                  {item.desc}
                                </p>
                                {item.rationale && (
                                  <p className="text-[9px] text-[#8F8F8D] leading-tight mt-0.5 italic">
                                    <strong>Why this volume:</strong> {item.rationale}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>

                          <div className="pt-1.5 border-t border-[#D3D2CE] flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                const c = typeof recordCount === 'number' && recordCount > 0 ? recordCount : 100000;
                                const optimalSeed = Math.abs((c * 2654435761) % 89999 + 10000);
                                setRandomSeed(optimalSeed);
                                setShowSeedSuggestions(false);
                                showToast(`Applied volume-tuned seed ${optimalSeed}`);
                              }}
                              className="text-[10px] text-[#185F8D] hover:underline font-mono flex items-center gap-1 cursor-pointer"
                            >
                              <span>Auto-tune seed for volume</span>
                            </button>
                            <span className="text-[9px] text-[#8F8F8D] font-mono">Deterministic PRNG</span>
                          </div>
                        </div>
                      )}
                      * /}
                    </div>
                  )}
                </div>
                */}
              </div>

              {/* DISABLED for now: Quality Verification (the validation report of the generated dataset, POST /scenario/generate)
              <div className="mt-5 pt-3.5 border-t border-[#D3D2CE]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">
                    Quality Verification
                  </label>
                  {generated && (
                    <span className="text-[10px] font-mono text-[#626263]">
                      {(generated.validation_report.rows ?? generated.total_records).toLocaleString()} rows checked
                    </span>
                  )}
                </div>

                {(() => {
                  const report = generated?.validation_report;
                  const realism = report?.components?.realism;
                  const rowsChecked = report?.rows ?? generated?.total_records ?? 0;
                  const rowsFailed = report?.rows_failed ?? 0;
                  const failedInvariants = report?.invariants?.failed?.length ?? 0;

                  const qaParams = [
                    {
                      id: 'overall',
                      title: 'Overall Quality',
                      score: pct(report?.overall),
                      qualifies: report?.verdict === 'pass',
                      note: `Verdict: ${report?.verdict ?? 'n/a'}`
                    },
                    {
                      id: 'consistency',
                      title: 'Consistency',
                      score: pct(report?.components?.consistency),
                      qualifies: failedInvariants === 0,
                      note: `${report?.invariants?.evaluated ?? 0} rules checked, ${failedInvariants} failed`
                    },
                    {
                      id: 'clean_rows',
                      title: 'Clean Rows',
                      score: pct(report?.components?.clean_rows),
                      qualifies: rowsFailed === 0,
                      note: `${rowsFailed.toLocaleString()} of ${rowsChecked.toLocaleString()} rows failed a check`
                    },
                    {
                      id: 'realism',
                      title: 'Realism',
                      score: pct(realism),
                      qualifies: typeof realism === 'number' && realism >= 0.9,
                      note: 'Passes at 90.0% or higher'
                    }
                  ];

                  return (
                    <div className="grid grid-cols-2 gap-1.5">
                      {qaParams.map(param => {
                        const pending = !report;
                        const flagged = !pending && !param.qualifies;
                        return (
                          <div
                            key={param.id}
                            title={pending ? 'Run the data generation to see the quality report' : param.note}
                            className={`p-2 rounded-xs border relative transition-all ${
                              flagged
                                ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/50 '
                                : 'bg-[#F1F0EC] border-[#D3D2CE]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#626263] font-medium">{param.title}</span>
                              {pending ? (
                                <span className="text-[9px] font-mono text-[#8F8F8D]">PENDING</span>
                              ) : flagged ? (
                                <span className="flex items-center gap-0.5 text-[9px] font-mono font-medium text-[#8A5200] bg-amber-100 px-1 py-0.2 rounded-xs border border-amber-300">
                                  <AlertTriangle className="w-2.5 h-2.5 text-[#8A5200]" />
                                  <span>FAIL</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[9px] font-mono font-medium text-[#247153]">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>PASS</span>
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs font-mono font-semibold mt-1 ${
                                pending ? 'text-[#8F8F8D]' : flagged ? 'text-[#8A5200]' : 'text-[#247153]'
                              }`}
                            >
                              <span>{pending ? '—' : param.score}</span>
                            </div>
                            {!pending && <p className="mt-0.5 text-[9px] text-[#626263] leading-tight">{param.note}</p>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              */}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-3 border-t border-[#D3D2CE] bg-[#F1F0EC] space-y-2">
              {/* Primary Action Button: Execute Data Generation (Expanded to full width) */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => void handleExecuteEngine()}
                  disabled={isExecuting || !confirmed}
                  className="wb-btn w-full h-10 px-4 text-[13px] focus-techm"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="truncate">Generating...</span>
                    </>
                  ) : !confirmed ? (
                    <BtnLabel>Approve Schema First</BtnLabel>
                  ) : (
                    <BtnLabel>Execute Data Generation</BtnLabel>
                  )}
                </button>
              </div>

              {/* Completion Message when execution finishes without popup modal */}
              {isExecutionComplete && !isExecuting && generated && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xs flex items-center gap-2 text-xs text-[#247153] ">
                  <CheckCircle2 className="w-4 h-4 text-[#247153] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-[#247153]">Data Generation Complete</p>
                    <p className="text-[11px] text-[#247153]/85 truncate">
                      Successfully generated {generated.total_records.toLocaleString()} synthetic records.
                    </p>
                  </div>
                </div>
              )}

              {/* Download: offered once the data has been generated (CSV or JSON of the returned records) */}
              {isExecutionComplete && !isExecuting && generated && (
                <div className="bg-white p-2.5 rounded-xs border border-[#D3D2CE] space-y-2 ">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#E31837] shrink-0" />
                    <span className="text-[11px] font-medium text-[#626263] uppercase tracking-[0.06em] font-mono">Download Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={downloadFormat}
                      onChange={e => setDownloadFormat(e.target.value as DownloadFormat)}
                      className="flex-1 min-w-0 p-1.5 bg-[#F1F0EC] border border-[#D3D2CE] rounded-xs text-xs font-mono font-medium text-[#0B0B0C] focus-techm cursor-pointer"
                      aria-label="Select download data format"
                    >
                      <option value="csv">CSV (.csv)</option>
                      <option value="json">JSON (.json)</option>
                      {/* DISABLED: Parquet needs a server-side writer; the backend returns JSON records only
                      <option value="parquet">Parquet (.parquet)</option>
                      */}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDownloadSyntheticData()}
                      className="shrink-0 whitespace-nowrap px-3 py-1.5 bg-[#0B0B0C] hover:bg-[#626263] text-white rounded-xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer "
                      title={`Download the generated records as ${downloadFormat.toUpperCase()}`}
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Collapsed Right Side Panel with side arrow */}
          {pane3Collapsed && workflowStep === 3 && maxUnlockedStep >= 3 && (
            <div
              onClick={() => {
                setPane3Collapsed(false);
                showToast('Expanded right side panel');
              }}
              className="w-10 h-full bg-white border border-[#D3D2CE] rounded-xs flex flex-col items-center py-3 justify-between cursor-pointer hover:bg-[#F8F7F4] transition-colors shrink-0"
              title="Click side arrow to show right side panel"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPane3Collapsed(false);
                  showToast('Expanded right side panel');
                }}
                className="p-1 text-[#626263] hover:text-[#E31837] hover:bg-[#D3D2CE]/40 rounded-xs cursor-pointer transition-colors"
                title="Show right side panel"
              >
                <ChevronLeft className="w-4 h-4 text-[#E31837]" />
              </button>
              <span className="text-[10px] font-medium text-[#626263] [writing-mode:vertical-rl] rotate-180 uppercase tracking-[0.06em] flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-[#E31837] rotate-90" />
                <span>3. Core Data Generation</span>
              </span>
              <div className="w-2 h-2 rounded-full bg-[#E31837]" />
            </div>
          )}
        </main>
        </div>
        )}

        {/* View 2: Schema Contracts Repository */}
        {activeNav === 'contracts' && (
          <ContractsView
            onBack={() => setActiveNav('workbench')}
            onLoadContract={contract => {
              setActiveNav('workbench');
              showToast(`Opened the workbench for ${contract.title}. Pick its scenario in step 1.`);
            }}
            showToast={showToast}
          />
        )}

        {/* View 3: DKP Manager */}
        {activeNav === 'dkp' && (
          <DkpView
            onBack={() => setActiveNav('workbench')}
            onMount={pkgName => {
              setActiveNav('workbench');
              setActiveStage(1);
              showToast(`Mounted ${pkgName} into Pipeline Stage 1.`);
            }}
            showToast={showToast}
          />
        )}

        {/* View 4: Quality Gates & Pandera AST */}
        {activeNav === 'quality' && (
          <QualityGatesView
            onBack={() => setActiveNav('workbench')}
            onResolveWarnings={() => {
              handleApproveSchema();
              showToast('All AST quality warnings resolved & verified.');
            }}
            showToast={showToast}
          />
        )}

        {/* View 5: Compliance & Audit Logs */}
        {activeNav === 'audit' && (
          <AuditLogsView
            onBack={() => setActiveNav('workbench')}
            showToast={showToast}
          />
        )}

        {/* Settings View */}
        {activeNav === 'settings' && (
          <SettingsView
            onBack={() => setActiveNav('workbench')}
            showToast={showToast}
          />
        )}
      </div>

      {/* DISABLED: static execution preview (fixed sample rows); it was never opened by the UI
      {/ * =========================================================================
          EXECUTION RESULTS & DATA INSPECTOR DRAWER / MODAL
          ========================================================================= * /}
      {executionDrawerOpen && (
        <div className="fixed inset-0 wb-backdrop bg-[#0B0B0C]/40 z-50 flex items-center justify-center p-6 backdrop-blur-2xs">
          <div className="wb-modal bg-white border border-[#D3D2CE] rounded-xs shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] w-full max-w-4xl h-[520px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/ * Header * /}
            <div className="h-12 border-b border-[#D3D2CE] px-4 flex items-center justify-between bg-[#F1F0EC]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#E31837]" />
                <h3 className="font-semibold text-sm text-[#0B0B0C]">
                  Multi-Modal Engine Execution Preview · {(targetEngine || 'duckdb').toUpperCase()}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-xs bg-emerald-100 text-[#247153] border border-emerald-300">
                  {executionProgress === 100 ? 'COMPLETED' : 'STREAMING'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={downloadFormat}
                  onChange={e => setDownloadFormat(e.target.value as any)}
                  className="p-1 px-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono text-[#0B0B0C] focus-techm cursor-pointer"
                  title="Select download format"
                >
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
                <button
                  onClick={() => handleDownloadSyntheticData()}
                  className="px-2.5 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#0B0B0C] hover:border-[#0B0B0C] flex items-center gap-1 font-medium cursor-pointer "
                >
                  <Download className="w-3 h-3 text-[#E31837]" /> Download {downloadFormat.toUpperCase()}
                </button>
                <button
                  onClick={() => setExecutionDrawerOpen(false)}
                  className="p-1 rounded-xs text-[#626263] hover:text-[#0B0B0C] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/ * Execution Progress Bar * /}
            <div className="w-full bg-[#D3D2CE] h-1.5">
              <div
                className="bg-[#E31837] h-full transition-all duration-300"
                style={{ width: `${executionProgress}%` }}
              />
            </div>

            {/ * Content Tabs in Drawer * /}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between text-[#626263] mb-1.5">
                  <span className="font-semibold text-[#0B0B0C]">Sample Synthetic Records (First 5 Rows)</span>
                  <span className="text-[11px] tabular-nums">Total: {(recordCount || 100000).toLocaleString()} rows generated</span>
                </div>

                <div className="border border-[#D3D2CE] rounded-xs overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#F1F0EC] border-b border-[#D3D2CE] text-[#626263]">
                        <th className="p-2">msisdn</th>
                        <th className="p-2">account_balance</th>
                        <th className="p-2">data_depletion_pct</th>
                        <th className="p-2">churn_risk_score</th>
                        <th className="p-2">slice_id</th>
                        <th className="p-2">sim_status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D3D2CE]">
                      <tr>
                        <td className="p-2 text-[#0B0B0C] font-semibold">+14155550192</td>
                        <td className="p-2 tabular-nums">$14.20</td>
                        <td className="p-2 tabular-nums">98.4%</td>
                        <td className="p-2 tabular-nums text-[#9C1936] font-semibold">0.892 (High)</td>
                        <td className="p-2">eMBB-01</td>
                        <td className="p-2 text-emerald-700">ACTIVE</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[#0B0B0C] font-semibold">+14155550244</td>
                        <td className="p-2 tabular-nums">$120.00</td>
                        <td className="p-2 tabular-nums">12.1%</td>
                        <td className="p-2 tabular-nums text-emerald-700 font-semibold">0.041 (Low)</td>
                        <td className="p-2">URLLC-02</td>
                        <td className="p-2 text-emerald-700">ACTIVE</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[#0B0B0C] font-semibold">+14155550381</td>
                        <td className="p-2 tabular-nums">$2.50</td>
                        <td className="p-2 tabular-nums">99.8%</td>
                        <td className="p-2 tabular-nums text-[#9C1936] font-semibold">0.942 (Critical)</td>
                        <td className="p-2">eMBB-01</td>
                        <td className="p-2 text-amber-700">GRACE_PERIOD</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[#0B0B0C] font-semibold">+14155550419</td>
                        <td className="p-2 tabular-nums">$45.00</td>
                        <td className="p-2 tabular-nums">64.5%</td>
                        <td className="p-2 tabular-nums text-[#8A5200]">0.312 (Med)</td>
                        <td className="p-2">eMBB-01</td>
                        <td className="p-2 text-emerald-700">ACTIVE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/ * Unstructured Text Modality Sample * /}
              {modalities.text && (
                <div>
                  <div className="text-[#626263] font-semibold text-[#0B0B0C] mb-1">
                    Multi-Modal Output: Unstructured Customer Support Transcript Log
                  </div>
                  <div className="p-2.5 bg-[#F1F0EC] rounded-xs border border-[#D3D2CE] text-[11px] leading-relaxed text-[#0B0B0C]">
                    <span className="text-[#185F8D]">[2026-09-29T07:14:02Z] Subscriber +14155550192 (IVR):</span> "My 5G high-speed slice stopped working after reaching 98% balance depletion. Need auto-topup extension."<br/>
                    <span className="text-[#247153]">[2026-09-29T07:14:04Z] Telco Bot (TMF 622 API):</span> "Topup transaction initiated for bucket ID bkt_99214. Grace period applied."
                  </div>
                </div>
              )}

              {/ * Engine Log * /}
              <div>
                <div className="text-[#626263] font-semibold text-[#0B0B0C] mb-1">DuckDB Engine Query Stream Logs</div>
                <pre className="p-2 bg-[#0B0B0C] text-emerald-400 rounded-xs text-[10px] leading-tight">
{`SELECT msisdn, account_balance, data_depletion_pct, churn_risk_score
FROM parquet_scan('s3://synthetic-telco-bucket/run_42901/ *.parquet')
WHERE churn_risk_score > 0.85
LIMIT 5;
-- Returned 5 rows in 4.2ms. Differential Privacy Noise added: Laplace(b=0.02)`}
                </pre>
              </div>
            </div>

            {/ * Footer * /}
            <div className="h-10 border-t border-[#D3D2CE] px-4 flex items-center justify-between bg-[#F1F0EC] text-xs">
              <span className="text-[#626263]">All constraints, AST rules, and privacy bounds satisfied.</span>
              <button
                onClick={() => setExecutionDrawerOpen(false)}
                className="px-3 py-1 bg-[#0B0B0C] text-white rounded-xs text-xs font-medium hover:bg-[#E31837]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
      */}

      {/* =========================================================================
          GLOBAL SEARCH MODAL (CMD+K / CTRL+K)
          ========================================================================= */}
      {globalSearchOpen && (
        <div 
          onClick={() => setGlobalSearchOpen(false)}
          className="fixed inset-0 wb-backdrop bg-[#0B0B0C]/40 z-50 flex items-start justify-center pt-24 backdrop-blur-2xs"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="wb-modal bg-white border border-[#D3D2CE] rounded-xs shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] w-full max-w-lg overflow-hidden animate-in fade-in duration-100"
          >
            <div className="p-3 border-b border-[#D3D2CE] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#626263]" />
              <input
                type="text"
                autoFocus
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
                placeholder="Search contract fields..."
                className="w-full text-xs text-[#0B0B0C] outline-none"
              />
              <kbd className="text-[10px] font-mono bg-[#F1F0EC] text-[#626263] border border-[#D3D2CE] px-1.5 py-0.5 rounded-xs">
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto text-xs divide-y divide-[#D3D2CE]">
              {/* DISABLED: fixed list of standards (static data)
              <div className="py-1">
                <div className="text-[10px] uppercase font-mono text-[#626263] px-2 py-1">Standards Reference</div>
                {['TMF 622 Product Ordering', 'TMF 638 Service Inventory', '3GPP TS 32.298 5G CDR', 'BIAN v10 Payments', 'HL7 FHIR Patient']
                  .filter(s => s.toLowerCase().includes(globalSearchTerm.toLowerCase()))
                  .map(item => (
                    <button
                      key={item}
                      onClick={() => {
                        setGlobalSearchOpen(false);
                        showToast(`Selected standard: ${item}`);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-xs hover:bg-[#F1F0EC] flex items-center justify-between text-[#0B0B0C]"
                    >
                      <span>{item}</span>
                      <ChevronRight className="w-3 h-3 text-[#626263]" />
                    </button>
                  ))}
              </div>
              */}

              <div className="py-1">
                <div className="text-[10px] uppercase font-mono text-[#626263] px-2 py-1">Fields in Contract</div>
                {fields
                  .filter(f => f.name.toLowerCase().includes(globalSearchTerm.toLowerCase()))
                  .map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setGlobalSearchOpen(false);
                        setSelectedFieldId(f.id);
                        setActiveTab('table');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-xs hover:bg-[#F1F0EC] flex items-center justify-between font-mono"
                    >
                      <span className="font-semibold text-[#0B0B0C]">{f.name}</span>
                      <span className="text-[#626263] text-[11px]">{f.physicalType}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {variableModal && draft && (
        <VariableModal
          mode={variableModal.mode}
          access={variableModal.mode === 'add' ? 'full' : accessOf(variableModal.name)}
          variable={variableModal.mode === 'edit' ? variableFor(variableModal.name) : undefined}
          columnNames={fields.map(f => f.name)}
          transactional={draft.typeOfData !== 'aggregational'}
          onSave={handleSaveVariable}
          onClose={() => setVariableModal(null)}
        />
      )}

      {/* DISABLED: editing a field's constraints is not backed by the API yet
      {/ * =========================================================================
          EDIT FIELD MODAL
          ========================================================================= * /}
      {editingField && (
        <div className="fixed inset-0 wb-backdrop bg-[#0B0B0C]/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="wb-modal bg-white border border-[#D3D2CE] rounded-xs shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3D2CE] pb-2">
              <h3 className="text-xs font-semibold text-[#0B0B0C]">
                Edit Constraints: {editingField.name}
              </h3>
              <button onClick={() => setEditingField(null)} aria-label="Close edit field dialog" className="text-[#626263] hover:text-[#0B0B0C]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#626263] uppercase">Physical Type</label>
                <input
                  type="text"
                  value={editingField.physicalType}
                  onChange={e => setEditingField({ ...editingField, physicalType: e.target.value })}
                  className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#626263] uppercase">Constraints / Range Expression</label>
                <input
                  type="text"
                  value={editingField.constraints}
                  onChange={e => setEditingField({ ...editingField, constraints: e.target.value })}
                  className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs font-mono focus-techm"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#626263] uppercase">Sensitivity Level</label>
                <select
                  value={editingField.sensitivity}
                  onChange={e => setEditingField({ ...editingField, sensitivity: e.target.value as any })}
                  className="w-full p-1.5 bg-white border border-[#D3D2CE] rounded-xs text-xs focus-techm"
                >
                  <option value="Operational">Operational</option>
                  <option value="PII / Masked">PII / Masked</option>
                  <option value="Financial">Financial</option>
                  <option value="Synthetic Target">Synthetic Target</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D3D2CE]">
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-1 text-xs border border-[#D3D2CE] rounded-xs bg-white text-[#626263]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setFields(prev => prev.map(f => (f.id === editingField.id ? editingField : f)));
                  setEditingField(null);
                  showToast(`Updated constraints for ${editingField.name}`);
                }}
                className="px-3 py-1 text-xs bg-[#E31837] text-white rounded-xs font-medium "
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      */}

      {/* DISABLED: recommended-variables dialog: static variable list, not backed by the API yet
      {/ * =========================================================================
          RECOMMEND SCENARIO VARIABLES MODAL (From Screenshot)
          ========================================================================= * /}
      {showRecommendModal && (
        <div className="fixed inset-0 wb-backdrop bg-[#0B0B0C]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="wb-modal bg-white rounded-xs max-w-4xl w-full shadow-[0_24px_60px_-24px_rgba(11,11,12,.5)] border border-[#D3D2CE] p-6 max-h-[92vh] flex flex-col overflow-hidden text-[#1E1E21]">
            {/ * Header * /}
            <div className="flex items-start justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0B0B0C]" />
                  <h2 className="text-base font-semibold text-[#0B0B0C] tracking-tight">
                    Recommend Scenario Variables
                  </h2>
                </div>
                <p className="text-xs text-[#6C6C6B] mt-1 leading-normal">
                  Select the variables you want to persist as recommended variables. Click the checkbox or row, use the arrows, or drag variables between panels.
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs border border-[#D3D2CE] bg-[#F8F7F4] text-[11px] font-mono text-[#3D3D3F] mt-2 font-medium">
                  requestedScenarioId: <span className="font-semibold text-[#0B0B0C]">LB-01</span>
                </div>
              </div>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="w-8 h-8 rounded-xs border border-[#D3D2CE] hover:bg-[#EDECE8] flex items-center justify-center text-[#6C6C6B] hover:text-[#1E1E21] transition-colors cursor-pointer shrink-0 ml-3"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/ * Dual Panel Body with Middle Action Arrows * /}
            <div className="flex-1 overflow-hidden grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-2 min-h-0">
              
              {/ * Left Panel: Available Variables * /}
              <div className="h-full flex flex-col border border-[#D3D2CE] rounded-xs p-3.5 bg-white overflow-hidden ">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-[#0B0B0C]">Available Variables</h3>
                    <p className="text-[11px] text-[#8F8F8D]">{filteredAvailable.length} available</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-[#EDECE8] text-[#3D3D3F] rounded-xs">
                    {filteredAvailable.length}
                  </span>
                </div>

                {/ * Search Available * /}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-[#8F8F8D] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchAvailable}
                    onChange={e => setSearchAvailable(e.target.value)}
                    placeholder="Search variables..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#D3D2CE] rounded-xs focus:outline-none focus:border-[#8F8F8D] placeholder:text-[#8F8F8D]"
                  />
                </div>

                {/ * Scrollable list of Available Variable cards * /}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredAvailable.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-[#8F8F8D] text-xs">
                      No available variables match search
                    </div>
                  ) : (
                    filteredAvailable.map(variable => {
                      const isSelected = selectedAvailableIds.has(variable.id);
                      return (
                        <div
                          key={variable.id}
                          onClick={() => {
                            setSelectedAvailableIds(prev => {
                              const next = new Set(prev);
                              if (next.has(variable.id)) next.delete(variable.id);
                              else next.add(variable.id);
                              return next;
                            });
                          }}
                          className={`p-3 rounded-xs border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-[#0B0B0C] bg-[#F8F7F4]/70 ring-1 ring-[#0B0B0C] '
                              : 'border-[#D3D2CE] bg-white hover:border-[#BDBDB9] hover:bg-[#F8F7F4]/30'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled by outer div onClick
                              className="mt-0.5 rounded-xs text-[#0B0B0C] focus:ring-[#0B0B0C] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5 mb-1">
                                <span className="font-mono text-xs font-medium text-[#0B0B0C] truncate">
                                  {variable.name}
                                </span>
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs border border-[#D3D2CE] text-[#6C6C6B] uppercase shrink-0">
                                  {variable.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#6C6C6B] leading-snug font-sans">
                                {variable.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/ * Middle Transfer Buttons * /}
              <div className="flex flex-col gap-2 items-center px-1">
                {/ * >> Move all to right * /}
                <button
                  type="button"
                  onClick={handleMoveAllToRecommended}
                  disabled={availableVars.length === 0}
                  className="w-8 h-8 rounded-xs bg-[#0B0B0C] hover:bg-[#1E1E21] disabled:opacity-40 disabled:hover:bg-[#0B0B0C] text-white flex items-center justify-center transition-colors cursor-pointer "
                  title="Move all available to recommended"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                {/ * → Move selected to right * /}
                <button
                  type="button"
                  onClick={handleMoveSelectedToRecommended}
                  disabled={selectedAvailableIds.size === 0}
                  className="w-8 h-8 rounded-xs border border-[#D3D2CE] hover:bg-[#EDECE8] disabled:opacity-40 text-[#626263] flex items-center justify-center transition-colors cursor-pointer bg-white"
                  title="Move selected to recommended"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/ * ← Move selected to left * /}
                <button
                  type="button"
                  onClick={handleMoveSelectedToAvailable}
                  disabled={selectedRecommendedIds.size === 0}
                  className="w-8 h-8 rounded-xs border border-[#D3D2CE] hover:bg-[#EDECE8] disabled:opacity-40 text-[#626263] flex items-center justify-center transition-colors cursor-pointer bg-white"
                  title="Move selected to available"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/ * << Move all to left * /}
                <button
                  type="button"
                  onClick={handleMoveAllToAvailable}
                  disabled={recommendedVars.length === 0}
                  className="w-8 h-8 rounded-xs border border-rose-200 text-rose-400 hover:bg-rose-50 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer bg-white"
                  title="Move all recommended back to available"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>

              {/ * Right Panel: Recommended Variables * /}
              <div className="h-full flex flex-col border border-[#D3D2CE] rounded-xs p-3.5 bg-white overflow-hidden ">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-[#0B0B0C]">Recommended Variables</h3>
                    <p className="text-[11px] text-[#8F8F8D]">{filteredRecommended.length} selected</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-[#EDECE8] text-[#3D3D3F] rounded-xs">
                    {filteredRecommended.length}
                  </span>
                </div>

                {/ * Search Recommended * /}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-[#8F8F8D] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchRecommended}
                    onChange={e => setSearchRecommended(e.target.value)}
                    placeholder="Search selected..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#D3D2CE] rounded-xs focus:outline-none focus:border-[#8F8F8D] placeholder:text-[#8F8F8D]"
                  />
                </div>

                {/ * Scrollable list of Recommended Variable cards * /}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {recommendedVars.length === 0 ? (
                    <div className="h-full min-h-[220px] flex items-center justify-center text-[#8F8F8D] text-xs font-medium text-center p-6">
                      Select variables on the left, then click the right arrow.
                    </div>
                  ) : filteredRecommended.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-[#8F8F8D] text-xs">
                      No recommended variables match search
                    </div>
                  ) : (
                    filteredRecommended.map(variable => {
                      const isSelected = selectedRecommendedIds.has(variable.id);
                      return (
                        <div
                          key={variable.id}
                          onClick={() => {
                            setSelectedRecommendedIds(prev => {
                              const next = new Set(prev);
                              if (next.has(variable.id)) next.delete(variable.id);
                              else next.add(variable.id);
                              return next;
                            });
                          }}
                          className={`p-3 rounded-xs border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-[#0B0B0C] bg-[#F8F7F4]/70 ring-1 ring-[#0B0B0C] '
                              : 'border-[#D3D2CE] bg-white hover:border-[#BDBDB9] hover:bg-[#F8F7F4]/30'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 rounded-xs text-[#0B0B0C] focus:ring-[#0B0B0C] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5 mb-1">
                                <span className="font-mono text-xs font-medium text-[#0B0B0C] truncate">
                                  {variable.name}
                                </span>
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-xs border border-[#D3D2CE] text-[#6C6C6B] uppercase shrink-0">
                                  {variable.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#6C6C6B] leading-snug font-sans">
                                {variable.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/ * Modal Footer * /}
            <div className="pt-3 border-t border-[#D3D2CE] flex items-center justify-between text-xs mt-1">
              <span className="text-[#626263]">
                <strong className="text-[#0B0B0C] font-semibold">{recommendedVars.length}</strong> recommended out of{' '}
                <strong className="text-[#0B0B0C] font-semibold">{AVAILABLE_SCENARIO_VARIABLES.length}</strong> selectable variables
              </span>

              <button
                type="button"
                onClick={handleApplyRecommended}
                className="px-5 py-2.5 rounded-xs bg-[#6C6C6B] hover:bg-[#626263] text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommend Selected Variables</span>
              </button>
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  );
}