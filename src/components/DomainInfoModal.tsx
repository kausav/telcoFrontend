import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  TelecomDomainLogo,
  BfsiDomainLogo,
  HealthcareDomainLogo,
  ManufacturingDomainLogo,
  TrustSafetyDomainLogo
} from './DomainLogos';

export interface SubdomainProgress {
  name: string;
  status: 'CERTIFIED' | 'IN_PROGRESS' | 'ROADMAP';
  journeysCount: number;
  scenariosCount: number;
  summary: string;
  keyDeliverables: string[];
}

export interface DomainInfoData {
  id: string;
  name: string;
  category: string;
  overview: string;
  architecture: string[];
  totalWorkDonePercent: number;
  subdomains: SubdomainProgress[];
}

export const DOMAIN_INFO_DETAILS: Record<string, DomainInfoData> = {
  telecom: {
    id: 'telecom',
    name: 'Telecommunication',
    category: '5G Core, Charging & Digital OSS/BSS',
    overview:
      'Telecommunication synthetic data models high-velocity 5G standalone networks, subscriber lifecycle events, charging data records (CDRs), and TM Forum Open Digital Architecture. It accurately synthesizes slice handoffs, prepaid balance exhaustion, quota refills, and QoS policy flows with zero privacy leakage.',
    architecture: ['3GPP Rel-17 TS 32.298', 'TM Forum SID v22.5', 'TMF 622', 'TMF 654', 'GSMA RCC.07', 'MEF LSO'],
    totalWorkDonePercent: 78,
    subdomains: [
      {
        name: 'Prepaid Customer Lifecycle & Top-ups',
        status: 'CERTIFIED',
        journeysCount: 3,
        scenariosCount: 25,
        summary: 'Fully implemented and certified prepaid account management, data depletion alerts, and payment gateway retry latency.',
        keyDeliverables: [
          'TMF 654 real-time bucket reloading and balance thresholds',
          '25 calibrated business scenarios (LB-01 to LB-25)',
          'E.164 MSISDN pseudonymization with HMAC salt',
          'Pandera AST schema constraints and deterministic seed generation'
        ]
      },
      {
        name: '5G Core Network Slicing & QoS Telemetry',
        status: 'IN_PROGRESS',
        journeysCount: 2,
        scenariosCount: 14,
        summary: 'Synthesizing multi-tenant slice orders and high-frequency charging telemetry for eMBB, URLLC, and mIoT.',
        keyDeliverables: [
          'TMF 622 Product Ordering specification mapping',
          'gNodeB session handoff CDR telemetry generation',
          'Simulated 5G QoS Flow and bandwidth depletion curves'
        ]
      },
      {
        name: 'B2B Enterprise Postpaid Accounts & Hierarchy',
        status: 'ROADMAP',
        journeysCount: 1,
        scenariosCount: 8,
        summary: 'Corporate multi-tier hierarchy, aggregated bucket pooling, and automated invoice milestone generation.',
        keyDeliverables: [
          'TMF 638 Service Inventory integration architecture',
          'Enterprise pooled data quota exhaustion modeling',
          'Batch invoicing and multi-tenant ledger synchronization'
        ]
      }
    ]
  },
  bfsi: {
    id: 'bfsi',
    name: 'BFSI & Payments',
    category: 'Interbank Settlement, Core Banking & AML',
    overview:
      'Banking, Financial Services, and Insurance (BFSI) encompasses high-throughput interbank clearing, ISO 20022 settlement messaging, real-time sanctions screening, anti-money laundering (AML) pattern synthesis, and algorithmic credit underwriting.',
    architecture: ['ISO 20022 (pacs.008)', 'BIAN v10.0', 'Open Banking v3.1', 'PCI-DSS v4.0', 'FATF Travel Rule'],
    totalWorkDonePercent: 72,
    subdomains: [
      {
        name: 'Instant Wire & Sanctions Screening (pacs.008)',
        status: 'CERTIFIED',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Interbank credit transfer contract with calibrated AML anomaly splits, PEP fuzzy naming, and sanctions screening tags.',
        keyDeliverables: [
          'ISO 20022 pacs.008 credit transfer envelope generation',
          '8% structured smurfing anomalies for AML model training',
          'PEP (Politically Exposed Persons) name fuzzy matching variations',
          'IBAN Mod-97 checksum validation and BIAN invariants'
        ]
      },
      {
        name: 'Credit Decisioning & KYC Underwriting',
        status: 'IN_PROGRESS',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Risk scoring models for credit cards, personal loans, and thin-file underwritten applicants.',
        keyDeliverables: [
          'Thin-file and alternative data underwriting profiles',
          'Synthetic identity burst pattern detection records',
          'Adverse action threshold statistical calibrations'
        ]
      },
      {
        name: 'Trade Finance & Documentary Collections',
        status: 'ROADMAP',
        journeysCount: 1,
        scenariosCount: 4,
        summary: 'Multi-party international trade documentation, letters of credit, and bill of lading reconciliation.',
        keyDeliverables: [
          'SWIFT MT700 and pacs interoperability specs',
          'Container shipping invoice matching invariants',
          'Export credit risk distribution synthesis'
        ]
      }
    ]
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    category: 'Clinical EHR, Observations & Clinical Trials',
    overview:
      'Healthcare and Life Sciences manages longitudinal electronic health records (EHR), HL7 FHIR clinical encounter resources, diagnostic observation vitals, clinical trial participant cohort generation, and HIPAA Safe Harbor de-identification.',
    architecture: ['HL7 FHIR US-Core v4.3', 'DICOM PS3.x', 'CDISC ODM v1.3', 'HIPAA Safe Harbor', 'SNOMED CT', 'LOINC'],
    totalWorkDonePercent: 68,
    subdomains: [
      {
        name: 'Clinical Encounter & Vital Telemetry (FHIR R4)',
        status: 'CERTIFIED',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Longitudinal FHIR encounter bundles, diagnostic observations, LOINC vital telemetry, and HIPAA Safe Harbor masking.',
        keyDeliverables: [
          'Patient, Encounter, and Observation resource bundle synthesis',
          'ICU septic shock escalation hazard target generation',
          'Systolic blood pressure and heart rate distribution mapping',
          'Strict differential privacy epsilon=0.5 calibration'
        ]
      },
      {
        name: 'Clinical Trial Cohort Matching & Protocols',
        status: 'IN_PROGRESS',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Synthetic patient cohorts matched against inclusion/exclusion criteria for oncology and rare disease protocols.',
        keyDeliverables: [
          'Oncology Protocol Arm A eligibility generation',
          'Biomarker inclusion filters (HER2, EGFR, KRAS mutations)',
          'MedDRA adverse event synthetic distribution drift'
        ]
      },
      {
        name: 'Diagnostic Imaging & DICOM Metadata',
        status: 'ROADMAP',
        journeysCount: 1,
        scenariosCount: 4,
        summary: 'Anonymized radiology study series, modality metadata, and segmentation mask tags.',
        keyDeliverables: [
          'DICOM PS3.x CT/MRI accession series simulation',
          'Radiological observation report synthesis',
          'Multi-site scanner artifact noise injection'
        ]
      }
    ]
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing & Industry 4.0',
    category: 'Industrial IoT, OPC UA & Robotics',
    overview:
      'Industrial IoT & Industry 4.0 delivers telemetry for smart factory automation, CNC spindle vibration spectral analysis, predictive maintenance models, AGV robotic warehouse navigation, and ISA-95 equipment hierarchy mapping.',
    architecture: ['OPC UA Part 4', 'ISA-95 Enterprise', 'MTConnect v2.0', 'MQTT-Sparkplug B', 'ISO 13374'],
    totalWorkDonePercent: 65,
    subdomains: [
      {
        name: 'CNC Spindle Predictive Maintenance',
        status: 'CERTIFIED',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'High-frequency OPC UA vibration harmonics, bearing fatigue curves, and thermal runaway failure prediction.',
        keyDeliverables: [
          'OPC UA Part 4 node telemetry with ISO 13374 vibration metrics',
          'Bearing fluting harmonic resonance failure patterns',
          'Steady-state high RPM thermal variance calibration',
          'ISA-95 Level 2/3 equipment hierarchy metadata'
        ]
      },
      {
        name: 'Autonomous AGV Fleet Navigation Telemetry',
        status: 'IN_PROGRESS',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Automated Guided Vehicle telemetry in smart warehousing environments.',
        keyDeliverables: [
          'Warehouse path routing coordinate series generation',
          'LiDAR occlusion deadlocks and obstacle detection logs',
          'Lithium-ion battery discharge and thermal degradation curves'
        ]
      },
      {
        name: 'Assembly Line Vision Quality Control',
        status: 'ROADMAP',
        journeysCount: 1,
        scenariosCount: 5,
        summary: 'Surface finish defect classification, robotic pick-and-place precision telemetry, and cycle time drift.',
        keyDeliverables: [
          'PLC cycle time and conveyor encoder telemetry',
          'Dimensional tolerance anomaly generation',
          'Edge MQTT-Sparkplug B payload telemetry contracts'
        ]
      }
    ]
  },
  trust_safety: {
    id: 'trust_safety',
    name: 'Trust & Safety',
    category: 'AI Safety, Red-Teaming & Fraud Detection',
    overview:
      'Trust & Safety provides red-teaming benchmarks, harmful content moderation traces, multi-modal prompt injection resistance, account takeover (ATO) fraud patterns, and compliance with the EU AI Act and NIST AI Risk Management Framework.',
    architecture: ['NIST AI RMF 1.0', 'EU AI Act Tier-2', 'IEEE 7000 Ethics', 'ISO/IEC 42001', 'CIPA Privacy'],
    totalWorkDonePercent: 70,
    subdomains: [
      {
        name: 'Harmful Content & Adversarial Moderation',
        status: 'CERTIFIED',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Multimodal red-teaming prompt injection vectors, toxicity drift, and coordinated inauthentic behavior traces.',
        keyDeliverables: [
          'Multi-modal prompt injection jailbreak telemetry patterns',
          'Toxicity and hate speech semantic distribution drift',
          'Coordinated inauthentic bot network interaction graphs',
          'NIST AI RMF safety threshold auditing traces'
        ]
      },
      {
        name: 'Account Takeover (ATO) & Fraud Rings',
        status: 'IN_PROGRESS',
        journeysCount: 1,
        scenariosCount: 3,
        summary: 'Synthetic authentication telemetry with credential stuffing cascades and device fingerprint mismatches.',
        keyDeliverables: [
          'Device fingerprint mismatch anomaly vectors',
          'Credential stuffing velocity cascade records',
          'Synthetic bot cluster session timing signatures'
        ]
      },
      {
        name: 'Algorithmic Fairness & Bias Auditing',
        status: 'ROADMAP',
        journeysCount: 1,
        scenariosCount: 4,
        summary: 'Demographic parity compliance audit logs and disparate impact assessment datasets.',
        keyDeliverables: [
          'Protected attribute parity variance calculations',
          'Counterfactual synthetic fairness test sets',
          'EU AI Act Tier-2 compliance governance traces'
        ]
      }
    ]
  }
};

