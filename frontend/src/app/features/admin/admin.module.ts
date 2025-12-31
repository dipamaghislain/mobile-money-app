// frontend/src/app/features/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminUserDetailComponent } from './admin-user-detail/admin-user-detail.component';
import { AdminTransactionsComponent } from './admin-transactions/admin-transactions.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'users/:id', component: AdminUserDetailComponent },
      { path: 'transactions', component: AdminTransactionsComponent },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminUserDetailComponent,
    AdminTransactionsComponent
  ]
})
export class AdminModule { }

