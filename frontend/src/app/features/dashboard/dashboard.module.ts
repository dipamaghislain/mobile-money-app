import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StatisticsComponent } from './statistics/statistics';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'statistics', component: StatisticsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DashboardComponent,
    StatisticsComponent
  ]
})
export class DashboardModule { }