interface DomainInfoModalProps {
  domainKey: string | null;
  onClose: () => void;
  onSelectDomain?: (domain: string) => void;
  isSelected?: boolean;
}

export const DomainInfoModal: React.FC<DomainInfoModalProps> = ({
  domainKey,
  onClose,
  onSelectDomain,
  isSelected = false
}) => {
  if (!domainKey || !DOMAIN_INFO_DETAILS[domainKey]) return null;

  const data = DOMAIN_INFO_DETAILS[domainKey];

  const getLogo = () => {
    switch (domainKey) {
      case 'telecom':
        return <TelecomDomainLogo className="w-8 h-8" />;
      case 'bfsi':
        return <BfsiDomainLogo className="w-8 h-8" />;
      case 'healthcare':
        return <HealthcareDomainLogo className="w-8 h-8" />;
      case 'manufacturing':
        return <ManufacturingDomainLogo className="w-8 h-8" />;
      case 'trust_safety':
        return <TrustSafetyDomainLogo className="w-8 h-8" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-[#E5DFD3] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E5DFD3] bg-[#FDFBF7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E5DFD3] shadow-xs flex items-center justify-center text-[#E31837] shrink-0">
              {getLogo()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#29251D]">
                  {data.name}
                </h3>
                {isSelected && (
                  <span className="text-[10px] bg-[#E31837] text-white font-mono font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C5954] font-medium">{data.category}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#5C5954] hover:text-[#29251D] hover:bg-[#E5DFD3]/50 flex items-center justify-center transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-[#29251D]">
          
          {/* Section 1: What this domain actually is */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4D4D4F] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#E31837]" />
                <span>What this Industry Domain Actually Is</span>
              </h4>
              <span className="text-[11px] font-mono text-[#247153] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                {data.totalWorkDonePercent}% Pipeline Coverage
              </span>
            </div>
            <p className="text-xs sm:text-[13px] leading-relaxed text-[#4D4D4F] bg-[#F6F2EA] p-3.5 rounded-xl border border-[#E5DFD3]">
              {data.overview}
            </p>

            {/* Architecture Standards Badges */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-[#8E8B82] uppercase tracking-wider block mb-1.5">
                Governing Standards & Protocols
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {data.architecture.map((std) => (
                  <span
                    key={std}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white border border-[#E5DFD3] text-[#29251D] shadow-2xs"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Currently how many sub domain wise work has been done */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4D4D4F] flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#E31837]" />
                <span>Sub-Domain Wise Implementation Status & Work Done</span>
              </h4>
              <span className="text-[10px] font-mono text-[#8E8B82]">
                {data.subdomains.length} Sub-Domains Scoped
              </span>
            </div>

            <div className="space-y-3">
              {data.subdomains.map((sub, idx) => {
                const isCertified = sub.status === 'CERTIFIED';
                const isInProgress = sub.status === 'IN_PROGRESS';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCertified
                        ? 'bg-[#FDFBF7] border-[#E5DFD3] shadow-2xs'
                        : isInProgress
                          ? 'bg-[#FFFFFF] border-[#E5DFD3] shadow-2xs'
                          : 'bg-[#F9F6F0]/60 border-[#E5DFD3]/70 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[#29251D] flex items-center gap-1.5">
                          <span>{sub.name}</span>
                        </h5>
                        <p className="text-[11px] text-[#5C5954] mt-0.5">{sub.summary}</p>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isCertified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#15803D] bg-[#DCFCE7] border border-[#86EFAC] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                            Certified ({sub.scenariosCount} Scenarios)
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-[#B45309]" />
                            In Progress ({sub.scenariosCount} Scenarios)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#64748B] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-full">
                            Architecture Spec
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key Deliverables Bullet List */}
                    <div className="mt-2.5 pt-2 border-t border-[#E5DFD3]/70 space-y-1">
                      <span className="text-[10px] font-semibold text-[#8E8B82] uppercase tracking-wider block">
                        Work Done & Specifications:
                      </span>
                      {sub.keyDeliverables.map((deliv, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-1.5 text-[11px] text-[#4D4D4F]">
                          <span className="text-[#E31837] font-bold text-[10px] leading-tight">•</span>
                          <span className="leading-tight">{deliv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#E5DFD3] bg-[#FDFBF7] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-[#8E8B82]">
            ModelOS Enterprise Domain Catalog v2.4
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#E5DFD3] bg-white text-xs font-semibold text-[#4D4D4F] hover:bg-[#F6F2EA] transition-colors cursor-pointer"
            >
              Close
            </button>
            {onSelectDomain && (
              <button
                onClick={() => {
                  onSelectDomain(domainKey);
                  onClose();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#247153] text-white'
                    : 'bg-[#E31837] hover:bg-[#b5122b] text-white shadow-xs'
                }`}
              >
                <span>{isSelected ? 'Currently Selected' : `Select ${data.name}`}</span>
                {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
