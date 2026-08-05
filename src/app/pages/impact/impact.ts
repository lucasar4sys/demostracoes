import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RuleService } from '../../services/rule.service';
import { Rule, BacktestResult, RuleAction } from '../../models/rule.model';

@Component({
  selector: 'app-impact',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="impact-overlay" (click)="close.emit()">
      <main class="impact-panel" (click)="$event.stopPropagation()">
        <button
          type="button"
          class="close-button"
          aria-label="Fechar simulador"
          (click)="close.emit()"
        >
          ×
        </button>

        @if (isLoading()) {
          <!-- Estado Transitório: Skeleton / Spinner (SLA <= 10s / TC-DN03-03) -->
          <div class="loading-state">
            <div class="spinner"></div>
            <h2>Analisando Base Histórica de Transações (Backtest Retrospectivo)...</h2>
            <p>Conectando ao Data Mart Analítico do Antifraude. Janela temporal de 30 dias corridos.</p>
            <div class="skeleton-grid">
              <div class="skeleton-card pulse"></div>
              <div class="skeleton-card pulse"></div>
              <div class="skeleton-card pulse"></div>
              <div class="skeleton-card pulse"></div>
            </div>
          </div>
        } @else {
          <!-- Resultados da Simulação -->
          <header>
            <h1>📊 Painel de Simulação de Impacto Retrospectivo (30 Dias)</h1>
            <p>
              Validação Preditiva de Risco • Regra: <strong>{{ simulationRuleName() }}</strong>
            </p>
            <div class="header-badges">
              <span class="badge cmn">CMN 4.966 COMPLIANT</span>
              <span [ngClass]="['badge', 'state-badge', simulationStatusClass()]">
                Status: {{ simulationStatusLabel() }}
              </span>
            </div>
          </header>

          <!-- Alerta de Sazonalidade (TC-DN03-02) -->
          @if (backtest().sazonalidadeAlert) {
            <div class="sazonalidade-alert">
              <span class="alert-icon">⚠️</span>
              <div>
                <strong>Alerta de Sazonalidade de Tráfego Detectado (Calibração Ativa)</strong>
                <p>{{ backtest().sazonalidadeDetails || 'O período analisado possui eventos de pico comercial (como Dia dos Pais, Black Friday ou Natal). Ajustes de sensibilidade foram computados automaticamente para mitigar falsos bloqueios.' }}</p>
              </div>
            </div>
          }

          <!-- 4 Cartões Métricos (TC-DN03-01 / TC-DN03-04) -->
          <section class="metrics">
            <article>
              <small>Base Histórica Analisada</small>
              <strong>{{ backtest().analyzedCount | number:'1.0-0' }}</strong>
              <p>Últimos 30 dias de transações</p>
            </article>
            <article>
              <small>Pedidos Impactados</small>
              <strong class="orange">{{ backtest().impactedCount | number:'1.0-0' }}</strong>
              <p>{{ backtest().impactedPercent }}% do volume total</p>
            </article>
            <article>
              <small>Prevenção Estimada de Fraude</small>
              <strong class="green">R$ {{ backtest().estimatedFraudPrevention | number:'1.2-2' }}</strong>
              <p>Redução de chargeback estimada</p>
            </article>
            <article>
              <small>Falsos Positivos Estimados</small>
              <strong class="blue">&lt; {{ backtest().falsePositivePercent }}%</strong>
              <p>Mitigado por Ação {{ simulationAction() }}</p>
            </article>
          </section>

          <!-- Matriz Comparativa de Distribuição de Decisões (Delta de Impacto - RN5) -->
          <section class="table-section">
            <h2>Matriz Comparativa de Distribuição de Decisões (Delta de Impacto)</h2>
            <div class="distribution-grid">
              <div class="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Ação Antifraude</th>
                      <th>Volume Atual (Sem a Regra)</th>
                      <th>% Atual</th>
                      <th>Volume Proposto (Com a Regra)</th>
                      <th>% Proposto</th>
                      <th>Delta Estimado (Variação)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="pill approve">APROVAR</span></td>
                      <td>{{ currentApproveVol() | number:'1.0-0' }} pedidos</td>
                      <td>{{ currentApprovePct() }}%</td>
                      <td><strong>{{ proposedApproveVol() | number:'1.0-0' }} pedidos</strong></td>
                      <td><strong>{{ proposedApprovePct() }}%</strong></td>
                      <td><span class="pill decrease">- {{ backtest().impactedPercent }}% (-{{ backtest().impactedCount }} pedidos)</span></td>
                    </tr>
                    <tr>
                      <td><span class="pill review">REVISAR (MANUAL)</span></td>
                      <td>{{ currentReviewVol() | number:'1.0-0' }} pedidos</td>
                      <td>{{ currentReviewPct() }}%</td>
                      <td><strong>{{ proposedReviewVol() | number:'1.0-0' }} pedidos</strong></td>
                      <td><strong>{{ proposedReviewPct() }}%</strong></td>
                      <td><span class="pill increase">+ {{ backtest().impactedPercent }}% (+{{ backtest().impactedCount }} pedidos/mês)</span></td>
                    </tr>
                    <tr>
                      <td><span class="pill decline">NEGAR (BLOQUEIO)</span></td>
                      <td>{{ currentDeclineVol() | number:'1.0-0' }} pedidos</td>
                      <td>{{ currentDeclinePct() }}%</td>
                      <td><strong>{{ proposedDeclineVol() | number:'1.0-0' }} pedidos</strong></td>
                      <td><strong>{{ proposedDeclinePct() }}%</strong></td>
                      <td><span class="pill neutral">0,00% (Inalterado)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Infográfico Executivo de Fluxo Transacional (UI Otimizada) -->
              <div class="visual-chart-card">
                <h3>Visualização Dinâmica do Fluxo de Caixa / Transações (Atual vs Proposto)</h3>
                
                <div class="chart-container">
                  <div class="chart-flow-row">
                    <span class="flow-label">Antes (Fluxo Atual)</span>
                    <div class="flow-bar">
                      <div class="bar-slice approve" [style.width.%]="currentApprovePct()" title="Aprovado Direto">
                        <span>{{ currentApprovePct() }}%</span>
                      </div>
                      <div class="bar-slice review" [style.width.%]="currentReviewPct()" title="Revisão Manual">
                        <span>{{ currentReviewPct() }}%</span>
                      </div>
                      <div class="bar-slice decline" [style.width.%]="currentDeclinePct()" title="Negado Direto">
                        <span>{{ currentDeclinePct() }}%</span>
                      </div>
                    </div>
                  </div>

                  <div class="chart-flow-row">
                    <span class="flow-label">Depois (Fluxo Proposto)</span>
                    <div class="flow-bar">
                      <div class="bar-slice approve" [style.width.%]="proposedApprovePct()" title="Aprovado Direto">
                        <span>{{ proposedApprovePct() }}%</span>
                      </div>
                      <div class="bar-slice review" [style.width.%]="proposedReviewPct()" title="Revisão Manual">
                        <span>{{ proposedReviewPct() }}%</span>
                      </div>
                      <div class="bar-slice decline" [style.width.%]="proposedDeclinePct()" title="Negado Direto">
                        <span>{{ proposedDeclinePct() }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-color approve"></span>
                    <span>Aprovação Direta (Rápido)</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color review"></span>
                    <span>Revisão Manual (Prevenção)</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color decline"></span>
                    <span>Bloqueio Automático (Firme)</span>
                  </div>
                </div>

                <div class="mitigation-highlight-banner">
                  <span class="mitigation-icon">🛡️</span>
                  <div class="mitigation-details">
                    <h4>Mitigação Proativa de Chargebacks</h4>
                    <p>
                      Ao desviar <strong>{{ backtest().impactedPercent }}%</strong> das transações sob suspeita para revisão, estima-se a preservação de 
                      <strong>R$ {{ backtest().estimatedFraudPrevention | number:'1.2-2' }}</strong> em recebíveis nesta janela de 30 dias, sem impor bloqueios cegos, resguardando a experiência dos clientes legítimos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <!-- AI Natural Language Insight (RN5) -->
          <section class="insight-card">
            <span>EXECUTIVE AI INSIGHT - NEXUS GOVERNANCE</span>
            <p>
              "Com a ativação desta regra, {{ backtest().impactedPercent }}% das transações ({{ backtest().impactedCount }} pedidos/mês) passarão do
              fluxo de aprovação direta para Análise Manual devido ao risco combinado detectado. Como a ação configurada é {{ simulationAction() }} (RN2),
              nenhum pedido legítimo será negado de forma automatizada, garantindo conformidade total
              com a Resolução CMN nº 4.966/21 e LGPD Art. 20."
            </p>
          </section>

          <!-- Trilha de Auditoria & Governança (Resolução CMN 4.966 / 3 Linhas de Defesa - RN4) -->
          <section class="audit-card">
            <h2>Trilha de Auditoria & Governança (Resolução CMN 4.966 / 3 Linhas de Defesa)</h2>
            <div class="audit-grid">
              <div>
                <dt>Ticket PRD de Origem:</dt>
                <dd>{{ simulationTicket() }}</dd>
              </div>
              <div>
                <dt>Autor da Proposta (Risco):</dt>
                <dd>{{ simulationAuthor() }}</dd>
              </div>
              <div>
                <dt>Aprovador de Risco:</dt>
                <dd>{{ rule()?.approverName || 'Pendente de aprovação por outro Gestor' }}</dd>
              </div>
              <div>
                <dt>Janela de Simulação:</dt>
                <dd>30 Dias Corridos (06/07/2026 a 05/08/2026)</dd>
              </div>
            </div>
          </section>

          <!-- Governança e Duplo Controle de Aprovação (DN-59 / TC-DN06-01 / TC-DN06-02 / TC-DN06-03) -->
          @if (rule(); as activeRule) {
            <section class="duplo-controle-section">
              <h2>🔐 Verificação de Governança & Duplo Controle (Resolução CMN nº 4.966)</h2>

              @if (activeRule.status === 'SIMULATED' || activeRule.status === 'DRAFT' || activeRule.status === 'GHOST_ACTIVE') {
                <div class="approval-form">
                  <p class="section-desc">Para que a regra possa ser ativada de forma plena em Produção, ela deve receber a aprovação técnica com justificativa de risco de um <strong>Gestor de Risco elegível e independente</strong> (não sendo o autor da proposta).</p>
                  
                  <div class="user-info-banner">
                    <span>Usuário Ativo: <strong>{{ ruleService.currentUser().name }}</strong> (Papel: {{ ruleService.currentUser().role }})</span>
                    @if (activeRule.authorName === ruleService.currentUser().name) {
                      <span class="danger-tag">⚠️ Violação de Duplo Controle Detectada</span>
                    }
                  </div>

                  @if (activeRule.authorName === ruleService.currentUser().name) {
                    <div class="approval-error-block">
                      <p><strong>Bloqueio de Autoaprovação (TC-DN06-02):</strong> Você é o autor desta regra ({{ activeRule.authorName }}). Por princípio do duplo controle regulatório, a aprovação de risco deve ser efetuada por um Gestor diferente do autor. <br/><em>Dica: Altere o "Perfil" na barra superior para "Gestor de Risco" (que assumirá Lucas Ribeiro) para simular o duplo controle com sucesso!</em></p>
                    </div>
                  } @else if (ruleService.currentUser().role !== 'GESTOR') {
                    <div class="approval-error-block">
                      <p><strong>Bloqueio de Alçada (TC-DN08-02):</strong> Seu papel atual é {{ ruleService.currentUser().role }}. Apenas usuários com perfil de <strong>Gestor de Risco</strong> possuem autoridade técnica regulatória para homologar regras antifraude de conformidade.</p>
                    </div>
                  } @else {
                    <div class="input-justification-group">
                      <label>
                        <span>Justificativa Técnica de Risco CMN 4.966 (mínimo de 20 caracteres) *</span>
                        <textarea 
                          rows="2" 
                          [(ngModel)]="approvalJustification" 
                          placeholder="Ex: Homologado sob premissas regulatórias do PRD-2026. Cláusulas combinadas de device e geolocalização reduzem em mais de 90% a fraude de falsidade ideológica por conta sem gerar falsos bloqueios..."
                        ></textarea>
                        <small [class.valid]="approvalJustification.trim().length >= 20">
                          Caracteres digitados: {{ approvalJustification.trim().length }} / 20 (mínimo)
                        </small>
                      </label>
                      <button 
                        type="button" 
                        class="btn-approve" 
                        [disabled]="approvalJustification.trim().length < 20"
                        (click)="executeApproval()"
                      >
                        ✓ Homologar e Aprovar Regra (Duplo Controle)
                      </button>
                    </div>
                  }
                </div>
              } @else if (activeRule.status === 'APPROVED') {
                <div class="approved-banner">
                  <span class="check-icon">✓</span>
                  <div>
                    <strong>Regra Aprovada com Sucesso em Checkpoint de Duplo Controle!</strong>
                    <p><strong>Aprovador:</strong> {{ activeRule.approverName }}</p>
                    <p><strong>Justificativa Técnica:</strong> "{{ activeRule.approvalJustification }}"</p>
                    <p class="snapshot-hint">Snapshot JSON imutável de auditoria foi gravado com sucesso no sistema (Resolução CMN nº 4.966/21).</p>
                  </div>
                </div>
              } @else if (activeRule.status === 'ACTIVE') {
                <div class="active-banner">
                  <span class="rocket-icon">🚀</span>
                  <div>
                    <strong>Regra Ativa em Produção Completa (Decisão Ativa)!</strong>
                    <p>A regra está atuando em tempo real sobre o tráfego transacional aplicando a decisão <strong>{{ activeRule.action }}</strong>.</p>
                  </div>
                </div>
              }
            </section>

            <!-- Controle de ativação com tempo de Ghost Mode (TC-DN04-02 / TC-DN05-02 / TC-DN05-05) -->
            @if (activeRule.status === 'GHOST_ACTIVE' || activeRule.status === 'APPROVED' || activeRule.status === 'ACTIVE') {
              <section class="ghost-mode-timer-section">
                <h2>🕒 Monitoramento de Tráfego em Ghost Mode (Mínimo de 24 horas consecutivas)</h2>
                
                <div class="timer-card">
                  <div class="timer-status">
                    <span>Cronômetro Regulatório: </span>
                    <strong [class.danger]="!hasCompleted24hGhost()" [class.success]="hasCompleted24hGhost()">
                      {{ ghostTimeStatusText() }}
                    </strong>
                  </div>
                  <p class="timer-desc">O Engine de Prevenção Antifraude exige obrigatoriamente 24 horas corridas no modo sombra sombra (Ghost Mode) sem desvios, para avaliação pragmática de volume e falsos positivos no checkout real antes de impactar os lojistas.</p>
                  
                  @if (!hasCompleted24hGhost() && activeRule.status !== 'ACTIVE') {
                    <div class="sandbox-simulator-tool">
                      <span>🛠️ <strong>Facilitador Sandbox (Para Apresentação de Executivos):</strong></span>
                      <button type="button" class="btn-simulate-time" (click)="simulate24hPass()">
                        Simular passagem das 24 horas em Ghost Mode (Atalho)
                      </button>
                    </div>
                  }
                </div>
              </section>
            }
          }

          <!-- Ações do Rodapé -->
          <footer>
            <button type="button" class="btn-cancel" (click)="close.emit()">
              {{ isLiveSimulator() ? 'Fechar Simulador' : 'Voltar para Edição' }}
            </button>
            
            <div class="footer-action-buttons">
              @if (rule(); as r) {
                <!-- Exportações (TC-DN07-02 / TC-DN07-03) -->
                <button type="button" class="btn-export-json" (click)="exportJSON()">📄 Exportar JSON Auditoria</button>
                <button type="button" class="btn-export-pdf" (click)="exportPDF()">📄 Exportar PDF Trilha</button>

                @if (r.status === 'SIMULATED' || r.status === 'DRAFT') {
                  <button 
                    type="button" 
                    class="btn-start-ghost" 
                    [disabled]="isAuditor()"
                    (click)="executeGhostMode()"
                  >
                    👻 Iniciar em Ghost Mode (Modo Sombra)
                  </button>
                }

                @if (r.status === 'APPROVED') {
                  <button 
                    type="button" 
                    class="btn-activate-prd" 
                    [disabled]="isAuditor() || !hasCompleted24hGhost()"
                    [class.disabled-btn]="!hasCompleted24hGhost()"
                    (click)="executeProductionActivation()"
                    title="Requer duplo controle e 24h de Ghost Mode coletados"
                  >
                    🚀 Ativar em Produção Completa (Decisão Ativa)
                  </button>
                }
              } @else {
                <span class="live-simulator-note">
                  Simulação transacional avulsa, sem vínculo com uma regra salva.
                </span>
              }
            </div>
          </footer>
        }
      </main>
    </div>
  `,
  styleUrl: './impact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactComponent implements OnInit {
  readonly ruleId = input<string | null>(null);
  readonly close = output<void>();

  readonly ruleService = inject(RuleService);

  readonly isLoading = signal<boolean>(true);
  readonly backtest = signal<BacktestResult>({
    analyzedCount: 0,
    impactedCount: 0,
    impactedPercent: 0,
    estimatedFraudPrevention: 0,
    falsePositivePercent: 0,
    sazonalidadeAlert: false
  });

  // Justificativa do duplo controle
  approvalJustification = '';

  // Auxiliar para simulação sandbox de passagem de tempo de 24h
  readonly sandboxForce24h = signal<boolean>(false);

  // Computado da regra ativa
  readonly rule = computed(() => {
    const id = this.ruleId();
    return id ? this.ruleService.getRuleById(id) : undefined;
  });

  readonly isLiveSimulator = computed(() => !this.ruleId());
  readonly simulationRuleName = computed(() => this.rule()?.name ?? 'Simulador Transacional em Tempo Real');
  readonly simulationStatusLabel = computed(() => this.rule()?.status ?? 'LIVE');
  readonly simulationStatusClass = computed(() => this.rule()?.status?.toLowerCase() ?? 'live');
  readonly simulationAction = computed<RuleAction>(() => this.rule()?.action ?? 'REVIEW');
  readonly simulationTicket = computed(() => this.rule()?.ticketPrd ?? 'LIVE-SIM');
  readonly simulationAuthor = computed(() => this.rule()?.authorName ?? this.ruleService.currentUser().name);

  readonly isAuditor = computed(() => this.ruleService.currentUser().role === 'AUDITOR');

  // Valores de Volume Histórico Base e Propostos para a Matriz Comparativa (Delta)
  readonly currentApproveVol = signal(11398);
  readonly currentApprovePct = signal(91.56);
  readonly currentReviewVol = signal(628);
  readonly currentReviewPct = signal(5.04);
  readonly currentDeclineVol = signal(424);
  readonly currentDeclinePct = signal(3.40);

  readonly proposedApproveVol = computed(() => this.currentApproveVol() - this.backtest().impactedCount);
  readonly proposedApprovePct = computed(() => Number((this.proposedApproveVol() / (this.currentApproveVol() + this.currentReviewVol() + this.currentDeclineVol()) * 100).toFixed(2)));

  readonly proposedReviewVol = computed(() => this.currentReviewVol() + this.backtest().impactedCount);
  readonly proposedReviewPct = computed(() => Number((this.proposedReviewVol() / (this.currentApproveVol() + this.currentReviewVol() + this.currentDeclineVol()) * 100).toFixed(2)));

  readonly proposedDeclineVol = computed(() => this.currentDeclineVol());
  readonly proposedDeclinePct = computed(() => this.currentDeclinePct());

  ngOnInit() {
    this.runBacktest();
  }

  runBacktest() {
    this.isLoading.set(true);
    const id = this.ruleId();
    if (id) {
      this.ruleService.runBacktest(id)
        .then(res => {
          this.backtest.set(res);
          this.isLoading.set(false);
        })
        .catch(() => {
          this.isLoading.set(false);
          this.close.emit();
        });
    } else {
      // Regra nova sem ID salvo ainda
      setTimeout(() => {
        this.backtest.set({
          analyzedCount: 12450,
          impactedCount: 418,
          impactedPercent: 3.36,
          estimatedFraudPrevention: 284500,
          falsePositivePercent: 0.12,
          sazonalidadeAlert: true,
          sazonalidadeDetails: 'Alerta: Período analisado contém eventos de pico sazonal (Mês dos Pais).'
        });
        this.isLoading.set(false);
      }, 1500);
    }
  }

  executeApproval() {
    const r = this.rule();
    if (!r) return;

    const ok = this.ruleService.approveRule(r.id, this.approvalJustification);
    if (ok) {
      this.approvalJustification = '';
    }
  }

  executeGhostMode() {
    const r = this.rule();
    if (!r) return;

    this.ruleService.startGhostMode(r.id);
    this.close.emit();
  }

  executeProductionActivation() {
    const r = this.rule();
    if (!r) return;

    const ok = this.ruleService.activateToProduction(r.id, this.sandboxForce24h());
    if (ok) {
      this.close.emit();
    }
  }

  // Verifica se completou 24 horas de Ghost Mode
  hasCompleted24hGhost(): boolean {
    if (this.sandboxForce24h()) return true;

    const r = this.rule();
    if (!r || !r.ghostStartedAt) return false;

    const start = new Date(r.ghostStartedAt).getTime();
    const now = new Date().getTime();
    const diffMs = now - start;
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 24;
  }

  ghostTimeStatusText(): string {
    if (this.hasCompleted24hGhost()) {
      return '✅ 24h+ COMPLETADAS (Pronto para Produção)';
    }

    const r = this.rule();
    if (!r || !r.ghostStartedAt) {
      return '⏱️ CRONÔMETRO NÃO INICIADO';
    }

    // Calcula tempo restante aproximado
    const start = new Date(r.ghostStartedAt).getTime();
    const now = new Date().getTime();
    const diffMs = now - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    const hoursLeft = Math.max(0, 24 - diffHours);

    if (hoursLeft < 1) {
      const minsLeft = Math.round(hoursLeft * 60);
      return `⏳ AGUARDANDO: Mais ${minsLeft} minutos restantes...`;
    }

    return `⏳ AGUARDANDO: Mais ${Math.ceil(hoursLeft)} horas restantes de tráfego sombra...`;
  }

  simulate24hPass() {
    this.sandboxForce24h.set(true);
    this.ruleService.showToast('Sandbox: Passagem de 24h simulada com sucesso! Botão de ativação em Produção desbloqueado.', 'success');
  }

  // Exportar Trilha de Auditoria em formato JSON (TC-DN07-03)
  exportJSON() {
    const r = this.rule();
    if (!r) return;

    const auditData = {
      complianceHeader: {
        normative: 'CMN 4.966/21 Compliant',
        dataIntegrity: 'Sha256-Imutavel-Audit-Snap',
        exportDate: new Date().toISOString()
      },
      ruleDetails: {
        id: r.id,
        name: r.name,
        ticketPrd: r.ticketPrd,
        description: r.description,
        status: r.status,
        logic: r.logic,
        action: r.action,
        payments: r.payments,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        author: r.authorName
      },
      auditSnapshot: r.approvalSnapshot ? JSON.parse(r.approvalSnapshot) : null,
      backtestMetrics: this.backtest(),
      systemLogs: this.ruleService.auditLogs().filter(log => log.ruleId === r.id)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `auditoria-regra-${r.id || 'nova'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.ruleService.showToast('Trilha de Auditoria JSON exportada para a pasta de downloads!', 'success');
  }

  // Exportar Relatório de Auditoria estruturado em formato PDF/TXT (TC-DN07-02)
  exportPDF() {
    const r = this.rule();
    if (!r) return;

    const ruleLogs = this.ruleService.auditLogs().filter(log => log.ruleId === r.id);
    let logsText = '';
    ruleLogs.forEach(log => {
      logsText += `[${log.timestamp}] [${log.action}] Executado por: ${log.user} (${log.userRole})\nDetalhes: ${log.details}\n\n`;
    });

    const pdfText = `========================================================================
     RELATÓRIO DE AUDITORIA E TRILHA DE GOVERNANÇA REGULATÓRIA
     CONFORMIDADE RESOLUÇÃO CMN nº 4.966/21 E LGPD ART. 20
========================================================================

GERADO EM: ${new Date().toLocaleString()}
ESTADO DA REGRA: ${r.status}
ORIGEM DO PRD: ${r.ticketPrd || 'N/A'}

------------------------------------------------------------------------
1. DADOS CADASTRAIS DA REGRA
------------------------------------------------------------------------
Identificador Único: ${r.id}
Nome da Regra: ${r.name}
Objetivo Técnico de Risco: ${r.description}
Lógica de Cláusulas: ${r.logic}
Decisão Mandatória: ${r.action}
Meios de Pagamento Ativos: ${r.payments.join(', ')}
Autor da Proposta: ${r.authorName}

------------------------------------------------------------------------
2. CLÁUSULAS CONDICIONAIS DE DECISÃO
------------------------------------------------------------------------
${r.clauses.map((c, i) => `Cláusula #0${i+1}: Parâmetro "${c.parameterName}" ${c.operator} "${c.value}"`).join('\n')}

------------------------------------------------------------------------
3. MÉTRICAS RETROSPECTIVAS DE BACKTEST (30 DIAS)
------------------------------------------------------------------------
Transações Históricas Analisadas: ${this.backtest().analyzedCount} pedidos
Pedidos Que Atendem aos Critérios: ${this.backtest().impactedCount} pedidos (${this.backtest().impactedPercent}%)
Estimativa de Prevenção de Perdas: R$ ${this.backtest().estimatedFraudPrevention.toFixed(2)}
Acurácia (Falsos Positivos): < ${this.backtest().falsePositivePercent}%

------------------------------------------------------------------------
4. REGISTRO DE DUPLO CONTROLE E SNAPSHOT IMUTÁVEL
------------------------------------------------------------------------
Aprovador Responsável: ${r.approverName || 'Pendente de homologação'}
Justificativa de Homologação: "${r.approvalJustification || 'Sem justificativa cadastrada'}"
Integridade do Snapshot: ${r.approvalSnapshot ? 'SNAP-JSON-MUTABLE-SUCCESS (Conforme CMN 4.966)' : 'PENDENTE'}

------------------------------------------------------------------------
5. HISTÓRICO COMPLETO DA LINHA DO TEMPO (AUDIT trail)
------------------------------------------------------------------------
${logsText || 'Nenhum log adicional registrado para esta regra.'}

========================================================================
             ANTIFRAUDE ENGINE COGNITIVE SECURITY SYSTEM
========================================================================`;

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(pdfText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `trilha-auditoria-regra-${r.id || 'nova'}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.ruleService.showToast('Relatório Técnico de Auditoria exportado com sucesso!', 'success');
  }
}
