import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentMethod, RuleAction, RuleLayer, RuleLogic } from '../../models/rule.model';
import { RuleService } from '../../services/rule.service';
import { ImpactComponent } from '../impact/impact';

@Component({
  selector: 'app-rule-form',
  imports: [ReactiveFormsModule, RouterLink, ImpactComponent],
  template: `
    <div class="rule-form-page">
      <nav class="breadcrumb">
        <a routerLink="/regras">Portal Antifraude</a><b>/</b>
        <a routerLink="/regras">Regras Globais e por Loja</a><b>/</b>
        <span>{{ isEditMode() ? 'Edição de Regra #06' : 'Nova Regra Antifraude' }}</span>
      </nav>

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
              e cláusulas condicionais.
            </p>
          </div>
          <span>REGRAS & RISCO</span>
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

            <label class="field">
              <span>Nome da Regra *</span>
              <input formControlName="name" />
            </label>

            <label class="field">
              <span>Descrição / Objetivo do Risco (Auditável CMN 4.966)</span>
              <textarea rows="3" formControlName="description"></textarea>
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
                    />
                    <span>{{ hasPayment(method.value) ? '☑' : '☐' }} {{ method.label }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="two-columns">
              <div>
                <label class="sub-label">Lógica Operacional (Condição)</label>
                <label class="logic-card">
                  <span
                    ><input type="radio" formControlName="logic" value="AND" />
                    <b>E (AND) - Conjunção</b></span
                  >
                  <small>Dispara quando a transação atende a TODAS as cláusulas combinadas.</small>
                </label>
              </div>

              <div>
                <label class="sub-label">Decisão / Ação Antifraude (RN2)</label>
                <div class="decision-group">
                  <button
                    type="button"
                    [class.selected]="form.value.action === 'APPROVE'"
                    (click)="setAction('APPROVE')"
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    class="review"
                    [class.selected]="form.value.action === 'REVIEW'"
                    (click)="setAction('REVIEW')"
                  >
                    ✓ REVISAR
                  </button>
                  <button
                    type="button"
                    [class.selected]="form.value.action === 'DECLINE'"
                    (click)="setAction('DECLINE')"
                  >
                    Negar
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h2>2. Edição de Cláusulas Condicionais (Device Fingerprint + Geolocalização)</h2>
            <div class="clauses-box">
              <article class="clause">
                <div>
                  <span>Cláusula #01</span
                  ><strong>Parâmetro: Device fingerprint já visto em outra conta</strong>
                </div>
                <div><b>Operador: == (Igual)</b><em>Valor: SIM</em></div>
              </article>
              <div class="and-connector">E (AND)</div>
              <article class="clause">
                <div>
                  <span>Cláusula #02</span
                  ><strong>Parâmetro: Localização diverge do histórico do comprador</strong>
                </div>
                <div><b>Operador: == (Igual)</b><em>Valor: SIM</em></div>
              </article>
            </div>
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
                <strong>#06 (Ordem de Execução)</strong>
              </div>
              <div>
                <span>Ghost Mode (Simulação A/B)</span>
                <label
                  ><input type="checkbox" formControlName="ghostMode" />
                  <strong>HABILITADO (Modo Fantasma Ativo)</strong></label
                >
              </div>
              <div>
                <span>Rastreabilidade CMN 4.966</span>
                <small>Autor: Nexus AI Agent</small>
              </div>
            </div>
          </section>

          <footer class="form-actions">
            <a routerLink="/regras">Voltar para Regras</a>
            <div>
              <button type="submit" class="secondary">Salvar e Testar Regra</button>
              <button type="button" class="impact-button" (click)="showImpactModal.set(true)">
                🚀 Simular Impacto e Ativar
              </button>
            </div>
          </footer>
        </form>
      </section>

      @if (showImpactModal()) {
        <app-impact (close)="showImpactModal.set(false)" />
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

  readonly isEditMode = signal(true);
  readonly ruleId = signal<string | null>(null);
  readonly selectedPayments = signal<PaymentMethod[]>(['cartao', 'pix', 'voucher']);
  readonly showImpactModal = signal(false);

  readonly paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cartao', label: 'Cartão de Crédito' },
    { value: 'pix', label: 'PIX / EAD' },
    { value: 'voucher', label: 'Voucher' },
    { value: 'boleto', label: 'Boleto Bancário' },
  ];

  readonly form = this.fb.group({
    name: [
      'Bloqueio de Suspeita Device Fingerprint + Geolocalização Divergente',
      Validators.required,
    ],
    description: [
      'Detecta e encaminha para Análise Manual (REVISAR) pedidos onde o device fingerprint já foi registrado em outra conta de comprador E a geolocalização do pedido diverge do histórico habitual.',
    ],
    storeId: ['ALL'],
    logic: ['AND'],
    action: ['REVIEW'],
    layer: ['1st'],
    priority: [6],
    ghostMode: [true],
    active: [true],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.ruleId.set(id);
    this.isEditMode.set(Boolean(id));

    const existing = id && id !== 'rule-106' ? this.ruleService.getRuleById(id) : undefined;
    if (existing) {
      this.form.patchValue(existing);
      this.selectedPayments.set([...existing.payments]);
    }
  }

  hasPayment(method: PaymentMethod) {
    return this.selectedPayments().includes(method);
  }

  togglePayment(method: PaymentMethod) {
    const payments = this.selectedPayments();
    this.selectedPayments.set(
      payments.includes(method)
        ? payments.filter((item) => item !== method)
        : [...payments, method],
    );
  }

  setAction(action: RuleAction) {
    this.form.patchValue({ action });
  }

  save() {
    if (this.form.invalid) {
      this.ruleService.showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }

    const value = this.form.getRawValue();
    this.ruleService.saveRule({
      id: this.ruleId() === 'rule-106' ? undefined : (this.ruleId() ?? undefined),
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
      active: value.active ?? true,
      clauses: [],
    });
    this.router.navigate(['/regras']);
  }
}
