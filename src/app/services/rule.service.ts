import { Injectable, signal, computed } from '@angular/core';
import { 
  Rule, 
  Store, 
  ClauseParameter, 
  PaymentMethod, 
  RuleAction,
  TransactionSimulation, 
  SimulationResult, 
  RuleMatchResult 
} from '../models/rule.model';

@Injectable({
  providedIn: 'root',
})
export class RuleService {
  // Available stores
  readonly stores = signal<Store[]>([
    { id: 'ALL', name: 'Todas as Lojas', isGlobal: true },
    { id: 'store-1', name: 'Loja de Treinamentos' },
    { id: 'store-2', name: 'Loja E-Commerce Matriz' },
    { id: 'store-3', name: 'Loja Filial Rio de Janeiro' }
  ]);

  // Selected store context in topbar ("Todas as Lojas" vs specific store)
  readonly selectedStoreId = signal<string>('ALL');

  // Currently selected store object
  readonly currentStore = computed(() => {
    const id = this.selectedStoreId();
    return this.stores().find(s => s.id === id) || this.stores()[0];
  });

  // Search filter query
  readonly searchQuery = signal<string>('');

  // Toast message notification signal
  readonly toastMessage = signal<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Available clause parameters
  readonly availableParameters = signal<ClauseParameter[]>([
    { id: 'param-1', name: 'Número de parcelas', operators: ['==', '!=', '>', '<', '>=', '<='], defaultValue: 6 },
    { id: 'param-2', name: 'País de emissão do cartão', operators: ['==', '!=', 'contém'], defaultValue: 'BRASIL' },
    { id: 'param-3', name: 'BIN do cartão de crédito', operators: ['==', '!=', 'começa com', 'contém'], defaultValue: '453211' },
    { id: 'param-4', name: 'Percentual do valor total pago com voucher', operators: ['==', '!=', '>', '<', '>='], defaultValue: 50 },
    { id: 'param-5', name: 'País do cartão x país de entrega', operators: ['==', '!='], defaultValue: 'Diferentes' },
    { id: 'param-6', name: 'Valor total do pedido (R$)', operators: ['>', '<', '>=', '<=', '=='], defaultValue: 1500 },
    { id: 'param-7', name: 'E-mail do comprador', operators: ['contém', 'termina com', '=='], defaultValue: '@tempmail.com' },
    { id: 'param-8', name: 'Tentativas de pagamento em 24h', operators: ['>', '>=', '=='], defaultValue: 3 },
    { id: 'param-10', name: 'Score de Risco Antifraude (0-100)', operators: ['>', '>=', '<', '<='], defaultValue: 80 }
  ]);

  // Initial Mock Rules based on antifraud portal specifications
  private readonly defaultRules: Rule[] = [
    {
      id: 'rule-101',
      name: 'Regra Global de Checagem País de Entrega x Cartão',
      description: 'Encaminha para revisão manual pedidos onde o país de emissão do cartão difere do país de entrega do comprador',
      storeId: 'ALL',
      storeName: 'Todas as Lojas',
      payments: ['cartao', 'pix'],
      logic: 'AND',
      action: 'REVIEW',
      layer: '1st',
      priority: 1,
      ghostMode: false,
      active: true,
      clauses: [
        {
          id: 'clause-1',
          parameterId: 'param-5',
          parameterName: 'País do cartão x país de entrega',
          operator: '==',
          value: 'Diferentes'
        }
      ],
      createdAt: '01/08/2022 16:08',
      updatedAt: '03/08/2022 14:22'
    },
    {
      id: 'rule-102',
      name: 'Bloqueio de Compras com Múltiplos Vouchers e Parcelamento Alto',
      description: 'Gera recomendação de NEGAR quando houver suspeita em compras acima de 10x com mais de 50% pago via voucher',
      storeId: 'ALL',
      storeName: 'Todas as Lojas',
      payments: ['cartao', 'voucher'],
      logic: 'AND',
      action: 'DECLINE',
      layer: '1st',
      priority: 2,
      ghostMode: true,
      active: true,
      clauses: [
        {
          id: 'clause-2',
          parameterId: 'param-1',
          parameterName: 'Número de parcelas',
          operator: '>',
          value: 10
        },
        {
          id: 'clause-3',
          parameterId: 'param-4',
          parameterName: 'Percentual do valor total pago com voucher',
          operator: '>=',
          value: 50
        }
      ],
      createdAt: '15/05/2023 10:15',
      updatedAt: '20/06/2023 11:40'
    },
    {
      id: 'rule-103',
      name: 'Aprovação Rápida Pix - Loja de Treinamentos',
      description: 'Aprova automaticamente compras via Pix de baixo valor na loja de treinamentos',
      storeId: 'store-1',
      storeName: 'Loja de Treinamentos',
      payments: ['pix'],
      logic: 'AND',
      action: 'APPROVE',
      layer: '1st',
      priority: 3,
      ghostMode: false,
      active: true,
      clauses: [
        {
          id: 'clause-4',
          parameterId: 'param-6',
          parameterName: 'Valor total do pedido (R$)',
          operator: '<',
          value: 300
        }
      ],
      createdAt: '10/01/2024 09:00',
      updatedAt: '12/01/2024 14:10'
    },
    {
      id: 'rule-104',
      name: 'Bloqueio de BINs de Alto Risco e Múltiplas Tentativas',
      description: 'Negativa transações com mais de 3 tentativas nas últimas 24h em cartões de BINs específicos',
      storeId: 'ALL',
      storeName: 'Todas as Lojas',
      payments: ['cartao'],
      logic: 'OR',
      action: 'DECLINE',
      layer: '2nd',
      priority: 4,
      ghostMode: false,
      active: true,
      clauses: [
        {
          id: 'clause-5',
          parameterId: 'param-8',
          parameterName: 'Tentativas de pagamento em 24h',
          operator: '>',
          value: 3
        },
        {
          id: 'clause-6',
          parameterId: 'param-3',
          parameterName: 'BIN do cartão de crédito',
          operator: '==',
          value: '453211'
        }
      ],
      createdAt: '18/03/2024 11:30',
      updatedAt: '18/03/2024 11:30'
    },
    {
      id: 'rule-105',
      name: 'Revisão por E-mail Temporário / Descartável',
      description: 'Direciona para análise manual pedidos com e-mails temporários',
      storeId: 'store-2',
      storeName: 'Loja E-Commerce Matriz',
      payments: ['cartao', 'pix', 'boleto', 'voucher'],
      logic: 'AND',
      action: 'REVIEW',
      layer: '1st',
      priority: 5,
      ghostMode: false,
      active: true,
      clauses: [
        {
          id: 'clause-7',
          parameterId: 'param-7',
          parameterName: 'E-mail do comprador',
          operator: 'contém',
          value: '@tempmail.com'
        }
      ],
      createdAt: '05/04/2024 15:45',
      updatedAt: '05/04/2024 15:45'
    }
  ];

