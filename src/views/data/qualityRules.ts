
export interface AstRuleItem {
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

export const INITIAL_AST_RULES: AstRuleItem[] = [
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

