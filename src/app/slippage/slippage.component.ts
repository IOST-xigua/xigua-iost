import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-slippage',
  templateUrl: './slippage.component.html',
  styleUrls: ['./slippage.component.css']
})
export class SlippageComponent implements OnInit {

  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  language: number = 0;
  value: number = 10;

  constructor() { }

  ngOnInit() {
    const value = parseInt(localStorage.getItem("-xg-slippage"));
    if ([1, 5, 10, 50, 100].indexOf(value) >= 0) {
      this.value = value;
    }

    this.language = parseInt(localStorage.getItem('language'));
  }

  select(value: number) {
    this.value = value;
    localStorage.setItem("-xg-slippage", value.toString());
  }

  confirm() {
    this.onSelect.emit({
      value: this.value
    });
  }

  close() {
    this.onClose.emit();
  }

  changeLanguage(language: number) {
    this.language = language;
  }
}
