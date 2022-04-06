import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WechatBoxComponent } from './wechat-box.component';

describe('WechatBoxComponent', () => {
  let component: WechatBoxComponent;
  let fixture: ComponentFixture<WechatBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WechatBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WechatBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
