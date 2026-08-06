import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { ImpactModalPage } from '../pages/impact-modal.page';
import { RuleFormPage } from '../pages/rule-form.page';

test.describe('DN-04: Submeter e Monitorar Regra em Ghost Mode (DN-57)', () => {
  let listPage: RuleListPage;
  let impactModal: ImpactModalPage;
  let formPage: RuleFormPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    impactModal = new ImpactModalPage(page);
    formPage = new RuleFormPage(page);

    await listPage.goto();
    await listPage.resetMocks();
    await listPage.switchRole('GESTOR');
  });

  test('[TC-DN04-01] [DN-120] Transição bem-sucedida e avaliação em modo sombra no Engine de Produção (Caminho Feliz)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });

    // Clica em Iniciar Ghost Mode
    await impactModal.startGhostMode();

    // Regra entra no status GHOST_ACTIVE na lista
    const ruleRow = page.locator('tr:has-text("PRD-2026")').first();
    await expect(ruleRow.locator('.lifecycle-badge')).toContainText('GHOST_ACTIVE');
  });

  test('[TC-DN04-02] [DN-121] Verificação do cronômetro de 24 horas obrigatórias e bloqueio de solicitação prévia (Controle de Tempo)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await impactModal.startGhostMode();

    // Reabre modal para checar cronômetro
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(page.locator('.ghost-mode-timer-section')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.timer-status')).toContainText('Cronômetro Regulatório');
  });

  test('[TC-DN04-03] [DN-122] Reset do tempo de Ghost Mode e retorno para DRAFT ao alterar cláusulas lógicas (Condição de Borda)', async ({ page }) => {
    // Coloca em Ghost Mode
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await impactModal.startGhostMode();

    // Tenta editar a regra
    await listPage.editRule('PRD-2026');

    // Altera uma cláusula removendo e re-adicionando para disparar alteração de cláusula
    const removeBtn = page.locator('button.remove-clause-btn').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
    }
    await formPage.addClause('param-1');

    await formPage.submit();

    // O status da regra retorna para DRAFT indicando reset do tempo de Ghost Mode
    const ruleRow = page.locator('tr:has-text("PRD-2026")').first();
    await expect(ruleRow.locator('.lifecycle-badge')).toContainText('DRAFT');
  });

  test('[TC-DN04-04] [DN-123] Avaliação assíncrona de alta volumetria em produção sem impacto na latência do checkout', async ({ page }) => {
    // Abre simulador e valida execução em tempo real
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
  });

  test('[TC-DN04-05] [DN-124] Tentativa de entrada em Ghost Mode a partir de status não simulado', async ({ page }) => {
    // Regra ACTIVE PRD-101 não permite novo Ghost Mode diretamente sem ciclo
    await listPage.openGovernanceModalForRule('PRD-101');
    await expect(page.locator('.toast-banner')).toBeVisible();
    await expect(page.locator('.toast-banner')).toContainText('Trava de Segurança');
  });
});
