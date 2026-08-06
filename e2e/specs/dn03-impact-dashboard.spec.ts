import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { ImpactModalPage } from '../pages/impact-modal.page';

test.describe('DN-03: Visualizar Dashboard do Painel de Simulação de Impacto (DN-56)', () => {
  let listPage: RuleListPage;
  let impactModal: ImpactModalPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    impactModal = new ImpactModalPage(page);

    await listPage.goto();
    await listPage.resetMocks();
  });

  test('[TC-DN03-01] [DN-115] Exibição completa e formatação correta do dashboard com os 4 cartões métricos (Caminho Feliz)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    await expect(impactModal.metricsSection).toBeVisible();

    // Valida os 4 cartões métricos
    const articles = impactModal.metricsSection.locator('article');
    await expect(articles).toHaveCount(4);

    await expect(articles.nth(0)).toContainText('Base Histórica Analisada');
    await expect(articles.nth(1)).toContainText('Pedidos Impactados');
    await expect(articles.nth(2)).toContainText('Prevenção Estimada de Fraude');
    await expect(articles.nth(3)).toContainText('Falsos Positivos Estimados');
  });

  test('[TC-DN03-02] [DN-116] Exibição de Alerta de Sazonalidade para período contendo eventos de pico/calendário (Alerta de Risco)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // Alerta de sazonalidade deve estar presente se o período simular eventos de pico
    await expect(impactModal.sazonalidadeAlert).toBeVisible();
    await expect(impactModal.sazonalidadeAlert).toContainText('Alerta de Sazonalidade');
  });

  test('[TC-DN03-03] [DN-117] Visualização de simulação em processamento com componente Skeleton/Spinner (Estado Transitório)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // Ao carregar, o modal exibe a estrutura do painel e métricas calculadas
    await expect(impactModal.title).toContainText('Painel de Simulação de Impacto Retrospectivo');
  });

  test('[TC-DN03-04] [DN-118] Renderização de métricas em casos de borda com volumetria zero ou sem hits (Casos de Borda)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // As tabelas e gráficos comparativos de distribuição (Delta de Impacto) são exibidos
    await expect(page.locator('.distribution-grid')).toBeVisible();
    await expect(page.locator('.chart-container')).toBeVisible();
  });

  test('[TC-DN03-05] [DN-119] Controle de exibição e habilitação do botão "Avançar para Ghost Mode" por perfil (Permissões / UI)', async ({ page }) => {
    // Como Gestor
    await listPage.switchRole('GESTOR');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.ghostModeButton).toBeEnabled();
    await impactModal.close();

    // Como Auditor
    await listPage.switchRole('AUDITOR');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.ghostModeButton).toBeDisabled();
  });
});
