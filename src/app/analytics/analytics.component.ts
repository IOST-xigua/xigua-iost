import { Component, OnInit, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  @ViewChild('analyticsOverall') analyticsOverall;
  @Input() profile: any;

  language: number = 0;

  tabId: number = 0;

  constructor() { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));
  }

  gotoTab(tabId: number) {
    this.tabId = tabId;
  }

  changeLanguage(language: number) {
    this.language = language;

    if (this.analyticsOverall) {
      this.analyticsOverall.changeLanguage(language);
    }
  }
}
