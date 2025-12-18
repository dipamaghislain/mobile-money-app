import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayMerchant } from './pay-merchant';

describe('PayMerchant', () => {
  let component: PayMerchant;
  let fixture: ComponentFixture<PayMerchant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayMerchant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayMerchant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
