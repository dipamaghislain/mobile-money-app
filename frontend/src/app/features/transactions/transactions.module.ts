import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DepositComponent } from './deposit/deposit';
import { WithdrawComponent } from './withdraw/withdraw';
import { TransferComponent } from './transfer/transfer';
import { TransactionHistoryComponent } from './history/history';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full'
  },
  {
    path: 'history',
    component: TransactionHistoryComponent
  },
  {
    path: 'deposit',
    component: DepositComponent
  },
  {
    path: 'withdraw',
    component: WithdrawComponent
  },
  {
    path: 'transfer',
    component: TransferComponent
  },
  
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class TransactionsModule { }
