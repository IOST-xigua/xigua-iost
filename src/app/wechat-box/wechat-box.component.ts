import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-wechat-box',
  templateUrl: './wechat-box.component.html',
  styleUrls: ['./wechat-box.component.css']
})
export class WechatBoxComponent implements OnInit {

  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  constructor() { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));
  }

  changeLanguage(language: number) {
    this.language = language;
  }

  close() {
    this.onClose.emit();
  }
}
