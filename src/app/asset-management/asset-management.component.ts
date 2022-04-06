import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { ContractService } from '../contract.service';

@Component({
  selector: 'app-asset-management',
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.css']
})
export class AssetManagementComponent implements OnInit {

  @Input() profile: any;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @ViewChild('alertMessage') alertMessage;

  language: number = 0;

  waiting: boolean = false;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));
  }

  close() {
    this.onClose.emit();
  }

  formatNumber(x: number) {
    if (x >= 10000000000) {
      return (x / 1000000000).toFixed(0) + ' B';
    } else if (x >= 1000000000) {
      return +(x / 1000000000).toFixed(1) + ' B';
    } else if (x >= 10000000) {
      return (x / 1000000).toFixed(0) + ' M';
    } else if (x >= 1000000) {
      return +(x / 1000000).toFixed(1) + ' M';
    } else if (x >= 10000) {
      return (x / 1000.0).toFixed(0) + ' K';
    } else if (x >= 1000) {
      return +(x / 1000.0).toFixed(1) + ' K';
    } else if (x > 10) {
      return +(x * 1).toFixed(1);
    } else if (x > 1) {
      return +(x * 1).toFixed(2);
    } else if (x > 0) {
      return +(x * 1).toFixed(2);
    } else {
      return '0';
    }
  }

  changeLanguage(language: number) {
    this.language = language;

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }

  showAlert(titleCN: string, titleEN: string, bodyCN: string, bodyEN: string) {
    this.alertTitleCN = titleCN;
    this.alertTitleEN = titleEN;
    this.alertBodyCN = bodyCN;
    this.alertBodyEN = bodyEN;
    this.willShowAlertMessage = true;
  }

  closeAlert() {
    this.willShowAlertMessage = false;
  }
}
