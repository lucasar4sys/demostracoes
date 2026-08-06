import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';
import { RuleFormPage } from '../pages/rule-form.page';

test.describe('DN-01: Criar e Configurar Regra Antifraude Combinada (DN-54)', () => {
  let listPage: RuleListPage;
  let formPage: RuleFormPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);
    formPage = new RuleFormPage(page);

    await listPage.goto();
    await listPage.resetMocks();
    await listPage.switchRole('ANALISTA');
  });

  test('[TC-DN01-01] [DN-104] Cadastro bem-sucedido de regra antifraude combinada com parâmetros válidos (Caminho Feliz)', async ({ page }) => {
    await formPage.gotoNew();

    // Preenche o formulário com parâmetros válidos
    await formPage.fillForm({
      name: 'Regra Suspeita Device + Geo Divergente AutoTest',
      ticketPrd: 'PRD-2026',
      description: 'Validação de fraude por fingerprint e geolocalização divergente',
      logic: 'AND',
      action: 'REVIEW'
    });

    await formPage.submit();

    // Redireciona para a lista de regras em status DRAFT
    await expect(page).toHaveURL('/regras');
    const newRuleRow = page.locator('tr:has-text("PRD-2026")').first();
    await expect(newRuleRow).toBeVisible();
    await expect(newRuleRow.locator('.lifecycle-badge')).toContainText('DRAFT');
  });

  test('[TC-DN01-02] [DN-105] Rejeição ao tentar utilizar operador lógico OU ou ação Negar/Aprovar (Validação Negativa)', async ({ page }) => {
    await formPage.gotoNew();

    // Seleciona a lógica OR e ação DECLINE
    await formPage.fillForm({
      name: 'Regra Inválida Com Lógica OR',
      ticketPrd: 'PRD-1002',
      logic: 'OR',
      action: 'DECLINE'
    });

    await formPage.submit();

    // O sistema exibe o toast de rejeição regulatória
    await expect(page.locator('.toast-banner')).toBeVisible();
    await expect(page.locator('.toast-banner')).toContainText('Rejeição: Regra combinada');
  });

  test('[TC-DN01-03] [DN-106] Tentativa de cadastro sem informar ticket PRD/Jira obrigatório ou formato incorreto (Borda / Exceção)', async ({ page }) => {
    await formPage.gotoNew();

    await formPage.fillForm({
      name: 'Regra Sem PRD Valido',
      ticketPrd: 'INVALIDO-123'
    });

    await formPage.submit();

    await expect(formPage.ticketPrdErrorMsg).toBeVisible();
    await expect(formPage.ticketPrdErrorMsg).toContainText('Ticket de origem é obrigatório e deve seguir o padrão "PRD-1234"');
  });

  test('[TC-DN01-04] [DN-107] Validação de limite de caracteres no nome da regra (rule_name min 10, max 100)', async ({ page }) => {
    await formPage.gotoNew();

    await formPage.fillForm({
      name: 'Curta',
      ticketPrd: 'PRD-1004'
    });

    await formPage.submit();

    await expect(formPage.nameErrorMsg).toBeVisible();
    await expect(formPage.nameErrorMsg).toContainText('entre 10 e 100 caracteres');
  });

  test('[TC-DN01-05] [DN-108] Tentativa de cadastro com quantidade de cláusulas diferente de 2 ou cláusulas inválidas', async ({ page }) => {
    await formPage.gotoNew();

    await formPage.fillForm({
      name: 'Regra Com Quantidade Invalida de Clausulas',
      ticketPrd: 'PRD-1005',
      logic: 'AND',
      action: 'REVIEW'
    });

    // Remove uma cláusula para restar apenas 1
    const removeBtn = page.locator('button.remove-clause-btn').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
    }

    await formPage.submit();

    // Toast de erro
    await expect(page.locator('.toast-banner')).toBeVisible();
    await expect(page.locator('.toast-banner')).toContainText('exige exatamente duas cláusulas');
  });

  test('[TC-DN01-06] [DN-109] Tentativa de cadastro por usuário sem perfil autorizado (Perfil Auditor) (RBAC / Permissão)', async ({ page }) => {
    await formPage.gotoNew();
    await listPage.switchRole('AUDITOR');

    await expect(page.locator('.rbac-warning-banner')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).not.toBeVisible();
  });
});
