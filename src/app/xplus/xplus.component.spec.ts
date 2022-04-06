import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { XplusComponent } from './xplus.component';

describe('XplusComponent', () => {
  let component: XplusComponent;
  let fixture: ComponentFixture<XplusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ XplusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(XplusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
