import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RuleService } from '../../services/rule.service';
import { Rule } from '../../models/rule.model';

@Component({
  selector: 'app-rule-list',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="rule-list-container">
      <!-- Executive Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Portal Antifraude</a>
        <span class="sep">/</span>
        <a routerLink="/">Engine de Risco</a>
        <span class="sep">/</span>
        <span class="active">Regras Globais e por Loja</span>
      </nav>

      <!-- Action & Filter Bar -->
      <div class="page-header">
        <div class="header-left">
          <div class="title-with-badge">
            <h1 class="page-title">
              @if (ruleService.searchQuery()) {
                Resultados para "{{ ruleService.searchQuery() }}"
              } @else {
                Gestão de Regras Antifraude
              }
            </h1>
            <span class="kpi-live-tag">LIVE ENGINE</span>
          </div>

          <div class="scope-indicator" [class.global]="ruleService.currentStore().id === 'ALL'">
            <span class="indicator-tag">{{ ruleService.currentStore().id === 'ALL' ? 'GLOBAL' : 'LOJA' }}</span>
            <span class="indicator-text">
              @if (ruleService.currentStore().id === 'ALL') {
                Escopo: <strong>Regras Globais</strong> (Todas as Lojas)
              } @else {
                Filtrado para a loja: <strong>{{ ruleService.currentStore().name }}</strong>
              }
            </span>
          </div>
        </div>

        <div class="header-actions">
          <a routerLink="/regras/nova" class="btn-eq-primary">
            <span class="btn-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span> 
            Nova Regra Antifraude
          </a>
        </div>
      </div>

      <!-- Stats Summary KPI Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-total">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalRulesCount() }}</span>
            <span class="stat-label">Total de Regras</span>
          </div>
          <div class="stat-trend trend-neutral">
            <span>100% visível</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-active">
            <span class="pulse-dot"></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value text-success">{{ activeRulesCount() }}</span>
            <span class="stat-label">Regras Ativas</span>
          </div>
          <div class="stat-trend trend-positive">
            <span>Em Produção</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-global">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value text-global">{{ globalRulesCount() }}</span>
            <span class="stat-label">Regras Globais</span>
          </div>
          <div class="stat-trend trend-info">
            <span>Todas as Lojas</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-ghost">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value text-ghost">{{ ghostRulesCount() }}</span>
            <span class="stat-label">Ghost Mode (A/B)</span>
          </div>
          <div class="stat-trend trend-warning">
            <span>Modo Fantasma</span>
          </div>
        </div>
      </div>


      <!-- Table Section -->
      <div class="card-table">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-title">Matriz de Regras de Risco</span>
            <span class="toolbar-count">Exibindo {{ ruleService.filteredRules().length }} de {{ ruleService.rules().length }} regras</span>
          </div>

          <div class="toolbar-right">
            @if (ruleService.searchQuery()) {
              <button class="btn-clear-filter" (click)="clearFilters()">
                ✕ Limpar busca
              </button>
            }
          </div>
        </div>

        <div class="table-responsive">
          <table class="app-table">

            <thead>
              <tr>
                <th style="width: 70px;">Status</th>
                <th style="width: 130px;">Escopo</th>
                <th style="width: 90px;">Prioridade</th>
                <th>Nome da Regra</th>
                <th>Descrição</th>
                <th style="width: 100px;">Camada</th>
                <th>Pagamento</th>
                <th style="width: 120px;">Ação Antifraude</th>
                <th style="width: 100px;">Criada</th>
                <th style="width: 100px;">Atualizada</th>
                <th style="text-align: center; width: 130px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (rule of ruleService.filteredRules(); track rule.id) {
                <tr [class.inactive]="!rule.active" [class.ghost-row]="rule.ghostMode">
                  <!-- Status Toggle -->
                  <td class="col-status">
                    <label class="switch-toggle" [title]="rule.active ? 'Regra Ativa (clique para desativar)' : 'Regra Inativa (clique para ativar)'">
                      <input 
                        type="checkbox" 
                        [checked]="rule.active" 
                        (change)="onToggleStatus(rule.id)"
                      />
                      <span class="slider"></span>
                    </label>
                  </td>

                  <!-- Scope -->
                  <td>
                    @if (rule.storeId === 'ALL') {
                      <span class="badge badge-global" title="Regra atua em todas as lojas">
                        <span class="badge-dot"></span> Global
                      </span>
                    } @else {
                      <span class="badge badge-store" title="Regra específica desta loja">
                        <span class="badge-dot"></span> {{ rule.storeName }}
                      </span>
                    }
                  </td>

                  <!-- Priority -->
                  <td>
                    <span class="priority-badge" [title]="'Prioridade #' + rule.priority">
                      #{{ rule.priority < 10 ? '0' + rule.priority : rule.priority }}
                    </span>
                  </td>

                  <!-- Name -->
                  <td>
                    <div class="rule-name-wrapper">
                      <strong class="rule-name">{{ rule.name }}</strong>
                      @if (rule.ghostMode) {
                        <span class="badge badge-ghost" title="Ghost Mode ativo: simula impacto sem alterar decisão real">
                          Ghost Mode
                        </span>
                      }
                    </div>
                  </td>

                  <!-- Description -->
                  <td class="col-description">
                    <span class="text-muted">{{ rule.description || 'Sem descrição cadastrada.' }}</span>
                  </td>

                  <!-- Layer -->
                  <td>
                    <span class="layer-tag" [class.layer-2nd]="rule.layer === '2nd'">
                      {{ rule.layer === '1st' ? '1ª Camada' : '2ª Camada' }}
                    </span>
                  </td>

                  <!-- Payments -->
                  <td>
                    <div class="payment-tags">
                      @for (p of rule.payments; track p) {
                        <span class="payment-badge">{{ formatPaymentName(p) }}</span>
                      }
                    </div>
                  </td>

                  <!-- Action / Decision -->
                  <td>
                    <span class="action-badge" [class]="'action-' + rule.action.toLowerCase()">
                      @switch (rule.action) {
                        @case ('APPROVE') {
                          Aprovar
                        }
                        @case ('REVIEW') {
                          Revisar
                        }
                        @case ('DECLINE') {
                          Negar
                        }
                      }
                    </span>
                  </td>

                  <!-- Dates -->
                  <td class="col-date">{{ rule.createdAt }}</td>
                  <td class="col-date">{{ rule.updatedAt }}</td>

                  <!-- Actions / Options -->
                  <td class="col-actions">
                    <div class="actions-group">
                      <button 
                        class="btn-icon-action btn-edit" 
                        title="Editar Regra"
                        (click)="onEditRule(rule.id)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>

                      <button 
                        class="btn-icon-action btn-duplicate" 
                        title="Duplicar Regra"
                        (click)="onDuplicateRule(rule.id)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>

                      <button 
                        class="btn-icon-action btn-delete" 
                        title="Excluir Regra"
                        (click)="onDeleteRule(rule)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="11" class="empty-state">
                    <div class="empty-content">
                      <span class="empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </span>
                      <h3>Nenhuma regra encontrada</h3>
                      <p>Não encontramos regras que coincidam com o termo de busca ou filtro de loja atual.</p>
                      <button class="btn-eq-secondary" (click)="clearFilters()">Limpar filtros de busca</button>
                    </div>
                  </td>
                </tr>
              }

            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './rule-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleListComponent {
  readonly ruleService = inject(RuleService);
  private readonly router = inject(Router);

  readonly totalRulesCount = computed(() => this.ruleService.filteredRules().length);
  readonly activeRulesCount = computed(() => this.ruleService.filteredRules().filter(r => r.active).length);
  readonly globalRulesCount = computed(() => this.ruleService.filteredRules().filter(r => r.storeId === 'ALL').length);
  readonly ghostRulesCount = computed(() => this.ruleService.filteredRules().filter(r => r.ghostMode).length);

  onToggleStatus(ruleId: string) {
    this.ruleService.toggleRuleStatus(ruleId);
  }

  onEditRule(ruleId: string) {
    this.router.navigate(['/regras/editar', ruleId]);
  }

  onDuplicateRule(ruleId: string) {
    this.ruleService.duplicateRule(ruleId);
  }

  onDeleteRule(rule: Rule) {
    if (confirm(`Tem certeza que deseja excluir a regra "${rule.name}"?`)) {
      this.ruleService.deleteRule(rule.id);
    }
  }

  clearFilters() {
    this.ruleService.setSearchQuery('');
  }

  formatPaymentName(p: string): string {
    switch (p) {
      case 'cartao': return 'Cartão';
      case 'pix': return 'PIX / EAD';
      case 'voucher': return 'Voucher';
      case 'boleto': return 'Boleto';
      default: return p;
    }
  }
}
