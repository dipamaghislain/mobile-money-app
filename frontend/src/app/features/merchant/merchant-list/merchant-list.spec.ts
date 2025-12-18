import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantList } from './merchant-list';

describe('MerchantList', () => {
  let component: MerchantList;
  let fixture: ComponentFixture<MerchantList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MerchantList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
