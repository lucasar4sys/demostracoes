import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RuleService } from '../../services/rule.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, RouterLink],
  template: `
    <header class="app-header">
      @if (ruleService.toastMessage(); as toast) {
        <div class="toast-banner" [class]="'toast-' + toast.type">
          {{ toast.text }}
        </div>
      }

      <div class="header-container">
        <a class="brand" routerLink="/regras" aria-label="Antifraude">
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 5.5 6v5.2c0 4.3 2.8 7.5 6.5 9.3 3.7-1.8 6.5-5 6.5-9.3V6L12 3Z" />
            </svg>
          </span>
          <span class="brand-copy">
            <strong>ANTIFRAUDE</strong>
            <small>Portal Antifraude</small>
          </span>
        </a>

        <div class="header-actions">
          <label class="scope-control">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 3 8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4" />
            </svg>
            <span>Escopo:</span>
            <select
              [ngModel]="ruleService.selectedStoreId()"
              (ngModelChange)="ruleService.setSelectedStore($event)"
              aria-label="Selecionar escopo"
            >
              @for (store of ruleService.stores(); track store.id) {
                <option [value]="store.id">
                  {{ store.id === 'ALL' ? 'Todas as Lojas (GLOBAL)' : store.name }}
                </option>
              }
            </select>
          </label>

          <div class="user-chip">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3" />
              <path d="M6 20c.4-4 2.3-6 6-6s5.6 2 6 6" />
            </svg>
            <span class="online-dot"></span>
            <span>analista.risco&#64;equifax.com</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly ruleService = inject(RuleService);
}
