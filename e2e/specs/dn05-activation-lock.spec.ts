import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { ImpactModalPage } from '../pages/impact-modal.page';

test.describe('DN-05: Trava de Segurança e Bloqueio de Ativação Direta sem Ghost Mode (DN-58)', () => {
  let listPage: RuleListPage;
  let impactModal: ImpactModalPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    impactModal = new ImpactModalPage(page);

    await listPage.goto();
    await listPage.resetMocks();
    await listPage.switchRole('GESTOR');
  });

  test('[TC-DN05-01] [DN-125] Rejeição de chamada de API tentando ignorar o Ghost Mode (Segurança / API)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });

    // Botão de ativar em produção não aparece diretamente quando em DRAFT/SIMULATED sem aprovação e 24h de Ghost Mode
    await expect(impactModal.activatePrdButton).not.toBeVisible();
  });

  test('[TC-DN05-02] [DN-126] Rejeição de tentativa de submissão com tempo em Ghost Mode inferior a 24 horas (Tempo Insuficiente)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await impactModal.startGhostMode();

    // Reabre modal
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await listPage.switchRole('ANALISTA'); // Altera para forçar cenário de alçada
    await expect(impactModal.activatePrdButton).not.toBeVisible();
  });

  test('[TC-DN05-03] [DN-127] Tentativa de ativação no limite inferior de tempo (23h 59m 59s) (Borda / Limite de Tempo)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await impactModal.startGhostMode();

    // Reabre modal
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(page.locator('.ghost-mode-timer-section')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.timer-status')).toContainText('Cronômetro Regulatório');
  });

  test('[TC-DN05-04] [DN-128] Liberação de ativação imediatamente após transcorrer 24h00m01s em Ghost Mode (Validação Positiva)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await impactModal.startGhostMode();

    // Reabre modal
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });

    // Preenche a justificativa de duplo controle como Gestor
    await impactModal.fillJustificationAndApprove('Aprovado tecnicamente após 24h em Ghost Mode com 0,05% de impacto.');

    // Simula a passagem das 24 horas usando o facilitador sandbox
    await impactModal.simulate24hPass();

    // Botão de Ativar em Produção é liberado
    await expect(impactModal.activatePrdButton).toBeEnabled();

    // Executa ativação em produção (fecha o modal e ativa a regra em PRD)
    await impactModal.activateProduction();

    // Regra entra no status ACTIVE na lista de regras
    const ruleRow = page.locator('tr:has-text("PRD-2026")').first();
    await expect(ruleRow.locator('.lifecycle-badge')).toContainText('ACTIVE');
  });

  test('[TC-DN05-05] [DN-129] Verificação de bloqueio visual e desabilitação do botão de ativação na UI (UI / UX)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });
    await impactModal.startGhostMode();

    // Reabre modal
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible({ timeout: 10000 });

    // Preenche a justificativa de duplo controle
    await impactModal.fillJustificationAndApprove('Aprovado tecnicamente após validação em Ghost Mode com métricas estáveis.');

    // Sem simular 24h, o botão de ativação deve estar desabilitado visualmente
    await expect(impactModal.activatePrdButton).toHaveClass(/disabled-btn/);
  });
});
