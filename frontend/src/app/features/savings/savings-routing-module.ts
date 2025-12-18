import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SavingsList } from './savings-list/savings-list';
import { CreateSavings } from './create-savings/create-savings';

const routes: Routes = [
  {
    path: '',
    title: 'Mes tirelires',
    component: SavingsList,
  },
  {
    path: 'create',
    title: 'Créer une tirelire',
    component: CreateSavings,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SavingsRoutingModule {}
