import { Injectable, signal, computed } from '@angular/core';
import { 
  Rule, 
  Store, 
  ClauseParameter, 
  PaymentMethod, 
  RuleAction,
  RuleLogic,
  RuleLayer,
  TransactionSimulation, 
  SimulationResult, 
  RuleMatchResult,
  RuleStatus,
  UserRole,
  AuditLog,
  BacktestResult
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

  // RBAC Profile State
  readonly currentUserRole = signal<UserRole>('GESTOR'); // Inicia como GESTOR para facilitar a demonstração inicial

  // Users Mapping for RBAC
  private readonly userProfiles: Record<UserRole, { name: string; email: string }> = {
    GESTOR: { name: 'Lucas Ribeiro', email: 'lucas.ribeiro@foursys.com.br' },
    ANALISTA: { name: 'Mariana Silva', email: 'mariana.silva@foursys.com.br' },
    AUDITOR: { name: 'Carlos Mendes', email: 'carlos.mendes@foursys.com.br' }
  };

  readonly currentUser = computed(() => {
    const role = this.currentUserRole();
    return {
      role,
      ...this.userProfiles[role]
    };
  });

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
    { id: 'param-10', name: 'Score de Risco Antifraude (0-100)', operators: ['>', '>=', '<', '<='], defaultValue: 80 },
    { id: 'param-11', name: 'Device fingerprint já visto em outra conta', operators: ['=='], defaultValue: 'SIM' },
    { id: 'param-12', name: 'Localização diverge do histórico do comprador', operators: ['=='], defaultValue: 'SIM' }
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
      updatedAt: '03/08/2022 14:22',
      status: 'ACTIVE',
      ticketPrd: 'PRD-101',
      authorName: 'Administrador'
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
      updatedAt: '20/06/2023 11:40',
      status: 'ACTIVE',
      ticketPrd: 'PRD-102',
      authorName: 'Administrador'
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
      updatedAt: '12/01/2024 14:10',
      status: 'ACTIVE',
      ticketPrd: 'PRD-103',
      authorName: 'Administrador'
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
      updatedAt: '18/03/2024 11:30',
      status: 'ACTIVE',
      ticketPrd: 'PRD-104',
      authorName: 'Administrador'
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
      updatedAt: '05/04/2024 15:45',
      status: 'ACTIVE',
      ticketPrd: 'PRD-105',
      authorName: 'Administrador'
    },
    {
      id: 'rule-106',
      name: 'Suspeita Device Fingerprint + Geoloc Divergente',
      description: 'Detecta e encaminha para Análise Manual (REVISAR) pedidos onde o device fingerprint já foi registrado em outra conta de comprador E a geolocalização do pedido diverge do histórico habitual.',
      storeId: 'ALL',
      storeName: 'Todas as Lojas',
      payments: ['cartao', 'pix', 'voucher'],
      logic: 'AND',
      action: 'REVIEW',
      layer: '1st',
      priority: 6,
      ghostMode: true,
      active: false,
      clauses: [
        {
          id: 'clause-106-1',
          parameterId: 'param-11',
          parameterName: 'Device fingerprint já visto em outra conta',
          operator: '==',
          value: 'SIM'
        },
        {
          id: 'clause-106-2',
          parameterId: 'param-12',
          parameterName: 'Localização diverge do histórico do comprador',
          operator: '==',
          value: 'SIM'
        }
      ],
      createdAt: '05/08/2026 10:00',
      updatedAt: '05/08/2026 10:00',
      status: 'DRAFT',
      ticketPrd: 'PRD-2026',
      authorName: 'Mariana Silva' // Criada por Mariana Silva (Analista) para demonstrar Duplo Controle pelo Lucas Ribeiro (Gestor)
    }
  ];

  readonly rules = signal<Rule[]>(this.loadRules());

  // Trilha de auditoria imutável
  readonly auditLogs = signal<AuditLog[]>(this.loadAuditLogs());

  // Computed: filtered rules based on store context and search query
  readonly filteredRules = computed(() => {
    const storeId = this.selectedStoreId();
    const query = this.searchQuery().toLowerCase().trim();
    const allRules = this.rules();

    return allRules.filter(rule => {
      // Store scope filter
      const matchesStore = storeId === 'ALL' ? true : (rule.storeId === 'ALL' || rule.storeId === storeId);
      
      // Search text filter
      const matchesQuery = !query || 
        rule.name.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query) ||
        rule.id.toLowerCase().includes(query);

      return matchesStore && matchesQuery;
    });
  });

  constructor() {
    // Regrava regras normalizadas para migrar localStorage antigo/incompleto.
    this.saveRules(this.rules());

    // Inicializa logs de auditoria se estiverem vazios
    if (this.auditLogs().length === 0) {
      const initialLogs: AuditLog[] = [
        {
          id: 'audit-1',
          ruleId: 'rule-101',
          ruleName: 'Regra Global de Checagem País de Entrega x Cartão',
          action: 'CREATE',
          user: 'Sistema Antifraude',
          userRole: 'GESTOR',
          timestamp: '01/08/2022 16:08',
          details: 'Criação inicial da regra padrão de conformidade geográfica.'
        }
      ];
      this.saveAuditLogs(initialLogs);
    }
  }

  private loadRules(): Rule[] {
    const saved = localStorage.getItem('antifraud_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .map((rule, index) => this.normalizeRule(rule, index))
            .filter((rule): rule is Rule => Boolean(rule));

          if (normalized.length > 0) {
            return normalized;
          }
        }
      } catch {
        // fallback
      }
    }
    return this.cloneDefaultRules();
  }

  private cloneDefaultRules(): Rule[] {
    return this.defaultRules.map(rule => ({
      ...rule,
      payments: [...rule.payments],
      clauses: rule.clauses.map(clause => ({ ...clause }))
    }));
  }

  private normalizeRule(candidate: unknown, index: number): Rule | null {
    if (!candidate || typeof candidate !== 'object') return null;

    const raw = candidate as Partial<Rule>;
    const fallback = this.defaultRules.find(rule => rule.id === raw.id) ?? this.defaultRules[index] ?? this.defaultRules[0];
    const id = this.textOr(raw.id, fallback?.id ?? `rule-recovered-${index + 1}`);

    return {
      id,
      name: this.textOr(raw.name, fallback?.name ?? `Regra recuperada #${index + 1}`),
      description: this.textOr(raw.description, fallback?.description ?? 'Regra recuperada automaticamente a partir dos dados salvos.'),
      storeId: this.textOr(raw.storeId, fallback?.storeId ?? 'ALL'),
      storeName: this.textOr(raw.storeName, fallback?.storeName ?? 'Todas as Lojas'),
      payments: this.normalizePayments(raw.payments, fallback?.payments),
      logic: this.normalizeLogic(raw.logic, fallback?.logic),
      action: this.normalizeAction(raw.action, fallback?.action),
      layer: this.normalizeLayer(raw.layer, fallback?.layer),
      priority: this.numberOr(raw.priority, fallback?.priority ?? index + 1),
      ghostMode: this.booleanOr(raw.ghostMode, fallback?.ghostMode ?? false),
      active: this.booleanOr(raw.active, fallback?.active ?? false),
      clauses: this.normalizeClauses(raw.clauses, fallback?.clauses),
      createdAt: this.textOr(raw.createdAt, fallback?.createdAt ?? this.formatCurrentDate()),
      updatedAt: this.textOr(raw.updatedAt, fallback?.updatedAt ?? this.formatCurrentDate()),
      status: this.normalizeStatus(raw.status, fallback?.status),
      ticketPrd: this.textOr(raw.ticketPrd, fallback?.ticketPrd ?? `PRD-${100 + index}`),
      ghostStartedAt: this.optionalText(raw.ghostStartedAt),
      authorName: this.textOr(raw.authorName, fallback?.authorName ?? 'Administrador'),
      approverName: this.optionalText(raw.approverName),
      approvalJustification: this.optionalText(raw.approvalJustification),
      approvalSnapshot: this.optionalText(raw.approvalSnapshot)
    };
  }

  private textOr(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  }

  private optionalText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private numberOr(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private booleanOr(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  private normalizePayments(value: unknown, fallback: PaymentMethod[] = ['cartao']): PaymentMethod[] {
    const validPayments: PaymentMethod[] = ['cartao', 'pix', 'voucher', 'boleto'];
    const payments = Array.isArray(value)
      ? value.filter((item): item is PaymentMethod => validPayments.includes(item))
      : [];

    return payments.length > 0 ? payments : [...fallback];
  }

  private normalizeLogic(value: unknown, fallback: RuleLogic = 'AND'): RuleLogic {
    return value === 'AND' || value === 'OR' ? value : fallback;
  }

  private normalizeAction(value: unknown, fallback: RuleAction = 'REVIEW'): RuleAction {
    return value === 'APPROVE' || value === 'REVIEW' || value === 'DECLINE' ? value : fallback;
  }

  private normalizeLayer(value: unknown, fallback: RuleLayer = '1st'): RuleLayer {
    return value === '1st' || value === '2nd' ? value : fallback;
  }

  private normalizeStatus(value: unknown, fallback: RuleStatus = 'DRAFT'): RuleStatus {
    const statuses: RuleStatus[] = ['DRAFT', 'SIMULATED', 'GHOST_ACTIVE', 'APPROVED', 'ACTIVE'];
    return statuses.includes(value as RuleStatus) ? value as RuleStatus : fallback;
  }

  private normalizeClauses(value: unknown, fallback: Rule['clauses'] = []): Rule['clauses'] {
    const clauses = Array.isArray(value)
      ? value
          .filter(clause => clause && typeof clause === 'object')
          .map((clause, index) => {
            const raw = clause as Partial<Rule['clauses'][number]>;
            const fallbackClause = fallback[index];

            return {
              id: this.textOr(raw.id, fallbackClause?.id ?? `clause-recovered-${index + 1}`),
              parameterId: this.textOr(raw.parameterId, fallbackClause?.parameterId ?? 'param-11'),
              parameterName: this.textOr(raw.parameterName, fallbackClause?.parameterName ?? 'Parâmetro recuperado'),
              operator: this.textOr(raw.operator, fallbackClause?.operator ?? '=='),
              value: raw.value ?? fallbackClause?.value ?? 'SIM'
            };
          })
      : [];

    return clauses.length > 0 ? clauses : fallback.map(clause => ({ ...clause }));
  }

  private saveRules(rules: Rule[]) {
    this.rules.set(rules);
    localStorage.setItem('antifraud_rules', JSON.stringify(rules));
  }

  private loadAuditLogs(): AuditLog[] {
    const saved = localStorage.getItem('antifraud_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return [];
  }

  private saveAuditLogs(logs: AuditLog[]) {
    this.auditLogs.set(logs);
    localStorage.setItem('antifraud_audit_logs', JSON.stringify(logs));
  }

  // Adiciona logs de auditoria de forma imutável (apenas adiciona ao topo)
  addAuditLog(ruleId: string, ruleName: string, action: AuditLog['action'], details: string, snapshot?: string) {
    const user = this.currentUser();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ruleId,
      ruleName,
      action,
      user: `${user.name} (${user.email})`,
      userRole: user.role,
      timestamp: this.formatCurrentDate(),
      details,
      snapshot
    };
    const current = this.loadAuditLogs();
    this.saveAuditLogs([newLog, ...current]);
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

  // Verifica se o usuário tem permissão para transações de escrita geral
  canWrite(): boolean {
    const user = this.currentUser();
    if (user.role === 'AUDITOR') {
      this.showToast('Permissão negada: O perfil Auditor possui acesso estritamente de visualização.', 'warning');
      return false;
    }
    return true;
  }

  // Verifica se o usuário tem permissão para ativar ou desativar regras em produção
  canChangeActiveStatus(): boolean {
    if (!this.canWrite()) return false;
    const user = this.currentUser();
    if (user.role === 'ANALISTA') {
      this.showToast('Bloqueio de Alçada: Analista de Prevenção não possui permissão para ativar ou desativar regras diretamente.', 'warning');
      return false;
    }
    return true;
  }

  // Ativar ou desativar regras padrão ativas (Toggle simples na lista)
  toggleRuleStatus(id: string) {
    if (!this.canChangeActiveStatus()) return;

    const updated = this.rules().map(r => {
      if (r.id === id) {
        // Se a regra for rule-106, precisa de governança
        if (id === 'rule-106' && r.status !== 'ACTIVE' && r.status !== 'APPROVED') {
          this.showToast('Trava de Segurança: A regra combinada precisa transcorrer 24h em Ghost Mode e ser aprovada antes de ativar.', 'warning');
          return r;
        }

        const nextState = !r.active;
        this.addAuditLog(
          r.id, 
          r.name, 
          nextState ? 'ACTIVATE' : 'DEACTIVATE', 
          `Mundança de estado de ativação para ${nextState ? 'ATIVA' : 'INATIVA'} via painel geral.`
        );
        this.showToast(`Regra "${r.name}" foi ${nextState ? 'ativada' : 'desativada'} com sucesso!`, 'info');
        return {
          ...r,
          active: nextState,
          status: nextState ? 'ACTIVE' : r.status,
          updatedAt: this.formatCurrentDate()
        } as Rule;
      }
      return r;
    });
    this.saveRules(updated);
  }

  // Salvar/Editar Regra (Do formulário)
  saveRule(ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'authorName'> & { id?: string; status?: RuleStatus; authorName?: string }): Rule {
    if (!this.canWrite()) {
      throw new Error('Acesso negado.');
    }

    // Validações de limites do PRD
    if (ruleData.name.length < 10 || ruleData.name.length > 100) {
      this.showToast('Erro de validação: O nome da regra deve possuir entre 10 e 100 caracteres.', 'warning');
      throw new Error('Nome inválido.');
    }

    if (!ruleData.ticketPrd || !/^PRD-[0-9]+$/.test(ruleData.ticketPrd)) {
      this.showToast('Erro de validação: Ticket PRD/Jira é obrigatório e deve conter o formato "PRD-XXXX".', 'warning');
      throw new Error('Ticket inválido.');
    }

    const currentList = this.rules();
    const nowStr = this.formatCurrentDate();
    const user = this.currentUser();

    if (ruleData.id) {
      // Editar existente
      const existing = this.getRuleById(ruleData.id);
      if (!existing) {
        throw new Error('Regra não encontrada.');
      }

      // Se a regra estiver em GHOST_ACTIVE ou SIMULATED, ao alterar as cláusulas, deve retornar para DRAFT e resetar tempo de Ghost Mode (TC-DN04-03)
      let nextStatus = existing.status;
      let ghostStarted = existing.ghostStartedAt;
      
      const clauseChanged = JSON.stringify(existing.clauses) !== JSON.stringify(ruleData.clauses) ||
                             existing.logic !== ruleData.logic;

      if (clauseChanged && (existing.status === 'GHOST_ACTIVE' || existing.status === 'SIMULATED' || existing.status === 'APPROVED')) {
        nextStatus = 'DRAFT';
        ghostStarted = undefined;
        this.showToast('Aviso: Como houve alteração lógica de cláusulas, o tempo em Ghost Mode foi resetado e a regra voltou para rascunho (DRAFT).', 'info');
      }

      const updated = currentList.map(r => {
        if (r.id === ruleData.id) {
          const merged = {
            ...r,
            ...ruleData,
            status: nextStatus,
            ghostStartedAt: ghostStarted,
            updatedAt: nowStr
          } as Rule;
          return merged;
        }
        return r;
      });

      this.saveRules(updated);
      this.addAuditLog(ruleData.id, ruleData.name, 'UPDATE', `Regra atualizada pelo usuário. Lógica: ${ruleData.logic}, Ação: ${ruleData.action}.`);
      this.showToast(`Regra "${ruleData.name}" atualizada com sucesso!`, 'success');
      return updated.find(r => r.id === ruleData.id)!;
    } else {
      // Criar nova
      const newId = `rule-${Date.now().toString().slice(-4)}`;
      const newRule: Rule = {
        ...ruleData,
        id: newId,
        createdAt: nowStr,
        updatedAt: nowStr,
        status: ruleData.status || 'DRAFT',
        authorName: ruleData.authorName || user.name
      };
      const updated = [newRule, ...currentList];
      this.saveRules(updated);
      this.addAuditLog(newId, newRule.name, 'CREATE', `Regra criada com sucesso. Escopo: ${newRule.storeName}, Meios de Pagamento: ${newRule.payments.join(', ')}.`);
      this.showToast(`Regra "${newRule.name}" criada com sucesso!`, 'success');
      return newRule;
    }
  }

  deleteRule(id: string) {
    if (!this.canWrite()) return;
    const target = this.getRuleById(id);
    const updated = this.rules().filter(r => r.id !== id);
    this.saveRules(updated);
    if (target) {
      this.addAuditLog(id, target.name, 'DEACTIVATE', 'Regra excluída permanentemente pelo analista.');
      this.showToast(`Regra "${target.name}" foi excluída.`, 'warning');
    }
  }

  duplicateRule(id: string): Rule | undefined {
    if (!this.canWrite()) return undefined;
    const source = this.getRuleById(id);
    if (!source) return undefined;

    const duplicated: Rule = {
      ...source,
      id: `rule-${Date.now().toString().slice(-4)}`,
      name: `${source.name} (Cópia)`,
      createdAt: this.formatCurrentDate(),
      updatedAt: this.formatCurrentDate(),
      status: 'DRAFT',
      ghostStartedAt: undefined,
      authorName: this.currentUser().name,
      approverName: undefined,
      approvalJustification: undefined,
      approvalSnapshot: undefined
    };

    this.saveRules([duplicated, ...this.rules()]);
    this.addAuditLog(duplicated.id, duplicated.name, 'CREATE', `Regra duplicada com base na regra #${source.id}.`);
    this.showToast(`Regra "${source.name}" foi duplicada com sucesso!`, 'success');
    return duplicated;
  }

  resetToDefaultRules() {
    this.saveRules(this.cloneDefaultRules());
    localStorage.removeItem('antifraud_audit_logs');
    this.auditLogs.set([]);
    this.showToast('Regras redefinidas para o padrão da demonstração!', 'info');
  }

  /**
   * Backtest retrospectivo assíncrono (SLA <= 10s)
   */
  runBacktest(id: string): Promise<BacktestResult> {
    return new Promise((resolve, reject) => {
      const rule = this.getRuleById(id);
      if (!rule) {
        this.showToast('Erro: Regra não encontrada.', 'warning');
        reject('Regra não encontrada');
        return;
      }

      // Impedimento de simulação em regra com status incompatível ACTIVE ou ARCHIVED (TC-DN02-03)
      if (rule.status === 'ACTIVE') {
        this.showToast('Trava de Segurança: Não é permitido executar simulações em regras que já se encontram em produção (ACTIVE).', 'warning');
        reject('Status incompatível');
        return;
      }

      // Adiciona log de início da simulação
      this.addAuditLog(rule.id, rule.name, 'SIMULATE', 'Iniciada simulação retrospectiva de 30 dias de transações.');

      setTimeout(() => {
        // Atualiza a regra para status SIMULATED após simulação bem sucedida (TC-DN02-05)
        const updated = this.rules().map(r => {
          if (r.id === id) {
            return {
              ...r,
              status: 'SIMULATED',
              updatedAt: this.formatCurrentDate()
            } as Rule;
          }
          return r;
        });
        this.saveRules(updated);

        // Retorna o resultado com base no PRD se for a regra correspondente
        if (id === 'rule-106' || rule.name.includes('Device Fingerprint')) {
          resolve({
            analyzedCount: 12450,
            impactedCount: 418,
            impactedPercent: 3.36,
            estimatedFraudPrevention: 284500,
            falsePositivePercent: 0.12,
            sazonalidadeAlert: true,
            sazonalidadeDetails: 'Alerta: Período analisado contém eventos de pico sazonal (Mês dos Pais).'
          });
        } else {
          resolve({
            analyzedCount: 9820,
            impactedCount: 154,
            impactedPercent: 1.57,
            estimatedFraudPrevention: 104500,
            falsePositivePercent: 0.05,
            sazonalidadeAlert: false
          });
        }
        
        this.showToast(`Simulação para "${rule.name}" concluída com sucesso! Status atualizado para SIMULADO.`, 'success');
        this.addAuditLog(rule.id, rule.name, 'SIMULATE', 'Simulação retrospectiva de 30 dias concluída com sucesso.');
      }, 1500); // 1.5s representa bem o carregamento assíncrono mantendo SLA <= 10s
    });
  }

  /**
   * Submeter para Ghost Mode (A/B Test)
   */
  startGhostMode(id: string) {
    if (!this.canWrite()) return;
    
    const rule = this.getRuleById(id);
    if (!rule) return;

    // Impedir se não estiver SIMULADO (TC-DN04-05)
    if (rule.status !== 'SIMULATED') {
      this.showToast('Erro de Validação: Para iniciar o Ghost Mode, a regra deve ter passado por simulação prévia.', 'warning');
      return;
    }


    const updated = this.rules().map(r => {
      if (r.id === id) {
        this.addAuditLog(
          r.id, 
          r.name, 
          'GHOST_START', 
          'Iniciado o Ghost Mode (modo fantasma) no tráfego de produção.'
        );
        this.showToast(`Regra "${r.name}" iniciada em Ghost Mode!`, 'success');
        return {
          ...r,
          status: 'GHOST_ACTIVE',
          ghostStartedAt: new Date().toISOString(), // Grava hora de início real
          ghostMode: true,
          active: true, // Em Ghost Mode ela fica ativa na engine, mas como ghostMode=true
          updatedAt: this.formatCurrentDate()
        } as Rule;
      }
      return r;
    });
    this.saveRules(updated);
  }

  /**
   * Duplo Controle: Aprovação de Regras por Gestor Elegível
   */
  approveRule(id: string, justification: string): boolean {
    if (!this.canWrite()) return false;

    const user = this.currentUser();
    // Apenas Gestor pode aprovar (TC-DN08-02 / TC-DN06-01)
    if (user.role !== 'GESTOR') {
      this.showToast('Bloqueio de Alçada: Apenas perfil de Gestor de Risco possui autoridade para aprovação de regras.', 'warning');
      return false;
    }

    const rule = this.getRuleById(id);
    if (!rule) return false;

    // Bloqueio de autoaprovação (TC-DN06-02)
    if (rule.authorName === user.name) {
      this.showToast(`Bloqueio de Duplo Controle: O autor da regra (${rule.authorName}) não pode aprovar a própria regra. Solicite aprovação de outro Gestor.`, 'warning');
      return false;
    }

    // Justificativa de risco obrigatória com no mínimo 20 caracteres (TC-DN06-03)
    if (!justification || justification.trim().length < 20) {
      this.showToast('Erro de validação: Insira uma justificativa técnica formal detalhada de risco (mínimo de 20 caracteres).', 'warning');
      return false;
    }

    // Gerar snapshot imutável em JSON do estado da regra no momento da aprovação (TC-DN06-05)
    const snapshotJSON = JSON.stringify({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      clauses: rule.clauses,
      logic: rule.logic,
      action: rule.action,
      payments: rule.payments,
      createdAt: rule.createdAt,
      ticketPrd: rule.ticketPrd,
      authorName: rule.authorName,
      approvedAt: this.formatCurrentDate(),
      approver: `${user.name} (${user.email})`
    }, null, 2);

    const updated = this.rules().map(r => {
      if (r.id === id) {
        this.addAuditLog(
          r.id, 
          r.name, 
          'APPROVE', 
          `Regra aprovada com sucesso pelo Gestor de Risco. Justificativa: "${justification}"`,
          snapshotJSON
        );
        this.showToast(`Regra "${r.name}" aprovada com duplo controle!`, 'success');
        return {
          ...r,
          status: 'APPROVED',
          approverName: user.name,
          approvalJustification: justification,
          approvalSnapshot: snapshotJSON,
          updatedAt: this.formatCurrentDate()
        } as Rule;
      }
      return r;
    });
    this.saveRules(updated);
    return true;
  }

  /**
   * Ativar Regra Aprovada para Produção Completa (Sair de Ghost Mode)
   */
  activateToProduction(id: string, forcePass24h = false): boolean {
    if (!this.canChangeActiveStatus()) return false;

    const rule = this.getRuleById(id);
    if (!rule) return false;

    // Se estiver tentando ativar e não estiver aprovada/ghost_active, rejeitar
    if (rule.status !== 'APPROVED' && rule.status !== 'GHOST_ACTIVE') {
      this.showToast('Erro: A regra precisa estar aprovada ou em Ghost Mode para ativação plena.', 'warning');
      return false;
    }

    // Se a regra não estiver com status APPROVED (duplo controle realizado), rejeitar ativação plena
    if (rule.status !== 'APPROVED') {
      this.showToast('Trava de Segurança: Regra não pode ser ativada em produção sem passar pelo fluxo de aprovação com Duplo Controle.', 'warning');
      return false;
    }

    // Cronômetro obrigatório de 24 horas em Ghost Mode (TC-DN05-02 e TC-DN05-03)
    // Para facilitação de testes e demonstração do sandbox, permitimos pular ou fornecemos um flag 'forcePass24h'
    let canActivate = false;
    if (forcePass24h) {
      canActivate = true;
    } else if (rule.ghostStartedAt) {
      const start = new Date(rule.ghostStartedAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours >= 24) {
        canActivate = true;
      }
    }

    if (!canActivate) {
      this.showToast('Bloqueio Técnico: É obrigatório que a regra permaneça no mínimo 24h consecutivas em Ghost Mode coletando dados de tráfego sombra antes de ir para Produção Plena (CMN 4.966).', 'warning');
      return false;
    }

    const updated = this.rules().map(r => {
      if (r.id === id) {
        this.addAuditLog(
          r.id, 
          r.name, 
          'ACTIVATE', 
          'Regra promovida do modo Ghost para Produção Plena (Decisão Ativa).'
        );
        this.showToast(`Regra "${r.name}" ativada em produção! Decisão ativa: ${r.action}.`, 'success');
        return {
          ...r,
          status: 'ACTIVE',
          ghostMode: false,
          active: true,
          updatedAt: this.formatCurrentDate()
        } as Rule;
      }
      return r;
    });
    this.saveRules(updated);
    return true;
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
          // High priority decision assignment (DECLINE overrides REVIEW overrides APPROVE)
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
      explanation = 'Nenhuma regra de bloqueio ou decisão direta foi acionada. O pedido segue fluxo normal de análise de risco e reputação.';
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
      case 'param-11': // Device fingerprint
        transactionVal = sim.deviceFingerprintSeen || 'SIM';
        break;
      case 'param-12': // Localização diverge
        transactionVal = sim.locationDiverges || 'SIM';
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
