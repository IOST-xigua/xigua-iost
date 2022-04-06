import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.css']
})
export class AlertMessageComponent implements OnInit {
  
  @Input() titleCN: string;
  @Input() titleEN: string;
  @Input() bodyCN: string;
  @Input() bodyEN: string;

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