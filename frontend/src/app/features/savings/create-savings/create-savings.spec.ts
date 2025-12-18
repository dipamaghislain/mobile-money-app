import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSavings } from './create-savings';

describe('CreateSavings', () => {
  let component: CreateSavings;
  let fixture: ComponentFixture<CreateSavings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSavings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSavings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
