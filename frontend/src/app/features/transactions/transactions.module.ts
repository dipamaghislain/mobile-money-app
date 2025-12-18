import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DepositComponent } from './deposit/deposit';
import { WithdrawComponent } from './withdraw/withdraw';
import { TransferComponent } from './transfer/transfer';
import { MerchantPaymentComponent } from './merchant-payment/merchant-payment';
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
  {
    path: 'payment',
    component: MerchantPaymentComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class TransactionsModule { }
