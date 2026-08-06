import { Page, Locator, expect } from '@playwright/test';

export class SimulatorModalPage {
  readonly page: Page;
  readonly closeButton: Locator;
  readonly storeSelect: Locator;
  readonly paymentSelect: Locator;
  readonly orderValueInput: Locator;
  readonly cardBinInput: Locator;
  readonly sameCountrySelect: Locator;
  readonly customerEmailInput: Locator;
  readonly decisionBadge: Locator;
  readonly matchedRulesList: Locator;
  readonly ghostRulesList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closeButton = page.locator('.simulator-modal button.close-btn');
    this.storeSelect = page.locator('.sim-inputs-panel select').nth(0);
    this.paymentSelect = page.locator('.sim-inputs-panel select').nth(1);
    this.orderValueInput = page.locator('.sim-inputs-panel input').nth(0);
    this.cardBinInput = page.locator('.sim-inputs-panel input').nth(2);
    this.sameCountrySelect = page.locator('.sim-inputs-panel select').nth(2);
    this.customerEmailInput = page.locator('.sim-inputs-panel input').nth(3);
    this.decisionBadge = page.locator('.decision-status .badge-status');
    this.matchedRulesList = page.locator('.matched-section .rule-match-card');
    this.ghostRulesList = page.locator('.ghost-section .rule-match-card');
  }

  async close() {
    await this.closeButton.click();
  }
}
