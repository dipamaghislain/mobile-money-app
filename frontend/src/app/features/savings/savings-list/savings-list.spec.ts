import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingsList } from './savings-list';

describe('SavingsList', () => {
  let component: SavingsList;
  let fixture: ComponentFixture<SavingsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavingsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
