import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenSelectionComponent } from './token-selection.component';

describe('TokenSelectionComponent', () => {
  let component: TokenSelectionComponent;
  let fixture: ComponentFixture<TokenSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
