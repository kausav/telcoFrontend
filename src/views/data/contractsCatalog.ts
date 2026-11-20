import { type DomainType } from '../../workspace/types';

export interface ContractItem {
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

export const CONTRACTS_CATALOG: ContractItem[] = [
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

