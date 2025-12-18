import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MerchantList } from './merchant-list/merchant-list';
import { PayMerchant } from './pay-merchant/pay-merchant';

const routes: Routes = [
  {
    path: '',
    title: 'Commerçants',
    component: MerchantList,
  },
  {
    path: 'pay',
    title: 'Payer un commerçant',
    component: PayMerchant,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MerchantRoutingModule {}
