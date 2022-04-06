import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {

  @Output() onGotoTab: EventEmitter<any> = new EventEmitter();
  @Output() onShowWechatBox: EventEmitter<any> = new EventEmitter();
  @Output() onChangeLanguage: EventEmitter<any> = new EventEmitter();

  tabId: number = 1;

  showStatus: boolean = true;

  language: number = 0;

  constructor() { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));

    this.gotoTab(1);
  }

  _isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  gotoTab(tabId: number) {
    this.tabId = tabId;

    if (tabId > 0) {
      this.onGotoTab.emit({tabId: tabId});
      this.showStatus = false;
    } else {
      this.showStatus = true;
    }
  }

  showWechatBox() {
    this.onShowWechatBox.emit();
  }

  changeLanguage(language: number) {
    this.language = language;
  }

  changeLanguageByClick(language: number) {
    localStorage.setItem('language', language.toString());

    this.onChangeLanguage.emit({
      language: language
    });
  }
}
