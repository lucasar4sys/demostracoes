import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentMethod, RuleAction, RuleLayer, RuleLogic, RuleClause, RuleStatus } from '../../models/rule.model';
import { RuleService } from '../../services/rule.service';
import { ImpactComponent } from '../impact/impact';

@Component({
  selector: 'app-rule-form',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, ImpactComponent],
  template: `
    <div class="rule-form-page">
      <nav class="breadcrumb">
        <a routerLink="/regras">Portal Antifraude</a><b>/</b>
        <a routerLink="/regras">Regras Globais e por Loja</a><b>/</b>
        <span>{{ isEditMode() ? 'Edição de Regra #' + (ruleId() || '06') : 'Nova Regra Antifraude' }}</span>
      </nav>

      <!-- Alerta de RBAC (Auditor sem permissão de escrita) -->
      @if (ruleService.currentUser().role === 'AUDITOR') {
        <div class="rbac-warning-banner">
          <strong>⚠️ Modo Somente Leitura Ativo:</strong> Como Auditor, você pode visualizar as configurações, mas ações de gravação e simulação estão desabilitadas.
        </div>
      }

      <section class="form-card">
        <header class="form-header">
          <div>
            <h1>
              {{
                isEditMode()
                  ? 'Edição de Regra Antifraude - Device Fingerprint + Geolocalização'
                  : 'Nova Regra Antifraude'
              }}
            </h1>
            <p>
              Configure o escopo de loja, meios de pagamento, decisão, camada de análise, prioridade
              e cláusulas condicionais (Conformidade Resolução CMN 4.966 / Art. 20 LGPD).
            </p>
          </div>
          <span class="governance-tag">REGRAS & RISCO</span>
        </header>

        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="global-banner">
            <strong>GLOBAL</strong>
            <span
              >Regra de Escopo Global: Esta regra será aplicada em
              <b>TODAS as lojas ativas no ecossistema.</b></span
            >
          </div>

          <section class="form-section">
            <h2>1. Dados Gerais da Regra</h2>

            <div class="two-columns">
              <label class="field">
                <span>Nome da Regra * (mín. 10 / máx. 100 caracteres)</span>
                <input formControlName="name" placeholder="Ex: Suspeita de fraude por Device Fingerprint..." />
                @if (form.get('name')?.touched && form.get('name')?.invalid) {
                  <small class="error-msg">O nome é obrigatório e deve ter entre 10 e 100 caracteres.</small>
                }
              </label>

              <label class="field">
                <span>Ticket PRD/Jira Obrigatório * (Formato: PRD-XXXX)</span>
                <input formControlName="ticketPrd" placeholder="Ex: PRD-2026" />
                @if (form.get('ticketPrd')?.touched && form.get('ticketPrd')?.invalid) {
                  <small class="error-msg">Ticket de origem é obrigatório e deve seguir o padrão "PRD-1234".</small>
                }
              </label>
            </div>

            <label class="field">
              <span>Descrição / Objetivo do Risco (Auditável CMN 4.966)</span>
              <textarea rows="3" formControlName="description" placeholder="Descreva os vetores de mitigação de risco e premissas regulatórias desta regra..."></textarea>
            </label>

            <div class="field">
              <span>Validade para Meios de Pagamento:</span>
              <div class="payment-row">
                @for (method of paymentOptions; track method.value) {
                  <label class="payment-pill" [class.selected]="hasPayment(method.value)">
                    <input
                      type="checkbox"
                      [checked]="hasPayment(method.value)"
                      (change)="togglePayment(method.value)"
                      [disabled]="isAuditor()"
                    />
                    <span>{{ hasPayment(method.value) ? '☑' : '☐' }} {{ method.label }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="two-columns">
              <div>
                <label class="sub-label">Lógica Operacional (Condição)</label>
                <div class="logic-options">
                  <label class="logic-card" [class.selected]="form.value.logic === 'AND'">
                    <span><input type="radio" formControlName="logic" value="AND" />
                    <b>E (AND) - Conjunção</b></span>
                    <small>Dispara quando a transação atende a TODAS as cláusulas combinadas.</small>
                  </label>
                  <label class="logic-card" [class.selected]="form.value.logic === 'OR'">
                    <span><input type="radio" formControlName="logic" value="OR" />
                    <b>OU (OR) - Disjunção</b></span>
                    <small>Dispara quando a transação atende a pelo menos uma das cláusulas.</small>
                  </label>
                </div>
              </div>

              <div>
                <label class="sub-label">Decisão / Ação Antifraude (RN2)</label>
                <div class="decision-group">
                  <button
                    type="button"
                    [class.selected]="form.value.action === 'APPROVE'"
                    (click)="setAction('APPROVE')"
                    [disabled]="isAuditor()"
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    class="review"
                    [class.selected]="form.value.action === 'REVIEW'"
                    (click)="setAction('REVIEW')"
                    [disabled]="isAuditor()"
                  >
                    ✓ REVISAR
                  </button>
                  <button
                    type="button"
                    [class.selected]="form.value.action === 'DECLINE'"
                    (click)="setAction('DECLINE')"
                    [disabled]="isAuditor()"
                  >
                    Negar
                  </button>
                </div>
                <small class="decision-tip">Nota: Regras de alta complexidade regulatória devem usar "✓ REVISAR" para mitigar falsos bloqueios (RN2).</small>
              </div>
            </div>
          </section>

          <!-- Seção de Edição de Cláusulas Dinâmicas (RN1) -->
          <section class="form-section">
            <h2>2. Cláusulas Condicionais Configuradas (mín. 1 cláusula / exatamente 2 para Regra Combinada do PRD)</h2>
            
            <div class="clauses-box">
              @if (clauses().length === 0) {
                <div class="no-clauses-banner">
                  <span>Nenhuma cláusula configurada para esta regra de risco. Adicione uma cláusula abaixo para continuar.</span>
                </div>
              } @else {
                @for (clause of clauses(); track clause.id; let idx = $index) {
                  @if (idx > 0) {
                    <div class="and-connector">{{ form.value.logic }}</div>
                  }
                  <article class="clause-item">
                    <div class="clause-details">
                      <span class="clause-idx">Cláusula #0{{ idx + 1 }}</span>
                      <strong>Parâmetro: {{ clause.parameterName }}</strong>
                      <div class="clause-expr">
                        <b>Operador: {{ clause.operator }}</b>
                        <em>Valor: {{ clause.value }}</em>
                      </div>
                    </div>
                    @if (!isAuditor()) {
                      <button type="button" class="remove-clause-btn" (click)="removeClause(clause.id)" title="Remover Cláusula">✕</button>
                    }
                  </article>
                }
              }
            </div>

            <!-- Mini Formulário para Adicionar Nova Cláusula -->
            @if (!isAuditor()) {
              <div class="add-clause-card">
                <h3>＋ Adicionar Cláusula Condicional</h3>
                <div class="add-clause-grid">
                  <div class="add-field">
                    <span>Parâmetro Técnico</span>
                    <select [(ngModel)]="newClauseParamId" [ngModelOptions]="{standalone: true}" (change)="onParamChange()">
                      @for (p of ruleService.availableParameters(); track p.id) {
                        <option [value]="p.id">{{ p.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="add-field">
                    <span>Operador Lógico</span>
                    <select [(ngModel)]="newClauseOperator" [ngModelOptions]="{standalone: true}">
                      @for (op of currentOperators(); track op) {
                        <option [value]="op">{{ op }}</option>
                      }
                    </select>
                  </div>

                  <div class="add-field">
                    <span>Valor de Comparação</span>
                    <input [(ngModel)]="newClauseValue" [ngModelOptions]="{standalone: true}" placeholder="Ex: SIM, BRASIL, 1500" />
                  </div>
                  <button type="button" class="btn-add-clause" (click)="addClause()">Incluir Cláusula</button>
                </div>
              </div>
            }
          </section>

          <section class="form-section">
            <h2>3. Configurações Avançadas de Análise & Governança (Resolução CMN nº 4.966/21)</h2>
            <div class="advanced-card">
              <div>
                <span>Camada de Análise</span>
                <strong>◉ 1ª Camada (Filtro Rápido)</strong>
              </div>
              <div>
                <span>Prioridade na Engine</span>
                <strong>#0{{ form.value.priority }} (Ordem de Execução)</strong>
              </div>
              <div>
                <span>Ghost Mode (Simulação A/B)</span>
                <label>
                  <input type="checkbox" formControlName="ghostMode" [disabled]="isAuditor()" />
                  <strong>HABILITADO (Modo Fantasma Ativo)</strong>
                </label>
              </div>
              <div>
                <span>Governança Regulatória</span>
                <small>Autor: {{ isEditMode() ? (form.value.authorName || 'Mariana Silva') : ruleService.currentUser().name }}</small>
                <small>Estado: <span class="status-badge" [class]="form.value.status?.toLowerCase()">{{ form.value.status }}</span></small>
              </div>
            </div>
          </section>

          <footer class="form-actions">
            <a routerLink="/regras" class="btn-back">Voltar para Regras</a>
            <div>
              @if (!isAuditor()) {
                <button type="submit" class="secondary">Salvar Regra (DRAFT)</button>
              }
              
              <!-- Botão Simular Impacto: Abre modal de backtest retrospective se pelo menos 1 cláusula existir -->
              <button 
                type="button" 
                class="impact-button" 
                [disabled]="clauses().length === 0"
                (click)="openSimulation()"
              >
                📊 Simular Impacto (30 Dias)
              </button>
            </div>
          </footer>
        </form>
      </section>

      <!-- Modal de Simulação Retrospectiva de Impacto (Backtest 30 Dias) -->
      @if (showImpactModal()) {
        <app-impact [ruleId]="ruleId()" (close)="showImpactModal.set(false)" />
      }
    </div>
  `,
  styleUrl: './rule-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly ruleService = inject(RuleService);

  readonly isEditMode = signal(false);
  readonly ruleId = signal<string | null>(null);
  readonly selectedPayments = signal<PaymentMethod[]>(['cartao', 'pix', 'voucher']);
  readonly showImpactModal = signal(false);

  // Lista dinâmica de cláusulas da regra ativa
  readonly clauses = signal<RuleClause[]>([]);

  // Estados para inclusão de nova cláusula
  newClauseParamId = 'param-11';
  newClauseOperator = '==';
  newClauseValue: string | number = 'SIM';

  readonly paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cartao', label: 'Cartão de Crédito' },
    { value: 'pix', label: 'PIX / EAD' },
    { value: 'voucher', label: 'Voucher' },
    { value: 'boleto', label: 'Boleto Bancário' },
  ];

  readonly form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(100)],
    ],
    description: [''],
    storeId: ['ALL'],
    logic: ['AND'],
    action: ['REVIEW'],
    layer: ['1st'],
    priority: [6],
    ghostMode: [true],
    active: [false],
    ticketPrd: ['', [Validators.required, Validators.pattern(/^PRD-[0-9]+$/)]],
    status: ['DRAFT' as RuleStatus],
    authorName: [''],
  });

  // Computed helper para saber se o perfil atual é Auditor
  readonly isAuditor = computed(() => this.ruleService.currentUser().role === 'AUDITOR');

  // Operadores válidos do parâmetro selecionado
  readonly currentOperators = computed(() => {
    const param = this.ruleService.availableParameters().find(p => p.id === this.newClauseParamId);
    return param ? param.operators : ['=='];
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.ruleId.set(id);
      this.isEditMode.set(true);

      const existing = this.ruleService.getRuleById(id);
      if (existing) {
        this.form.patchValue({
          name: existing.name,
          description: existing.description,
          storeId: existing.storeId,
          logic: existing.logic,
          action: existing.action,
          layer: existing.layer,
          priority: existing.priority,
          ghostMode: existing.ghostMode,
          active: existing.active,
          ticketPrd: existing.ticketPrd || 'PRD-2026',
          status: existing.status || 'DRAFT',
          authorName: existing.authorName || 'Mariana Silva'
        });
        this.selectedPayments.set([...existing.payments]);
        this.clauses.set([...existing.clauses]);
      }
    } else {
      // Nova regra: inicializa com dados amigáveis baseados no PRD
      this.form.patchValue({
        name: 'Bloqueio de Suspeita Device Fingerprint + Geolocalização Divergente',
        description: 'Detecta e encaminha para Análise Manual (REVISAR) pedidos onde o device fingerprint já foi registrado em outra conta de comprador E a geolocalização do pedido diverge do histórico habitual.',
        ticketPrd: 'PRD-2026',
        status: 'DRAFT',
        logic: 'AND',
        action: 'REVIEW',
        priority: 6,
        ghostMode: true,
        active: false,
        authorName: this.ruleService.currentUser().name
      });
      // Inicializa com as 2 cláusulas padrão do PRD para facilitar a demonstração stelar do Nexus
      this.clauses.set([
        {
          id: 'c-1',
          parameterId: 'param-11',
          parameterName: 'Device fingerprint já visto em outra conta',
          operator: '==',
          value: 'SIM'
        },
        {
          id: 'c-2',
          parameterId: 'param-12',
          parameterName: 'Localização diverge do histórico do comprador',
          operator: '==',
          value: 'SIM'
        }
      ]);
    }

    // Se for Auditor, desabilita todo o formulário (RBAC TC-DN08-01)
    if (this.isAuditor()) {
      this.form.disable();
    }
  }

  onParamChange() {
    const param = this.ruleService.availableParameters().find(p => p.id === this.newClauseParamId);
    if (param) {
      this.newClauseOperator = param.operators[0];
      this.newClauseValue = param.defaultValue !== undefined ? param.defaultValue : 'SIM';
    }
  }

  addClause() {
    if (this.isAuditor()) return;

    const param = this.ruleService.availableParameters().find(p => p.id === this.newClauseParamId);
    if (!param) return;

    const newClause: RuleClause = {
      id: `c-${Date.now()}`,
      parameterId: this.newClauseParamId,
      parameterName: param.name,
      operator: this.newClauseOperator,
      value: this.newClauseValue
    };

    this.clauses.set([...this.clauses(), newClause]);
    this.ruleService.showToast('Cláusula incluída com sucesso na regra!', 'success');
  }

  removeClause(id: string) {
    if (this.isAuditor()) return;
    this.clauses.set(this.clauses().filter(c => c.id !== id));
    this.ruleService.showToast('Cláusula removida.', 'info');
  }

  hasPayment(method: PaymentMethod) {
    return this.selectedPayments().includes(method);
  }

  togglePayment(method: PaymentMethod) {
    if (this.isAuditor()) return;
    const payments = this.selectedPayments();
    this.selectedPayments.set(
      payments.includes(method)
        ? payments.filter((item) => item !== method)
        : [...payments, method],
    );
  }

  setAction(action: RuleAction) {
    if (this.isAuditor()) return;
    this.form.patchValue({ action });
  }

  openSimulation() {
    if (this.form.invalid) {
      this.ruleService.showToast('Erro: Preencha todos os campos obrigatórios e válidos antes de rodar a simulação.', 'warning');
      return;
    }
    // Salva o rascunho antes de abrir para garantir dados atualizados na simulação
    try {
      this.saveDraftOnly();
      this.showImpactModal.set(true);
    } catch {
      // Erro tratado pelo save
    }
  }

  // Apenas salva como rascunho sem redirecionar
  saveDraftOnly() {
    const value = this.form.getRawValue();
    
    // Validações de negócio (PRD / RN1 / RN2) para a regra combinada
    const hasDeviceFingerprint = this.clauses().some(c => c.parameterId === 'param-11');
    const hasGeolocDiverg = this.clauses().some(c => c.parameterId === 'param-12');
    const isCombinada = hasDeviceFingerprint || hasGeolocDiverg;

    if (isCombinada) {
      // 1. Deve usar lógica AND (TC-DN01-02)
      if (value.logic !== 'AND') {
        this.ruleService.showToast('Rejeição: Regra combinada de geolocalização e fingerprint exige obrigatoriamente operador lógico E (AND).', 'warning');
        throw new Error('Operador lógico inválido.');
      }
      // 2. Deve usar ação REVIEW (TC-DN01-02)
      if (value.action !== 'REVIEW') {
        this.ruleService.showToast('Rejeição: Regra combinada complexa deve ter ação padrão "REVISAR" para conter falsos bloqueios (RN2).', 'warning');
        throw new Error('Ação inválida.');
      }
      // 3. Deve possuir exatamente 2 cláusulas (TC-DN01-05)
      if (this.clauses().length !== 2) {
        this.ruleService.showToast('Rejeição: Esta regra combinada do PRD exige exatamente duas cláusulas condicionais configuradas.', 'warning');
        throw new Error('Quantidade de cláusulas inválida.');
      }
    }

    const saved = this.ruleService.saveRule({
      id: this.ruleId() || undefined,
      name: value.name!,
      description: value.description ?? '',
      storeId: value.storeId ?? 'ALL',
      storeName: 'Todas as Lojas',
      payments: this.selectedPayments(),
      logic: (value.logic ?? 'AND') as RuleLogic,
      action: (value.action ?? 'REVIEW') as RuleAction,
      layer: (value.layer ?? '1st') as RuleLayer,
      priority: value.priority ?? 6,
      ghostMode: value.ghostMode ?? true,
      active: value.active ?? false,
      clauses: this.clauses(),
      ticketPrd: value.ticketPrd!,
      status: (value.status ?? 'DRAFT') as RuleStatus,
      authorName: value.authorName || this.ruleService.currentUser().name
    });

    if (!this.ruleId()) {
      this.ruleId.set(saved.id);
    }
  }

  save() {
    if (this.isAuditor()) {
      this.ruleService.showToast('Permissão negada: O perfil Auditor não pode salvar regras.', 'warning');
      return;
    }

    if (this.form.invalid) {
      this.ruleService.showToast('Erro de validação: Verifique os campos obrigatórios e tente novamente.', 'warning');
      return;
    }

    try {
      this.saveDraftOnly();
      this.router.navigate(['/regras']);
    } catch (e) {
      // Erro de negócio
    }
  }
}
