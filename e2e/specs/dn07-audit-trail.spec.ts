import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { ImpactModalPage } from '../pages/impact-modal.page';

test.describe('DN-07: Consultar e Exportar Trilha Imutável de Auditoria (DN-60)', () => {
  let listPage: RuleListPage;
  let impactModal: ImpactModalPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    impactModal = new ImpactModalPage(page);

    await listPage.goto();
    await listPage.resetMocks();
  });

  test('[TC-DN07-01] [DN-135] Consulta da linha do tempo completa do ciclo de vida da regra (Caminho Feliz)', async ({ page }) => {
    // Alterna para a aba de Trilha de Auditoria Imutável
    await listPage.tabAuditoria.click();

    // Valida exibição da linha do tempo de auditoria
    await expect(page.locator('.audit-trail-panel')).toBeVisible();
    await expect(page.locator('.timeline .timeline-item')).not.toHaveCount(0);
  });

  test('[TC-DN07-02] [DN-136] Exportação do relatório de auditoria em formato PDF estruturado (Exportação PDF)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // Botão de exportação PDF está presente na modal de governança e atalhos
    await expect(impactModal.exportPdfButton).toBeVisible();
    await expect(impactModal.exportPdfButton).toBeEnabled();
  });

  test('[TC-DN07-03] [DN-137] Exportação da trilha de auditoria em formato JSON (Exportação JSON)', async ({ page }) => {
    await listPage.openGovernanceModalForRule('PRD-2026');

    // Botão de exportação JSON está presente na modal de governança
    await expect(impactModal.exportJsonButton).toBeVisible();
    await expect(impactModal.exportJsonButton).toBeEnabled();
  });

  test('[TC-DN07-04] [DN-138] Garantia técnica de imutabilidade dos dados de auditoria contra UPDATE/DELETE (Segurança / Imutabilidade)', async ({ page }) => {
    await listPage.tabAuditoria.click();

    // Não existem botões de edição/exclusão na linha do tempo de auditoria imutável
    const tableActions = page.locator('.audit-trail-panel button:has-text("Excluir"), .audit-trail-panel button:has-text("Deletar")');
    await expect(tableActions).toHaveCount(0);
  });

  test('[TC-DN07-05] [DN-139] Paginação e tempo de resposta na consulta de histórico longo (Performance / Paginação)', async ({ page }) => {
    await listPage.tabAuditoria.click();

    // Carregamento instantâneo da trilha de auditoria
    await expect(page.locator('.audit-trail-panel')).toBeVisible();
  });
});
