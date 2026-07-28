import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { RuleService } from '../../services/rule.service';
import { Rule, PaymentMethod, RuleLogic, RuleAction, RuleLayer, RuleClause } from '../../models/rule.model';

@Component({
  selector: 'app-rule-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="rule-form-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Portal Antifraude</a>
        <span class="sep">/</span>
        <a routerLink="/regras">Regras Globais e por Loja</a>
        <span class="sep">/</span>
        <span class="active">{{ isEditMode() ? (form.get('name')?.value || 'Edição de Regra') : 'Nova Regra Antifraude' }}</span>
      </nav>

      <div class="form-card">
        <div class="form-header">
          <div class="header-title-group">
            <h1 class="form-title">
              {{ isEditMode() ? 'Edição de Regra Antifraude' : 'Criar Nova Regra Antifraude' }}
            </h1>
            <span class="brand-tag">REGRAS & RISCO</span>
          </div>
          <p class="form-subtitle">
            Configure o escopo de loja, meios de pagamento, decisão, camada de análise, prioridade e cláusulas condicionais.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSave(false)">
          <!-- Scope Indicator Banner -->
          <div class="scope-banner" [class.global]="isGlobalRule()">
            <div class="banner-tag">
              {{ isGlobalRule() ? 'GLOBAL' : 'LOJA' }}
            </div>
            <div class="banner-info">
              <strong>
                {{ isGlobalRule() ? 'Regra de Escopo Global' : 'Regra Específica por Loja' }}
              </strong>
              <span>
                Esta regra será aplicada em: 
                <strong class="target-store">{{ targetStoreName() }}</strong>
              </span>
            </div>
          </div>


          <!-- Section: Dados Gerais -->
          <div class="form-section">
            <h2 class="section-title">Dados Gerais da Regra</h2>

            <div class="form-grid">
              <!-- Rule Name -->
              <div class="form-group col-full">
                <label for="rule-name">Nome da Regra <span class="required">*</span></label>
                <input 
                  id="rule-name" 
                  type="text" 
                  class="form-control" 
                  formControlName="name" 
                  placeholder="Ex: Bloqueio de BINs de alto risco / Aprovação Automática EAD"
                />
                @if (form.get('name')?.touched && form.get('name')?.invalid) {
                  <span class="error-msg">Por favor, informe um nome identificador para a regra.</span>
                }
              </div>

              <!-- Description -->
              <div class="form-group col-full">
                <label for="rule-desc">Descrição / Objetivo do Risco</label>
                <textarea 
                  id="rule-desc" 
                  class="form-control textarea" 
                  formControlName="description" 
                  rows="2"
                  placeholder="Descreva a finalidade, hipótese de fraude ou comportamento esperado desta regra..."
                ></textarea>
              </div>

              <!-- Payment Methods -->
              <div class="form-group col-full">
                <label>Validade para Meios de Pagamento:</label>
                <div class="payment-checkbox-group">
                  <label class="checkbox-pill" [class.selected]="hasPayment('cartao')">
                    <input type="checkbox" [checked]="hasPayment('cartao')" (change)="togglePayment('cartao')" />
                    <span>Cartão de Crédito</span>
                  </label>

                  <label class="checkbox-pill" [class.selected]="hasPayment('pix')">
                    <input type="checkbox" [checked]="hasPayment('pix')" (change)="togglePayment('pix')" />
                    <span>PIX / EAD</span>
                  </label>

                  <label class="checkbox-pill" [class.selected]="hasPayment('voucher')">
                    <input type="checkbox" [checked]="hasPayment('voucher')" (change)="togglePayment('voucher')" />
                    <span>Voucher</span>
                  </label>

                  <label class="checkbox-pill" [class.selected]="hasPayment('boleto')">
                    <input type="checkbox" [checked]="hasPayment('boleto')" (change)="togglePayment('boleto')" />
                    <span>Boleto Bancário</span>
                  </label>
                </div>
              </div>

              <!-- Rule Logic (Tipo) -->
              <div class="form-group col-half">
                <label>Lógica Operacional (Condição)</label>
                <div class="logic-options">
                  <label class="radio-card" [class.active]="form.get('logic')?.value === 'AND'">
                    <input type="radio" formControlName="logic" value="AND" />
                    <div class="radio-content">
                      <strong>E (AND) - Conjunção</strong>
                      <span>Dispara quando o pedido atende a <strong>TODAS</strong> as cláusulas.</span>
                    </div>
                  </label>

                  <label class="radio-card" [class.active]="form.get('logic')?.value === 'OR'">
                    <input type="radio" formControlName="logic" value="OR" />
                    <div class="radio-content">
                      <strong>OU (OR) - Disjunção</strong>
                      <span>Dispara quando o pedido atende a <strong>QUALQUER UMA</strong> das cláusulas.</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Rule Action (Decisão) -->
              <div class="form-group col-half">
                <label>Decisão / Ação Antifraude</label>
                <div class="action-selector">
                  <button 
                    type="button" 
                    class="action-btn btn-approve" 
                    [class.selected]="form.get('action')?.value === 'APPROVE'"
                    (click)="setAction('APPROVE')"
                  >
                    <span>Aprovar</span>
                  </button>

                  <button 
                    type="button" 
                    class="action-btn btn-review" 
                    [class.selected]="form.get('action')?.value === 'REVIEW'"
                    (click)="setAction('REVIEW')"
                  >
                    <span>Revisar</span>
                  </button>

                  <button 
                    type="button" 
                    class="action-btn btn-decline" 
                    [class.selected]="form.get('action')?.value === 'DECLINE'"
                    (click)="setAction('DECLINE')"
                  >
                    <span>Negar</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Section: Configurações Avançadas -->
          <div class="form-section advanced-section">
            <button 
              type="button" 
              class="advanced-toggle-btn"
              (click)="toggleAdvanced()"
            >
              <span class="toggle-icon">{{ showAdvanced() ? '▼' : '►' }}</span>
              <span class="toggle-title">Configurações Avançadas de Análise</span>
            </button>

            @if (showAdvanced()) {
              <div class="advanced-body form-grid">
                <!-- Layer -->
                <div class="form-group col-third">
                  <label>Camada de Análise</label>
                  <div class="layer-radio-group">
                    <label class="layer-radio">
                      <input type="radio" formControlName="layer" value="1st" />
                      <span>1ª camada (Filtro rápido)</span>
                    </label>
                    <label class="layer-radio">
                      <input type="radio" formControlName="layer" value="2nd" />
                      <span>2ª camada (Filtro profundo)</span>
                    </label>
                  </div>
                </div>

                <!-- Priority -->
                <div class="form-group col-third">
                  <label for="rule-priority">
                    Prioridade (#1 a #99)
                    <span class="tooltip-icon" title="Regras com prioridade numérica menor (#1) sobrensaem sobre regras com valores maiores.">ⓘ</span>
                  </label>
                  <input 
                    id="rule-priority" 
                    type="number" 
                    min="1" 
                    max="99" 
                    class="form-control" 
                    formControlName="priority" 
                  />
                </div>

                <!-- Ghost Mode -->
                <div class="form-group col-third">
                  <label>
                    Modo Simulação (Ghost)
                    <span class="tooltip-icon" title="Sinaliza disparo no relatório sem alterar a decisão real do pedido para validação A/B.">ⓘ</span>
                  </label>
                  <label class="ghost-switch">
                    <input type="checkbox" formControlName="ghostMode" />
                    <span class="ghost-slider"></span>
                    <span class="ghost-label">Habilitar Ghost Mode</span>
                  </label>
                </div>
              </div>
            }
          </div>

          <!-- Section: Edição de Cláusulas (Parâmetros) -->
          <div class="form-section clauses-section">
            <h2 class="section-title">Cláusulas & Parâmetros da Regra</h2>
            <p class="section-desc">
              Selecione e adicione os atributos de risco da transação para estruturar as condições de disparo.
            </p>

            <!-- Parameter Picker Add Bar -->
            <div class="clause-picker-bar">
              <label for="param-select">Adicionar Atributo:</label>
              <div class="picker-inputs">
                <select 
                  id="param-select" 
                  class="form-control param-select" 
                  [value]="selectedParamId()" 
                  (change)="onParamSelectChange($event)"
                >
                  <option value="" disabled>Selecione um parâmetro de risco (ex: BIN, Parcelas, País...)...</option>
                  @for (param of ruleService.availableParameters(); track param.id) {
                    <option [value]="param.id">{{ param.name }}</option>
                  }
                </select>

                <button 
                  type="button" 
                  class="btn-eq-outline-teal" 
                  [disabled]="!selectedParamId()"
                  (click)="addClause()"
                  title="Adicionar esta cláusula à regra"
                >
                  + Adicionar Cláusula
                </button>
              </div>
            </div>

            <!-- List of Clauses -->
            <div class="clauses-list">
              @for (clauseCtrl of clausesArray.controls; track $index) {
                <div class="clause-item" [formGroup]="getClauseGroup($index)">
                  <div class="clause-param-name">
                    <span class="param-bullet">•</span>
                    <strong>{{ clauseCtrl.get('parameterName')?.value }}</strong>
                  </div>

                  <div class="clause-controls">
                    <select class="form-control operator-select" formControlName="operator">
                      @for (op of getOperatorsForParam(clauseCtrl.get('parameterId')?.value); track op) {
                        <option [value]="op">{{ op }}</option>
                      }
                    </select>

                    <input 
                      type="text" 
                      class="form-control value-input" 
                      formControlName="value" 
                      placeholder="Defina o valor da condição..."
                    />

                    <button 
                      type="button" 
                      class="btn-remove-clause" 
                      (click)="removeClause($index)"
                      title="Excluir esta cláusula"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>

                  </div>
                </div>
              } @empty {
                <div class="no-clauses-alert">
                  <span>Nenhuma cláusula configurada. Escolha um atributo acima para iniciar a construção da regra.</span>
                </div>
              }
            </div>

            @if (clausesArray.length > 0) {
              <div class="clauses-summary">
                <span class="summary-badge">
                  Disparo ativado em transações que correspondam a 
                  <strong>{{ form.get('logic')?.value === 'AND' ? 'TODAS AS' : 'QUALQUER UMA DAS' }}</strong>
                  {{ clausesArray.length }} cláusulas configuradas acima.
                </span>
              </div>
            }
          </div>

          <!-- Form Action Buttons -->
          <div class="form-actions-bar">
            <button type="button" class="btn-eq-secondary" routerLink="/regras">
              Cancelar
            </button>

            <div class="right-actions">
              <button type="submit" class="btn-save-draft">
                Salvar Rascunho
              </button>

              <button type="button" class="btn-eq-primary" (click)="onSave(true)">
                {{ form.get('active')?.value ? 'Salvar e Manter Ativa' : 'Salvar e Ativar Regra' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './rule-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleFormComponent implements OnInit {
  readonly ruleService = inject(RuleService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEditMode = signal<boolean>(false);
  readonly editingRuleId = signal<string | null>(null);
  readonly showAdvanced = signal<boolean>(true);
  readonly selectedParamId = signal<string>('');

  form!: FormGroup;

  readonly targetStoreName = computed(() => {
    const store = this.ruleService.currentStore();
    return store.name;
  });

  readonly isGlobalRule = computed(() => {
    return this.ruleService.selectedStoreId() === 'ALL';
  });

  ngOnInit() {
    this.initForm();

    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      const existing = this.ruleService.getRuleById(paramId);
      if (existing) {
        this.isEditMode.set(true);
        this.editingRuleId.set(existing.id);
        this.populateForm(existing);
      }
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      payments: [(['cartao'] as PaymentMethod[]), [Validators.required]],
      logic: ['AND' as RuleLogic, [Validators.required]],
      action: ['REVIEW' as RuleAction, [Validators.required]],
      layer: ['1st' as RuleLayer, [Validators.required]],
      priority: [1, [Validators.required, Validators.min(1)]],
      ghostMode: [false],
      active: [true],
      clauses: this.fb.array([])
    });
  }

  get clausesArray(): FormArray {
    return this.form.get('clauses') as FormArray;
  }

  getClauseGroup(index: number): FormGroup {
    return this.clausesArray.at(index) as FormGroup;
  }

  private populateForm(rule: Rule) {
    this.form.patchValue({
      name: rule.name,
      description: rule.description,
      payments: rule.payments,
      logic: rule.logic,
      action: rule.action,
      layer: rule.layer,
      priority: rule.priority,
      ghostMode: rule.ghostMode,
      active: rule.active
    });

    this.clausesArray.clear();
    rule.clauses.forEach((c: RuleClause) => {
      this.clausesArray.push(this.fb.group({
        id: [c.id],
        parameterId: [c.parameterId],
        parameterName: [c.parameterName],
        operator: [c.operator],
        value: [c.value]
      }));
    });
  }

  togglePayment(method: PaymentMethod) {
    const current: PaymentMethod[] = [...(this.form.get('payments')?.value || [])];
    const idx = current.indexOf(method);
    if (idx > -1) {
      if (current.length > 1) {
        current.splice(idx, 1);
      }
    } else {
      current.push(method);
    }
    this.form.patchValue({ payments: current });
  }

  hasPayment(method: PaymentMethod): boolean {
    const current: PaymentMethod[] = this.form.get('payments')?.value || [];
    return current.includes(method);
  }

  setAction(action: RuleAction) {
    this.form.patchValue({ action });
  }

  toggleAdvanced() {
    this.showAdvanced.update(v => !v);
  }

  onParamSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedParamId.set(select.value);
  }

  addClause() {
    const paramId = this.selectedParamId();
    if (!paramId) return;

    const paramObj = this.ruleService.availableParameters().find(p => p.id === paramId);
    if (!paramObj) return;

    this.clausesArray.push(this.fb.group({
      id: ['cl_' + Date.now()],
      parameterId: [paramObj.id],
      parameterName: [paramObj.name],
      operator: [paramObj.operators[0] || '=='],
      value: ['']
    }));

    this.selectedParamId.set('');
  }

  removeClause(index: number) {
    this.clausesArray.removeAt(index);
  }

  getOperatorsForParam(paramId: string): string[] {
    const paramObj = this.ruleService.availableParameters().find(p => p.id === paramId);
    return paramObj ? paramObj.operators : ['==', '!='];
  }

  onSave(activate: boolean) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ruleService.showToast('Preencha os campos obrigatórios corretamente.', 'warning');
      return;
    }

    const formVal = this.form.value;
    const currentStoreId = this.ruleService.selectedStoreId();
    const currentStore = this.ruleService.currentStore();

    const payload = {
      id: this.editingRuleId() || undefined,
      name: formVal.name,
      description: formVal.description,
      storeId: currentStoreId,
      storeName: currentStore.name,
      active: activate ? true : formVal.active,
      payments: formVal.payments,
      logic: formVal.logic,
      action: formVal.action,
      layer: formVal.layer,
      priority: Number(formVal.priority),
      ghostMode: formVal.ghostMode,
      clauses: formVal.clauses
    };

    this.ruleService.saveRule(payload);
    this.router.navigate(['/regras']);
  }
}
