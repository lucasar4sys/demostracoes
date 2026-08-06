import { Page, Locator, expect } from '@playwright/test';

export class RuleListPage {
  readonly page: Page;
  readonly rbacSelect: Locator;
  readonly newRuleButton: Locator;
  readonly resetMocksButton: Locator;
  readonly tabRegras: Locator;
  readonly tabAuditoria: Locator;
  readonly totalRulesMetric: Locator;
  readonly activeRulesMetric: Locator;
  readonly globalRulesMetric: Locator;
  readonly ghostRulesMetric: Locator;
  readonly rulesTable: Locator;
  readonly auditTable: Locator;
  readonly exportPdfButton: Locator;
  readonly exportJsonButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rbacSelect = page.locator('select.rbac-select');
    this.newRuleButton = page.locator('a:has-text("Nova Regra Antifraude")');
    this.resetMocksButton = page.locator('button:has-text("Redefinir Mocks")');
    this.tabRegras = page.locator('button:has-text("Regras Antifraude")');
    this.tabAuditoria = page.locator('button:has-text("Trilha de Auditoria Imutável")');
    this.totalRulesMetric = page.locator('.metric-card').nth(0);
    this.activeRulesMetric = page.locator('.metric-card').nth(1);
    this.globalRulesMetric = page.locator('.metric-card').nth(2);
    this.ghostRulesMetric = page.locator('.metric-card').nth(3);
    this.rulesTable = page.locator('.rules-table-card table');
    this.auditTable = page.locator('.audit-card table');
    this.exportPdfButton = page.locator('button:has-text("Exportar PDF Oficial")');
    this.exportJsonButton = page.locator('button:has-text("Exportar Trilha JSON")');
  }

  async goto() {
    await this.page.goto('/regras');
    await this.page.waitForLoadState('networkidle');
  }

  async switchRole(role: 'GESTOR' | 'ANALISTA' | 'AUDITOR') {
    await this.rbacSelect.selectOption(role);
  }

  async resetMocks() {
    await this.resetMocksButton.click();
    await this.page.waitForTimeout(300);
  }

  async openGovernanceModalForRule(ruleId: string) {
    // Localiza a linha da regra pelo id ou pelo botão associado
    const row = this.page.locator(`tr:has-text("${ruleId}"), tr:has-text("PRD-2026")`).first();
    await row.locator('button:has-text("Simular & Homologar")').click();
  }

  async editRule(ruleId: string) {
    const row = this.page.locator(`tr:has-text("${ruleId}"), tr:has-text("PRD-2026")`).first();
    await row.locator('button:has-text("Editar")').click();
  }

  async toggleRuleActiveStatus(ruleId: string) {
    const row = this.page.locator(`tr:has-text("${ruleId}"), tr:has-text("PRD-2026")`).first();
    await row.locator('label.switch input[type="checkbox"]').click();
  }
}
