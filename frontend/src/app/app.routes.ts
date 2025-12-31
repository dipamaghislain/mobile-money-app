import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
        canActivate: [GuestGuard]
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'transactions',
        loadChildren: () => import('./features/transactions/transactions.module').then(m => m.TransactionsModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile-module').then(m => m.ProfileModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'savings',
        loadChildren: () => import('./features/savings/savings-module').then(m => m.SavingsModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
        canActivate: [adminGuard]
    },
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];
