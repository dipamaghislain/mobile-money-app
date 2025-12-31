import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Composants partagés
import { BottomNavComponent } from './components/bottom-nav/bottom-nav';
import { PageHeaderComponent } from './components/page-header/page-header';
import { CurrencyXOFPipe } from './pipes/currency-xof.pipe';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BottomNavComponent,
    PageHeaderComponent,
    CurrencyXOFPipe
  ],
  exports: [
    BottomNavComponent,
    PageHeaderComponent,
    CurrencyXOFPipe
  ]
})
export class SharedModule { }
