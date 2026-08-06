import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { ImpactModalPage } from '../pages/impact-modal.page';

test.describe('DN-06: Aprovar e Ativar Regra Antifraude com Duplo Controle (DN-59)', () => {
  let listPage: RuleListPage;
  let impactModal: ImpactModalPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    impactModal = new ImpactModalPage(page);

    await listPage.goto();
    await listPage.resetMocks();
  });

  test('[TC-DN06-01] [DN-130] Aprovação e ativação efetuada com sucesso por Gestor elegível (Caminho Feliz / Duplo Controle)', async ({ page }) => {
    // Como Gestor 'Lucas Ribeiro' (diferente da criadora 'Mariana Silva')
    await listPage.switchRole('GESTOR');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();

    // Preenche justificativa válida com mais de 20 caracteres
    await impactModal.fillJustificationAndApprove('Aprovado tecnicamente após 24h em Ghost Mode com 0,05% de taxa de impacto e 0 falsos positivos.');

    // Exibe banner de aprovação concedida com sucesso
    await expect(page.locator('.approved-banner')).toBeVisible();
    await expect(page.locator('.approved-banner')).toContainText('Regra Aprovada com Sucesso');
  });

  test('[TC-DN06-02] [DN-131] Bloqueio de tentativa de autoaprovação pelo próprio autor da regra (Violação do Duplo Controle)', async ({ page }) => {
    // A regra PRD-2026 foi criada por Mariana Silva (Analista)
    // Se alternar para ANALISTA (Mariana Silva)
    await listPage.switchRole('ANALISTA');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();

    // Exibe bloqueio de autoaprovação / duplo controle
    await expect(page.locator('.duplo-controle-section')).toContainText('Bloqueio de Autoaprovação');
  });

  test('[TC-DN06-03] [DN-132] Tentativa de aprovação com justificativa curta ou ausente (< 20 caracteres) (Validação de Entrada)', async ({ page }) => {
    await listPage.switchRole('GESTOR');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();

    // Digita justificativa curta (< 20 caracteres)
    await impactModal.approvalJustificationInput.fill('Aprovado');

    // Botão de homologar deve estar desabilitado
    await expect(impactModal.approveButton).toBeDisabled();
  });

  test('[TC-DN06-04] [DN-133] Verificação de transição de comportamento no Engine de Decisão para ação REVIEW (Integração)', async ({ page }) => {
    await listPage.switchRole('GESTOR');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();

    // Valida que a ação homologada é REVIEW
    await expect(page.locator('.impact-panel')).toContainText('REVISAR');
  });

  test('[TC-DN06-05] [DN-134] Validação da geração do Snapshot JSON imutável de auditoria no momento da aprovação (Auditoria)', async ({ page }) => {
    await listPage.switchRole('GESTOR');
    await listPage.openGovernanceModalForRule('PRD-2026');
    await expect(impactModal.metricsSection).toBeVisible();
    await impactModal.fillJustificationAndApprove('Aprovado tecnicamente sob diretrizes regulatórias com snapshot completo de auditoria.');

    // Valida menção ao Snapshot JSON
    await expect(page.locator('.approved-banner .snapshot-hint')).toContainText('Snapshot JSON imutável de auditoria');
  });
});
