import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Rule } from '../../models/rule.model';
import { RuleService } from '../../services/rule.service';
import { ImpactComponent } from '../impact/impact';

const visualDemoRule: Rule = {
  id: 'rule-106',
  name: 'Suspeita Device Fingerprint + Geoloc Divergente',
  description: 'Device fingerprint em outra conta E geolocalização diverge do histórico (PRD-01)',
  storeId: 'ALL',
  storeName: 'Todas as Lojas',
  payments: ['cartao', 'pix', 'voucher'],
  logic: 'AND',
  action: 'REVIEW',
  layer: '1st',
  priority: 6,
  ghostMode: true,
  active: true,
  clauses: [],
  createdAt: '',
  updatedAt: '',
};

@Component({
  selector: 'app-rule-list',
  imports: [RouterLink, ImpactComponent],
  template: `
    <div class="rule-list-page">
      <nav class="breadcrumb">
        <span>Portal Antifraude</span><b>/</b><span>Engine de Risco</span><b>/</b>
        <span>Regras Globais e por Loja</span>
      </nav>

      <section class="title-row">
        <div>
          <h1>Gestão de Regras Antifraude</h1>
          <p>Gerencie regras, escopos e ações antifraude com visibilidade em tempo real.</p>
        </div>
        <div class="title-actions">
          <span class="live-pill">LIVE ENGINE</span>
          <a routerLink="/regras/nova" class="primary-button">
            <span>＋</span> + Nova Regra Antifraude
          </a>
        </div>
      </section>

      <div class="scope-banner">
        <span class="scope-icon">◎</span>
        <strong>GLOBAL</strong>
        <span>Escopo: Regras Globais (Aplicáveis a todas as lojas do grupo)</span>
      </div>

      <section class="metrics-grid">
        <article class="metric-card">
          <span class="metric-icon total">☷</span>
          <div>
            <strong>{{ totalRulesCount() }}</strong
            ><span>Total de Regras</span>
          </div>
          <em>100% visíveis</em>
        </article>
        <article class="metric-card">
          <span class="metric-icon active">✓</span>
          <div>
            <strong>{{ activeRulesCount() }}</strong
            ><span>Regras Ativas</span>
          </div>
          <em class="green">Em Produção</em>
        </article>
        <article class="metric-card">
          <span class="metric-icon global">▱</span>
          <div>
            <strong>{{ globalRulesCount() }}</strong
            ><span>Regras Globais</span>
          </div>
          <em class="blue">Todas as Lojas</em>
        </article>
        <article class="metric-card">
          <span class="metric-icon ghost">♙</span>
          <div>
            <strong>{{ ghostRulesCount() }}</strong
            ><span>Ghost Mode (A/B)</span>
          </div>
          <em class="amber">Modo Fantasma</em>
        </article>
      </section>

      <section class="rules-table-card">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>StatusEscopo</th>
                <th>Prio</th>
                <th>Nome da Regra</th>
                <th>Descrição / Objetivo</th>
                <th>Camada</th>
                <th>Ação Antifraude</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (rule of displayRules(); track rule.id) {
                <tr>
                  <td>
                    <div class="status-scope">
                      <label class="switch">
                        <input type="checkbox" [checked]="rule.active" (change)="toggle(rule)" />
                        <span></span>
                      </label>
                      <span class="scope-badge" [class.store]="rule.storeId !== 'ALL'">
                        {{ rule.storeId === 'ALL' ? 'Global' : shortStore(rule) }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong class="priority">#0{{ rule.priority }}</strong>
                  </td>
                  <td>
                    <strong class="rule-name" [class.featured]="rule.id === 'rule-106'">
                      {{ compactName(rule) }}
                    </strong>
                  </td>
                  <td>
                    <span class="description">{{ compactDescription(rule) }}</span>
                  </td>
                  <td>
                    <strong class="layer">{{
                      rule.layer === '1st' ? '1ª Camada' : '2ª Camada'
                    }}</strong>
                  </td>
                  <td>
                    <span class="action" [class]="'action ' + rule.action.toLowerCase()">
                      {{ actionLabel(rule) }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="edit-button" (click)="edit(rule)">Editar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <button type="button" class="floating-simulator" (click)="showImpactModal.set(true)">
        <span>ϟ</span> ⚡ Simulador em Tempo Real
      </button>

      @if (showImpactModal()) {
        <app-impact (close)="showImpactModal.set(false)" />
      }
    </div>
  `,
  styleUrl: './rule-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleListComponent {
  readonly ruleService = inject(RuleService);
  private readonly router = inject(Router);
  readonly showImpactModal = signal(false);

  readonly displayRules = computed(() => {
    const rules = this.ruleService.filteredRules();
    if (rules.some((rule) => rule.id === visualDemoRule.id)) return rules;

    const query = this.ruleService.searchQuery().trim().toLowerCase();
    const store = this.ruleService.selectedStoreId();
    const matchesQuery =
      !query ||
      visualDemoRule.name.toLowerCase().includes(query) ||
      visualDemoRule.description.toLowerCase().includes(query);
    const matchesStore = store === 'ALL';

    return matchesQuery && matchesStore ? [...rules, visualDemoRule] : rules;
  });

  readonly totalRulesCount = computed(() => this.displayRules().length);
  readonly activeRulesCount = computed(
    () => this.displayRules().filter((rule) => rule.active).length,
  );
  readonly globalRulesCount = computed(
    () => this.displayRules().filter((rule) => rule.storeId === 'ALL').length,
  );
  readonly ghostRulesCount = computed(
    () => this.displayRules().filter((rule) => rule.ghostMode).length,
  );

  toggle(rule: Rule) {
    if (rule.id !== visualDemoRule.id) this.ruleService.toggleRuleStatus(rule.id);
  }

  edit(rule: Rule) {
    this.router.navigate(['/regras/editar', rule.id]);
  }

  shortStore(rule: Rule): string {
    if (rule.storeId === 'store-1') return 'Loja 1';
    if (rule.storeId === 'store-2') return 'Loja 2';
    return rule.storeName;
  }

  compactName(rule: Rule): string {
    const names: Record<string, string> = {
      'rule-101': 'Regra Global Checagem País Entrega x Cartão',
      'rule-102': 'Bloqueio Múltiplos Vouchers + Parcelamento Alto',
      'rule-103': 'Aprovação Rápida Pix - Loja Treinamentos',
      'rule-104': 'Bloqueio BINs Alto Risco & Múltiplas Tentativas',
      'rule-105': 'Revisão por E-mail Temporário / Descartável',
    };
    return names[rule.id] ?? rule.name;
  }

  compactDescription(rule: Rule): string {
    const descriptions: Record<string, string> = {
      'rule-101': 'Direciona para revisão quando país do cartão difere da entrega',
      'rule-102': 'Nega compras acima de 10x com mais de 50% pago via voucher',
      'rule-103': 'Aprova compras via Pix abaixo de R$ 300 na Loja Treinamentos',
      'rule-104': 'Negativa transações com >3 tentativas em 24h para BINs restritos',
      'rule-105': 'Revisa pedidos efetuados por domínios de e-mail descartáveis',
    };
    return descriptions[rule.id] ?? rule.description;
  }

  actionLabel(rule: Rule): string {
    return rule.action === 'APPROVE' ? 'APROVAR' : rule.action === 'DECLINE' ? 'NEGAR' : 'REVISAR';
  }
}
