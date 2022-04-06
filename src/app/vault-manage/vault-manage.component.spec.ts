import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VaultManageComponent } from './vault-manage.component';

describe('VaultManageComponent', () => {
  let component: VaultManageComponent;
  let fixture: ComponentFixture<VaultManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VaultManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VaultManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
