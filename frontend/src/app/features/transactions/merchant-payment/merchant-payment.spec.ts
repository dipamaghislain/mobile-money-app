import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MerchantPaymentComponent } from './merchant-payment';
import { TransactionService } from '../../../core/services/transaction.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MerchantPaymentComponent', () => {
  let component: MerchantPaymentComponent;
  let fixture: ComponentFixture<MerchantPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantPaymentComponent, NoopAnimationsModule],
      providers: [
        TransactionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MerchantPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
