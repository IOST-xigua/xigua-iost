import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmVoteComponent } from './farm-vote.component';

describe('FarmVoteComponent', () => {
  let component: FarmVoteComponent;
  let fixture: ComponentFixture<FarmVoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FarmVoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FarmVoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
