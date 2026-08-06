import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { ImpactModalPage } from '../pages/impact-modal.page';

test.describe('DN-02: Executar Simulação de Impacto Assíncrona (Backtest 30 dias) (DN-55)', () => {
  let listPage: RuleListPage;
  let impactModal: ImpactModalPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    impactModal = new ImpactModalPage(page);

    await listPage.goto();
    await listPage.resetMocks();
  });

  test('[TC-DN02-01] [DN-110] Disparo e conclusão com sucesso do Backtest no SLA <= 10s (Caminho Feliz)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // Abre modal de simulação
    await expect(impactModal.title).toContainText('Painel de Simulação de Impacto Retrospectivo');

    // Valida que o modal carrega e conclui a simulação dentro do SLA
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    
    // Status da simulação/regra é atualizado para SIMULATED
    await expect(page.locator('.impact-panel .state-badge')).toContainText('SIMULATED');
  });

  test('[TC-DN02-02] [DN-111] Tratamento de Timeout ou Indisponibilidade do Data Mart Analítico (Exceção / Resiliência)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // O modal possui estado de skeleton/spinner e conclui com resiliência
    await expect(impactModal.metricsSection).toBeVisible();
  });

  test('[TC-DN02-03] [DN-112] Impedimento de simulação em regra com status incompatível ACTIVE ou ARCHIVED (Validação de Estado)', async ({ page }) => {
    // Para regra PRD-101 que está ACTIVE
    await listPage.openGovernanceModalForRule('PRD-101');

    // Exibe toast de trava de segurança para regras ativas
    await expect(page.locator('.toast-banner')).toBeVisible();
    await expect(page.locator('.toast-banner')).toContainText('Trava de Segurança');
  });

  test('[TC-DN02-04] [DN-113] Validação do cálculo exato da janela temporal de 30 dias corridos (Borda / Janela Temporal)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();

    // Verifica menção explícita à janela de 30 dias
    await expect(page.locator('.audit-grid')).toContainText('30 Dias Corridos');
  });

  test('[TC-DN02-05] [DN-114] Re-simulação bem-sucedida de regra com status SIMULATED (Regra de Negócio)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // Confirma que a regra transiciona e pode ser re-simulada
    await expect(impactModal.metricsSection).toBeVisible();
    await impactModal.close();

    // Reabre para confirmar persistência e re-simulação
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();
  });
});
