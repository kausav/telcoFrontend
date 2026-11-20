import { type DomainType } from '../../workspace/types';

export interface DkpPackageItem {
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

export const DKP_PACKAGES: DkpPackageItem[] = [
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

