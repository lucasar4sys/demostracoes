import { Page, Locator, expect } from '@playwright/test';

export class RuleFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly ticketPrdInput: Locator;
  readonly descriptionInput: Locator;
  readonly logicAndRadio: Locator;
  readonly logicOrRadio: Locator;
  readonly approveButton: Locator;
  readonly reviewButton: Locator;
  readonly declineButton: Locator;
  readonly clauseParamSelect: Locator;
  readonly clauseOperatorSelect: Locator;
  readonly clauseValueInput: Locator;
  readonly addClauseButton: Locator;
  readonly saveButton: Locator;
  readonly nameErrorMsg: Locator;
  readonly ticketPrdErrorMsg: Locator;
  readonly validationBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[formControlName="name"]');
    this.ticketPrdInput = page.locator('input[formControlName="ticketPrd"]');
    this.descriptionInput = page.locator('textarea[formControlName="description"]');
    this.logicAndRadio = page.locator('input[formControlName="logic"][value="AND"]');
    this.logicOrRadio = page.locator('input[formControlName="logic"][value="OR"]');
    this.approveButton = page.locator('.decision-group button:has-text("Aprovar")');
    this.reviewButton = page.locator('.decision-group button:has-text("REVISAR")');
    this.declineButton = page.locator('.decision-group button:has-text("Negar")');
    
    this.clauseParamSelect = page.locator('.add-clause-card select').nth(0);
    this.clauseOperatorSelect = page.locator('.add-clause-card select').nth(1);
    this.clauseValueInput = page.locator('.add-clause-card input');
    this.addClauseButton = page.locator('button.btn-add-clause');
    
    this.saveButton = page.locator('button[type="submit"]');
    this.nameErrorMsg = page.locator('small.error-msg:has-text("nome é obrigatório")');
    this.ticketPrdErrorMsg = page.locator('small.error-msg:has-text("Ticket de origem")');
    this.validationBanner = page.locator('.validation-banner');
  }

  async gotoNew() {
    await this.page.goto('/regras/nova');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    name: string;
    ticketPrd: string;
    description?: string;
    logic?: 'AND' | 'OR';
    action?: 'APPROVE' | 'REVIEW' | 'DECLINE';
  }) {
    await this.nameInput.fill(data.name);
    await this.ticketPrdInput.fill(data.ticketPrd);
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.logic === 'AND') {
      await this.logicAndRadio.check({ force: true });
    } else if (data.logic === 'OR') {
      await this.logicOrRadio.check({ force: true });
    }
    if (data.action === 'APPROVE') {
      await this.approveButton.click();
    } else if (data.action === 'REVIEW') {
      await this.reviewButton.click();
    } else if (data.action === 'DECLINE') {
      await this.declineButton.click();
    }
  }

  async addClause(paramId: string, operator?: string, value?: string) {
    await this.clauseParamSelect.selectOption(paramId);
    if (operator) {
      await this.clauseOperatorSelect.selectOption(operator);
    }
    if (value && await this.clauseValueInput.isVisible()) {
      await this.clauseValueInput.fill(value);
    }
    await this.addClauseButton.click();
  }

  async submit() {
    await this.saveButton.click();
  }
}
