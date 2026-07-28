import { Routes } from '@angular/router';
import { RuleListComponent } from './pages/rule-list/rule-list';
import { RuleFormComponent } from './pages/rule-form/rule-form';

export const routes: Routes = [
  { path: '', redirectTo: 'regras', pathMatch: 'full' },
  { path: 'regras', component: RuleListComponent },
  { path: 'regras/nova', component: RuleFormComponent },
  { path: 'regras/editar/:id', component: RuleFormComponent },
  { path: '**', redirectTo: 'regras' },
];
