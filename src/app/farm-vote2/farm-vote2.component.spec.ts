import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmVote2Component } from './farm-vote2.component';

describe('FarmVote2Component', () => {
  let component: FarmVote2Component;
  let fixture: ComponentFixture<FarmVote2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FarmVote2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FarmVote2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
