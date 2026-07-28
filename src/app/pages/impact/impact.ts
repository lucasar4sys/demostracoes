import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-impact',
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
        <header>
          <h1>📊 Painel de Simulação de Impacto Retrospectivo (30 Dias)</h1>
          <p>
            Validação Preditiva de Risco • Regra: Bloqueio de Suspeita Device Fingerprint +
            Geolocalização Divergente
          </p>
          <span>CMN 4.966 COMPLIANT</span>
        </header>

        <section class="metrics">
          <article>
            <small>Base Histórica Analisada</small><strong>12.450</strong>
            <p>Últimos 30 dias de transações</p>
          </article>
          <article>
            <small>Pedidos Impactados</small><strong class="orange">418</strong>
            <p>3,36% do volume total</p>
          </article>
          <article>
            <small>Prevenção Estimada de Fraude</small><strong class="green">R$ 284.500</strong>
            <p>Redução de chargeback por conta</p>
          </article>
          <article>
            <small>Falsos Positivos Estimados</small><strong class="blue">&lt; 0,12%</strong>
            <p>Mitigado por Ação REVISAR</p>
          </article>
        </section>

        <section>
          <h2>Matriz Comparativa de Distribuição de Decisões (Delta de Impacto)</h2>
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
                  <td>11.398 pedidos</td>
                  <td>91,56%</td>
                  <td><strong>10.980 pedidos</strong></td>
                  <td><strong>88,20%</strong></td>
                  <td><span class="pill decrease">- 3,36% (-418 pedidos)</span></td>
                </tr>
                <tr>
                  <td><span class="pill review">REVISAR (MANUAL)</span></td>
                  <td>628 pedidos</td>
                  <td>5,04%</td>
                  <td><strong>1.046 pedidos</strong></td>
                  <td><strong>8,40%</strong></td>
                  <td><span class="pill increase">+ 3,36% (+418 pedidos/mês)</span></td>
                </tr>
                <tr>
                  <td><span class="pill decline">NEGAR (BLOQUEIO)</span></td>
                  <td>424 pedidos</td>
                  <td>3,40%</td>
                  <td><strong>424 pedidos</strong></td>
                  <td><strong>3,40%</strong></td>
                  <td><span class="pill neutral">0,00% (Inalterado)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="insight-card">
          <span>EXECUTIVE AI INSIGHT - NEXUS GOVERNANCE</span>
          <p>
            "Com a ativação desta nova regra, 3,36% das transações (418 pedidos/mês) passarão do
            fluxo de aprovação direta para Análise Manual devido ao risco combinado de Device
            Fingerprint reutilizado E Geolocalização divergente. Como a ação configurada é REVISAR
            (RN2), nenhum pedido legítimo será negado automaticamente, garantindo conformidade total
            com a Resolução CMN nº 4.966/21 e LGPD Art. 20."
          </p>
        </section>

        <section class="audit-card">
          <h2>Trilha de Auditoria & Governança (Resolução CMN 4.966 / 3 Linhas de Defesa)</h2>
          <dl>
            <dt>PRD de Origem:</dt>
            <dd>PRD - Antifraude Device Fingerprint Geolocalização</dd>
            <dt>Autor da Proposta:</dt>
            <dd>Nexus AI Agent (Condução Automática)</dd>
            <dt>Aprovador de Risco:</dt>
            <dd>Comitê de Risco Equifax | Boa Vista</dd>
            <dt>Status de Validação:</dt>
            <dd>Aprovado em Ghost Mode (0 falsos bloqueios)</dd>
          </dl>
        </section>

        <footer>
          <button type="button" (click)="close.emit()">Voltar para Edição</button>
          <button>📄 Exportar Relatório Auditoria PDF</button>
          <button class="ghost">👻 Confirmar e Ativar em Ghost Mode</button>
          <button class="production">🚀 Confirmar e Ativar em Produção</button>
        </footer>
      </main>
    </div>
  `,
  styleUrl: './impact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactComponent {
  readonly close = output<void>();
}
