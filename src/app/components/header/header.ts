import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RuleService } from '../../services/rule.service';
import { SimulatorComponent } from '../simulator/simulator';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, SimulatorComponent],
  template: `
    <header class="app-header">
      <!-- Top Red Executive Accent Line -->
      <div class="top-accent-line"></div>

      <!-- Toast Notification Bar -->
      @if (ruleService.toastMessage(); as toast) {
        <div class="toast-banner" [class]="'toast-' + toast.type">
          <div class="toast-content">
            <span class="toast-tag">
              {{ toast.type === 'success' ? 'OK' : toast.type === 'warning' ? 'AVISO' : 'INFO' }}
            </span>
            <span class="toast-text">{{ toast.text }}</span>
          </div>
        </div>
      }

      <!-- Top navbar with brand logo, global search, store selector and profile -->
      <div class="top-bar">
        <div class="brand-section">
          <a class="brand-logo" href="#" title="Sistema de Regras Antifraude">
            <div class="logo-group">
              <span class="logo-primary">SISTEMA ANTIFRAUDE</span>
            </div>
            <div class="brand-badge-wrapper">
              <span class="brand-badge">MOTOR DE REGRAS & RISCO</span>
            </div>
          </a>
        </div>

        <div class="global-search-container">
          <span class="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input 
            type="text" 
            class="global-search-input" 
            placeholder="Buscar por nome da regra, código, parâmetro..."
            [ngModel]="ruleService.searchQuery()"
            (ngModelChange)="onSearchChange($event)"
          />
          <span class="search-shortcut">⌘K</span>
        </div>

        <div class="user-store-section">
          <button 
            class="btn-sim-header" 
            (click)="openSimulator()"
            title="Abrir Simulador em Tempo Real"
          >
            <span class="sim-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
            <span class="btn-text">Simulador Antifraude</span>
          </button>

          <button 
            class="btn-reset-header" 
            (click)="onResetData()"
            title="Restaurar Regras e Dados do Demo"
          >
            <span class="reset-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </span>
            <span class="btn-text">Reset Demo</span>
          </button>

          <div class="store-selector-wrapper">
            <span class="store-label">Escopo:</span>
            <select 
              class="store-select" 
              [ngModel]="ruleService.selectedStoreId()" 
              (ngModelChange)="onStoreChange($event)"
            >
              @for (store of ruleService.stores(); track store.id) {
                <option [value]="store.id">
                  {{ store.name }} {{ store.isGlobal ? '(Todas as Lojas)' : '' }}
                </option>
              }
            </select>
          </div>

          <div class="user-profile" title="Perfil de Usuário">
            <div class="avatar-wrapper">
              <div class="avatar-circle">
                <span>AD</span>
              </div>
              <span class="status-dot-online" title="Sessão Ativa"></span>
            </div>
            <div class="user-info">
              <span class="user-name">Analista de Risco</span>
              <span class="user-role">Administrador</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lower navigation menu bar -->
      <nav class="main-nav">
        <div class="nav-container">
          <a class="nav-item" href="javascript:void(0)" (click)="ruleService.showToast('Módulo de Pedidos integrado ao sistema', 'info')">
            <span class="nav-text">Pedidos</span>
          </a>
          <a class="nav-item" href="javascript:void(0)" (click)="ruleService.showToast('Filas de Análise Manual em tempo real', 'info')">
            <span class="nav-text">Filas de Análise</span>
          </a>
          <a class="nav-item active" href="javascript:void(0)">
            <span class="nav-text">Regras Globais e por Loja</span>
            <span class="nav-badge">{{ ruleService.rules().length }}</span>
          </a>
          <a class="nav-item" href="javascript:void(0)" (click)="ruleService.showToast('Módulo de Listas Negras/Brancas ativado', 'info')">
            <span class="nav-text">Listas Negras/Brancas</span>
          </a>
          <a class="nav-item" href="javascript:void(0)" (click)="openSimulator()">
            <span class="nav-text">Simulador & Testes</span>
          </a>
          <a class="nav-item" href="javascript:void(0)" (click)="ruleService.showToast('Relatórios de Disparo e A/B Ghost Mode', 'info')">
            <span class="nav-text">Relatórios & Analytics</span>
          </a>
        </div>
      </nav>
    </header>


    <!-- Simulator Modal Host -->
    @if (showSimulator()) {
      <app-simulator />
    }
  `,
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly ruleService = inject(RuleService);
  readonly showSimulator = signal<boolean>(false);

  onStoreChange(storeId: string) {
    this.ruleService.setSelectedStore(storeId);
  }

  onSearchChange(query: string) {
    this.ruleService.setSearchQuery(query);
  }

  openSimulator() {
    this.showSimulator.set(true);
  }

  onResetData() {
    if (confirm('Deseja restaurar as regras padrão para apresentação?')) {
      this.ruleService.resetToDefaultRules();
    }
  }
}
