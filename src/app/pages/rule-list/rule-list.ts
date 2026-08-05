import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Rule, AuditLog } from '../../models/rule.model';
import { RuleService } from '../../services/rule.service';
import { ImpactComponent } from '../impact/impact';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rule-list',
  imports: [CommonModule, RouterLink, ImpactComponent],
  template: `
    <div class="rule-list-page">
      <nav class="breadcrumb">
        <span>Portal Antifraude</span><b>/</b><span>Engine de Risco</span><b>/</b>
        <span>Regras Globais e por Loja</span>
      </nav>

      <!-- Banner de RBAC mostrando usuário ativo e suas limitações -->
      <div class="user-info-bar" [class]="ruleService.currentUser().role.toLowerCase()">
        <span class="user-status-dot"></span>
        <span>Usuário Autenticado: <strong>{{ ruleService.currentUser().name }}</strong> ({{ ruleService.currentUser().email }})</span>
        <span class="badge" [class]="ruleService.currentUser().role.toLowerCase()">Perfil: {{ ruleService.currentUser().role }}</span>
        @if (ruleService.currentUser().role === 'AUDITOR') {
          <span class="role-limitation">⚠️ Apenas Visualização (Ações desabilitadas)</span>
        } @else if (ruleService.currentUser().role === 'ANALISTA') {
          <span class="role-limitation">⚠️ Bloqueio de Alçada Ativo (Não pode ativar regras em PRD diretamente)</span>
        } @else {
          <span class="role-limitation">✅ Acesso Total (Homologações de Risco e Governança liberados)</span>
        }
      </div>

      <section class="title-row">
        <div>
          <h1>Gestão de Regras Antifraude</h1>
          <p>Gerencie regras, escopos e ações antifraude em conformidade direta com a Resolução CMN nº 4.966/21 e LGPD Art. 20.</p>
        </div>
        <div class="title-actions">
          <button type="button" class="secondary-button" (click)="resetDefaultRules()">
            🔄 Redefinir Mocks
          </button>
          <span class="live-pill">LIVE ENGINE</span>
          @if (ruleService.currentUser().role !== 'AUDITOR') {
            <a routerLink="/regras/nova" class="primary-button">
              <span>＋</span> Nova Regra Antifraude
            </a>
          }
        </div>
      </section>

      <!-- Abas de Navegação do Painel (Regras vs Trilha de Auditoria Imutável) -->
      <div class="panel-tabs">
        <button 
          type="button" 
          [class.active]="activeTab() === 'regras'" 
          (click)="activeTab.set('regras')"
        >
          🗂️ Regras Antifraude ({{ displayRules().length }})
        </button>
        <button 
          type="button" 
          [class.active]="activeTab() === 'auditoria'" 
          (click)="activeTab.set('auditoria')"
        >
          🔐 Trilha de Auditoria Imutável ({{ ruleService.auditLogs().length }})
        </button>
      </div>

      @if (activeTab() === 'regras') {
        <!-- Seção de Métricas de Performance -->
        <section class="metrics-grid">
          <article class="metric-card">
            <span class="metric-icon total">☷</span>
            <div>
              <strong>{{ totalRulesCount() }}</strong>
              <span>Total de Regras</span>
            </div>
            <em>100% ativas no hub</em>
          </article>
          <article class="metric-card">
            <span class="metric-icon active">✓</span>
            <div>
              <strong>{{ activeRulesCount() }}</strong>
              <span>Regras Ativas</span>
            </div>
            <em class="green">Em Produção Plena</em>
          </article>
          <article class="metric-card">
            <span class="metric-icon global">▱</span>
            <div>
              <strong>{{ globalRulesCount() }}</strong>
              <span>Regras Globais</span>
            </div>
            <em class="blue">Todas as Lojas</em>
          </article>
          <article class="metric-card">
            <span class="metric-icon ghost">♙</span>
            <div>
              <strong>{{ ghostRulesCount() }}</strong>
              <span>Ghost Mode (Sombra)</span>
            </div>
            <em class="amber">Simulação A/B Ativa</em>
          </article>
        </section>

        <!-- Tabela Principal de Regras -->
        <section class="rules-table-card">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Status Ativação</th>
                  <th>Ciclo de Vida</th>
                  <th>Prio</th>
                  <th>Nome da Regra</th>
                  <th>Origem PRD</th>
                  <th>Ação Antifraude</th>
                  <th>Ações de Risco</th>
                </tr>
              </thead>
              <tbody>
                @for (rule of displayRules(); track rule.id) {
                  <tr>
                    <td>
                      <div class="status-scope">
                        <!-- Switch toggle com validações de RBAC -->
                        <label class="switch">
                          <input 
                            type="checkbox" 
                            [checked]="rule.active" 
                            (change)="toggleActive(rule)"
                            [disabled]="isAuditorOrAnalista()" 
                          />
                          <span></span>
                        </label>
                        <span class="scope-badge" [class.store]="rule.storeId !== 'ALL'">
                          {{ rule.storeId === 'ALL' ? 'Global' : shortStore(rule) }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <!-- Badge detalhado do status no ciclo de vida regulatório -->
                      <span class="lifecycle-badge" [class]="rule.status.toLowerCase()">
                        {{ rule.status }}
                      </span>
                    </td>
                    <td>
                      <strong class="priority">#0{{ rule.priority }}</strong>
                    </td>
                    <td>
                      <div class="rule-title-group">
                        <strong class="rule-name" [class.featured]="rule.id === 'rule-106'">
                          {{ compactName(rule) }}
                        </strong>
                        <span class="rule-author">Criador: {{ rule.authorName }}</span>
                        
                        <!-- Mostra o cronômetro do Ghost Mode em tempo real na linha -->
                        @if (rule.status === 'GHOST_ACTIVE') {
                          <span class="ghost-timer-badge">
                            🕒 Ghost Mode: {{ getGhostTimeText(rule) }}
                          </span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="prd-ticket">{{ rule.ticketPrd || 'N/A' }}</span>
                    </td>
                    <td>
                      <span class="action" [class]="'action ' + rule.action.toLowerCase()">
                        {{ actionLabel(rule) }}
                      </span>
                    </td>
                    <td>
                      <div class="row-actions">
                        <!-- Botão Central de Simulação & Governança -->
                        <button 
                          type="button" 
                          class="control-btn governance-btn" 
                          (click)="openGovernanceModal(rule.id)"
                        >
                          📊 Simular & Homologar
                        </button>

                        <button 
                          type="button" 
                          class="control-btn edit-button" 
                          (click)="edit(rule)"
                        >
                          Editar
                        </button>
                        
                        @if (!isAuditor()) {
                          <button 
                            type="button" 
                            class="control-btn duplicate-button" 
                            (click)="duplicate(rule)"
                            title="Duplicar regra"
                          >
                            ⧉
                          </button>
                          <button 
                            type="button" 
                            class="control-btn delete-button" 
                            (click)="delete(rule)"
                            title="Excluir regra"
                          >
                            🗑️
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @else {
        <!-- Trilha de Auditoria Imutável (Exibição Amigável para Executivos de Compliance - TC-DN07-01 / TC-DN07-05) -->
        <section class="audit-trail-panel">
          <div class="panel-header">
            <h2>🔐 Linha do Tempo de Auditoria Consolidada (Garantia de Imutabilidade CMN 4.966)</h2>
            <p>Registros cronológicos de todas as criações, simulações, homologações de duplo controle e ativações no motor de risco.</p>
          </div>

          <div class="timeline">
            @if (ruleService.auditLogs().length === 0) {
              <div class="no-logs">Nenhum log de auditoria disponível no momento.</div>
            } @else {
              @for (log of ruleService.auditLogs(); track log.id) {
                <article class="timeline-item">
                  <div class="timeline-badge" [class]="log.action.toLowerCase()">
                    {{ log.action }}
                  </div>
                  <div class="timeline-content">
                    <header class="timeline-header">
                      <strong>{{ log.ruleName }}</strong>
                      <span class="log-timestamp">{{ log.timestamp }}</span>
                    </header>
                    <p class="log-details">{{ log.details }}</p>
                    <div class="log-footer">
                      <span>Executado por: <strong>{{ log.user }}</strong></span>
                      <span class="user-role-badge" [class]="log.userRole.toLowerCase()">{{ log.userRole }}</span>
                    </div>

                    <!-- Exibição do Snapshot JSON Imutável se houver -->
                    @if (log.snapshot) {
                      <details class="log-snapshot">
                        <summary>Visualizar Snapshot JSON de Auditoria Imutável (Aprovação)</summary>
                        <pre><code>{{ log.snapshot }}</code></pre>
                      </details>
                    }
                  </div>
                </article>
              }
            }
          </div>
        </section>
      }

      <!-- Botão Flutuante do Simulador Transacional em Tempo Real -->
      <button type="button" class="floating-simulator" (click)="showImpactModal.set(true)">
        <span>ϟ</span> ⚡ Simulador em Tempo Real
      </button>

      <!-- Modal de Simulação Retrospectiva / Governança -->
      @if (selectedGovernanceRuleId()) {
        <app-impact 
          [ruleId]="selectedGovernanceRuleId()" 
          (close)="selectedGovernanceRuleId.set(null)" 
        />
      }

      <!-- Modal de Simulação Transacional do Lojista -->
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
  
  readonly activeTab = signal<'regras' | 'auditoria'>('regras');
  readonly showImpactModal = signal(false);
  readonly selectedGovernanceRuleId = signal<string | null>(null);

  readonly displayRules = computed(() => {
    return this.ruleService.filteredRules();
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

  readonly isAuditor = computed(() => this.ruleService.currentUser().role === 'AUDITOR');
  
  // Analistas e Auditores não podem ativar/desativar regras diretamente na lista de produção (RBAC)
  readonly isAuditorOrAnalista = computed(() => {
    const role = this.ruleService.currentUser().role;
    return role === 'AUDITOR' || role === 'ANALISTA';
  });

  toggleActive(rule: Rule) {
    this.ruleService.toggleRuleStatus(rule.id);
  }

  edit(rule: Rule) {
    this.router.navigate(['/regras/editar', rule.id]);
  }

  duplicate(rule: Rule) {
    this.ruleService.duplicateRule(rule.id);
  }

  delete(rule: Rule) {
    if (confirm(`Tem certeza de que deseja excluir permanentemente a regra "${rule.name}"?`)) {
      this.ruleService.deleteRule(rule.id);
    }
  }

  openGovernanceModal(ruleId: string) {
    this.selectedGovernanceRuleId.set(ruleId);
  }

  resetDefaultRules() {
    if (confirm('Deseja realmente limpar as customizações e redefinir as regras para o padrão de demonstração?')) {
      this.ruleService.resetToDefaultRules();
    }
  }

  shortStore(rule: Rule): string {
    if (rule.storeId === 'store-1') return 'Loja 1';
    if (rule.storeId === 'store-2') return 'Loja 2';
    if (rule.storeId === 'store-3') return 'Loja 3';
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

  actionLabel(rule: Rule): string {
    return rule.action === 'APPROVE' ? 'APROVAR' : rule.action === 'DECLINE' ? 'NEGAR' : 'REVISAR';
  }

  // Calcula tempo decorrido do Ghost Mode
  getGhostTimeText(rule: Rule): string {
    if (!rule.ghostStartedAt) return 'Iniciando...';
    const start = new Date(rule.ghostStartedAt).getTime();
    const now = new Date().getTime();
    const diffMs = now - start;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 24) {
      return '24h+ completadas (Pronto)';
    }

    const hoursRemaining = Math.max(0, 24 - diffHours);
    if (hoursRemaining < 1) {
      return `Restam ${Math.round(hoursRemaining * 60)} min`;
    }
    return `Faltam ~${Math.ceil(hoursRemaining)}h`;
  }
}
