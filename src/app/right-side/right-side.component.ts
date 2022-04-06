import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-right-side',
  templateUrl: './right-side.component.html',
  styleUrls: ['./right-side.component.css']
})
export class RightSideComponent implements OnInit {

  @Input() profile: any;
  @ViewChild('swap') swap;
  @ViewChild('pool') pool;
  @ViewChild('bank') bank;
  @ViewChild('vault') vault;
  @ViewChild('analytics') analytics;
  @ViewChild('xplus') xplus;

  @Input() tabId: number;

  constructor() { }

  ngOnInit() {
  }

  changeLanguage(language: number) {
    if (this.swap) {
      this.swap.changeLanguage(language);
    }

    if (this.pool) {
      this.pool.changeLanguage(language);
    }

    if (this.bank) {
      this.bank.changeLanguage(language);
    }

    if (this.vault) {
      this.vault.changeLanguage(language);
    }

    if (this.analytics) {
      this.analytics.changeLanguage(language);
    }

    if (this.xplus) {
      this.xplus.changeLanguage(language);
    }
  }
}
