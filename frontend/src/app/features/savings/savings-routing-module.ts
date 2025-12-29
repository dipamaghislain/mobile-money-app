import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SavingsList } from './savings-list/savings-list';

const routes: Routes = [
  {
    path: '',
    title: 'Mon Épargne',
    component: SavingsList,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SavingsRoutingModule { }
