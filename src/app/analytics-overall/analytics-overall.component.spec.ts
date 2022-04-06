import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsOverallComponent } from './analytics-overall.component';

describe('AnalyticsOverallComponent', () => {
  let component: AnalyticsOverallComponent;
  let fixture: ComponentFixture<AnalyticsOverallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalyticsOverallComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsOverallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
