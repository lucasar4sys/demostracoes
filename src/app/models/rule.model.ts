export type PaymentMethod = 'cartao' | 'pix' | 'voucher' | 'boleto';

export type RuleLogic = 'AND' | 'OR';

export type RuleAction = 'APPROVE' | 'REVIEW' | 'DECLINE';

export type RuleLayer = '1st' | '2nd';

export interface Store {
  id: string;
  name: string;
  isGlobal?: boolean;
}

export interface ClauseParameter {
  id: string;
  name: string;
  operators: string[];
  defaultValue?: string | number;
}

export interface RuleClause {
  id: string;
  parameterId: string;
  parameterName: string;
  operator: string;
  value: string | number;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  storeId: string; // 'ALL' = Global rule for all stores
  storeName: string;
  payments: PaymentMethod[];
  logic: RuleLogic;
  action: RuleAction;
  layer: RuleLayer;
  priority: number;
  ghostMode: boolean;
  active: boolean;
  clauses: RuleClause[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSimulation {
  storeId: string;
  paymentMethod: PaymentMethod;
  orderValue: number;
  installments: number;
  cardBin: string;
  cardCountry: string;
  voucherPercent: number;
  sameCountryDelivery: string;
  customerEmail: string;
  attempts24h: number;
  riskScore: number;
}

export interface RuleMatchResult {
  rule: Rule;
  matched: boolean;
  clauseResults: { clause: RuleClause; passed: boolean }[];
  effectiveAction: RuleAction;
  isGhost: boolean;
}

export interface SimulationResult {
  finalDecision: RuleAction | 'NEUTRAL';
  matchedRules: RuleMatchResult[];
  ghostRulesTriggered: RuleMatchResult[];
  explanation: string;
}