  readonly rules = signal<Rule[]>(this.loadRules());

  // Computed: filtered rules based on store context and search query
  readonly filteredRules = computed(() => {
    const storeId = this.selectedStoreId();
    const query = this.searchQuery().toLowerCase().trim();
    const allRules = this.rules();

    return allRules.filter(rule => {
      // Store scope filter: if store selected is specific (e.g., store-1), show rules matching store-1 OR global rules ('ALL')
      const matchesStore = storeId === 'ALL' ? true : (rule.storeId === 'ALL' || rule.storeId === storeId);
      
      // Search text filter
      const matchesQuery = !query || 
        rule.name.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.id.toLowerCase().includes(query);

      return matchesStore && matchesQuery;
    });
  });

  constructor() {}

  private loadRules(): Rule[] {
    const saved = localStorage.getItem('antifraud_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback to defaults
      }
    }
    return this.defaultRules;
  }

  private saveRules(rules: Rule[]) {
    this.rules.set(rules);
    localStorage.setItem('antifraud_rules', JSON.stringify(rules));
  }


  showToast(text: string, type: 'success' | 'info' | 'warning' = 'success') {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  setSelectedStore(storeId: string) {
    this.selectedStoreId.set(storeId);
  }

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  getRuleById(id: string): Rule | undefined {
    return this.rules().find(r => r.id === id);
  }

  toggleRuleStatus(id: string) {
    const updated = this.rules().map(r => {
      if (r.id === id) {
        const nextState = !r.active;
        this.showToast(`Regra "${r.name}" foi ${nextState ? 'ativada' : 'desativada'} com sucesso!`, 'info');
        return {
          ...r,
          active: nextState,
          updatedAt: this.formatCurrentDate()
        };
      }
      return r;
    });
    this.saveRules(updated);
  }

  saveRule(ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Rule {
    const currentList = this.rules();
    const nowStr = this.formatCurrentDate();

    if (ruleData.id) {
      // Edit existing
      const updated = currentList.map(r => {
        if (r.id === ruleData.id) {
          return {
            ...r,
            ...ruleData,
            updatedAt: nowStr
          } as Rule;
        }
        return r;
      });
      this.saveRules(updated);
      this.showToast(`Regra "${ruleData.name}" atualizada com sucesso!`, 'success');
      return updated.find(r => r.id === ruleData.id)!;
    } else {
      // Create new
      const newId = `rule-${Date.now().toString().slice(-4)}`;
      const newRule: Rule = {
        ...ruleData,
        id: newId,
        createdAt: nowStr,
        updatedAt: nowStr
      };
      const updated = [newRule, ...currentList];
      this.saveRules(updated);
      this.showToast(`Regra "${newRule.name}" criada com sucesso!`, 'success');
      return newRule;
    }
  }

  deleteRule(id: string) {
    const target = this.getRuleById(id);
    const updated = this.rules().filter(r => r.id !== id);
    this.saveRules(updated);
    if (target) {
      this.showToast(`Regra "${target.name}" foi excluída.`, 'warning');
    }
  }

  duplicateRule(id: string): Rule | undefined {
    const source = this.getRuleById(id);
    if (!source) return undefined;

    const duplicated: Rule = {
      ...source,
      id: `rule-${Date.now().toString().slice(-4)}`,
      name: `${source.name} (Cópia)`,
      createdAt: this.formatCurrentDate(),
      updatedAt: this.formatCurrentDate()
    };

    this.saveRules([duplicated, ...this.rules()]);
    this.showToast(`Regra "${source.name}" foi duplicada com sucesso!`, 'success');
    return duplicated;
  }

  resetToDefaultRules() {
    this.saveRules(this.defaultRules);
    this.showToast('Regras redefinidas para o padrão da demonstração!', 'info');
  }

  /**
   * Antifraud Simulation Engine for testing rules in real time
   */
  evaluateTransaction(sim: TransactionSimulation): SimulationResult {
    const activeRules = this.rules()
      .filter(r => r.active)
      .filter(r => r.storeId === 'ALL' || r.storeId === sim.storeId)
      .filter(r => r.payments.includes(sim.paymentMethod))
      .sort((a, b) => a.priority - b.priority);

    const matchedRules: RuleMatchResult[] = [];
    const ghostRulesTriggered: RuleMatchResult[] = [];
    let finalDecision: RuleAction | 'NEUTRAL' = 'NEUTRAL';

    for (const rule of activeRules) {
      const clauseResults = rule.clauses.map(clause => {
        const passed = this.checkClauseCondition(clause, sim);
        return { clause, passed };
      });

      let rulePassed = false;
      if (clauseResults.length > 0) {
        if (rule.logic === 'AND') {
          rulePassed = clauseResults.every(cr => cr.passed);
        } else {
          rulePassed = clauseResults.some(cr => cr.passed);
        }
      }

      if (rulePassed) {
        const matchResult: RuleMatchResult = {
          rule,
          matched: true,
          clauseResults,
          effectiveAction: rule.action,
          isGhost: rule.ghostMode
        };

        if (rule.ghostMode) {
          ghostRulesTriggered.push(matchResult);
        } else {
          matchedRules.push(matchResult);
          // High priority decision assignment (DECLINE overrides REVIEW overrides APPROVE if priority ordered)
          if (finalDecision === 'NEUTRAL') {
            finalDecision = rule.action;
          } else if (rule.action === 'DECLINE') {
            finalDecision = 'DECLINE';
          } else if (rule.action === 'REVIEW' && finalDecision === 'APPROVE') {
            finalDecision = 'REVIEW';
          }
        }
      }
    }

    let explanation = '';
    if (matchedRules.length === 0) {
      explanation = 'Nenhuma regra de bloqueio ou decisão direta foi acionada. O pedido segue fluxo normal de análise de inteligência de risco.';
    } else {

      const topRule = matchedRules[0];
      explanation = `Regra de maior prioridade (#${topRule.rule.priority} - "${topRule.rule.name}") definiu a decisão como ${topRule.rule.action}.`;
    }

    return {
      finalDecision,
      matchedRules,
      ghostRulesTriggered,
      explanation
    };
  }

  private checkClauseCondition(clause: any, sim: TransactionSimulation): boolean {
    let transactionVal: any = null;

    switch (clause.parameterId) {
      case 'param-1': // Parcelas
        transactionVal = sim.installments;
        break;
      case 'param-2': // País de emissão
        transactionVal = sim.cardCountry;
        break;
      case 'param-3': // BIN
        transactionVal = sim.cardBin;
        break;
      case 'param-4': // % Voucher
        transactionVal = sim.voucherPercent;
        break;
      case 'param-5': // País do cartão x país de entrega
        transactionVal = sim.sameCountryDelivery;
        break;
      case 'param-6': // Valor total
        transactionVal = sim.orderValue;
        break;
      case 'param-7': // Email
        transactionVal = sim.customerEmail;
        break;
      case 'param-8': // Tentativas
        transactionVal = sim.attempts24h;
        break;
      case 'param-10': // Risk score
        transactionVal = sim.riskScore;
        break;
      default:
        return false;
    }

    const op = clause.operator;
    const clauseVal = clause.value;

    // Numerical comparison
    if (typeof transactionVal === 'number' || (!isNaN(Number(transactionVal)) && !isNaN(Number(clauseVal)))) {
      const numTx = Number(transactionVal);
      const numClause = Number(clauseVal);
      if (op === '==') return numTx === numClause;
      if (op === '!=') return numTx !== numClause;
      if (op === '>') return numTx > numClause;
      if (op === '>=') return numTx >= numClause;
      if (op === '<') return numTx < numClause;
      if (op === '<=') return numTx <= numClause;
    }

    // String comparison
    const strTx = String(transactionVal).toLowerCase();
    const strClause = String(clauseVal).toLowerCase();

    if (op === '==') return strTx === strClause;
    if (op === '!=') return strTx !== strClause;
    if (op === 'contém') return strTx.includes(strClause);
    if (op === 'começa com') return strTx.startsWith(strClause);
    if (op === 'termina com') return strTx.endsWith(strClause);

    return false;
  }

  private formatCurrentDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }
}
