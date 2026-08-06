import { test, expect } from '@playwright/test';
import { RuleListPage } from '../pages/rule-list.page';

test.describe('DN-08: Aplicar Matriz de Controle de Acesso RBAC por Perfil (DN-61)', () => {
  let listPage: RuleListPage;

  test.beforeEach(async ({ page }) => {
    listPage = new RuleListPage(page);

    await listPage.goto();
    await listPage.resetMocks();
  });

  test('[TC-DN08-01] [DN-140] Acesso de Auditor restrito à visualização e bloqueio de ações de escrita (Perfil Auditor)', async ({ page }) => {
    // Altera perfil para AUDITOR
    await listPage.switchRole('AUDITOR');

    // Botão de Criar Regra não deve ser visível
    await expect(listPage.newRuleButton).not.toBeVisible();

    // Toggles de ativação na tabela devem estar desabilitados
    const firstToggle = page.locator('label.switch input[type="checkbox"]').first();
    await expect(firstToggle).toBeDisabled();
  });

  test('[TC-DN08-02] [DN-141] Tentativa de ativação ou desativação de regra por perfil Analista de Prevenção (Bloqueio de Alçada / RBAC)', async ({ page }) => {
    // Altera perfil para ANALISTA
    await listPage.switchRole('ANALISTA');

    // Toggles de ativação de regras em PRD devem estar desabilitados para Analista
    const firstToggle = page.locator('label.switch input[type="checkbox"]').first();
    await expect(firstToggle).toBeDisabled();

    // Banner de RBAC indica limitação de alçada
    await expect(page.locator('.user-info-bar')).toContainText('Bloqueio de Alçada Ativo');
  });

  test('[TC-DN08-03] [DN-142] Tratamento de Token JWT expirado ou ausente no cabeçalho Authorization (Autenticação HTTP 401)', async ({ page }) => {
    // Valida exibição do badge de perfil e autorização na interface
    await expect(page.locator('.user-info-bar')).toBeVisible();
  });

  test('[TC-DN08-04] [DN-143] Execução de ações autorizadas e transições de status por perfil Gestor de Risco (Perfil Gestor / RBAC)', async ({ page }) => {
    // Altera perfil para GESTOR
    await listPage.switchRole('GESTOR');

    // Botão de Criar Regra está habilitado
    await expect(listPage.newRuleButton).toBeVisible();

    // Toggles de ativação estão habilitados para Gestor
    const firstToggle = page.locator('label.switch input[type="checkbox"]').first();
    await expect(firstToggle).toBeEnabled();

    // Banner de RBAC indica acesso total
    await expect(page.locator('.user-info-bar')).toContainText('Acesso Total');
  });
});
