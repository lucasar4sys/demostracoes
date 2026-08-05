export type PaymentMethod = 'cartao' | 'pix' | 'voucher' | 'boleto';

export type RuleLogic = 'AND' | 'OR';

export type RuleAction = 'APPROVE' | 'REVIEW' | 'DECLINE';

export type RuleLayer = '1st' | '2nd';

export type RuleStatus = 'DRAFT' | 'SIMULATED' | 'GHOST_ACTIVE' | 'APPROVED' | 'ACTIVE';

export type UserRole = 'AUDITOR' | 'ANALISTA' | 'GESTOR';

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
  
  // Novas propriedades regulatórias (CMN 4.966 e LGPD)
  status: RuleStatus;
  ticketPrd: string;
  ghostStartedAt?: string; // ISO string ou timestamp de quando o Ghost Mode foi ativado
  authorName: string;
  approverName?: string;
  approvalJustification?: string;
  approvalSnapshot?: string; // Snapshot JSON imutável
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
  deviceFingerprintSeen?: string; // 'SIM' | 'NÃO'
  locationDiverges?: string;      // 'SIM' | 'NÃO'
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

export interface AuditLog {
  id: string;
  ruleId: string;
  ruleName: string;
  action: 'CREATE' | 'SIMULATE' | 'GHOST_START' | 'APPROVE' | 'ACTIVATE' | 'DEACTIVATE' | 'UPDATE';
  user: string;
  userRole: UserRole;
  timestamp: string;
  details: string;
  snapshot?: string; // JSON String do estado imutável da regra no momento do log
}

export interface BacktestResult {
  analyzedCount: number;
  impactedCount: number;
  impactedPercent: number;
  estimatedFraudPrevention: number;
  falsePositivePercent: number;
  sazonalidadeAlert: boolean;
  sazonalidadeDetails?: string;
}
