import { Component, Input, OnInit, ViewChild } from '@angular/core';

import { ContractService } from '../contract.service';

@Component({
  selector: 'app-bottom-bar',
  templateUrl: './bottom-bar.component.html',
  styleUrls: ['./bottom-bar.component.css']
})
export class BottomBarComponent implements OnInit {

  @Input() walletReady: boolean;
  @Input() profile: any;
  @ViewChild('assetManagement') assetManagement;

  account: string = "";
  language: number = 0;

  showAssetManagement: boolean = false;

  constructor(private contractService: ContractService) {
  }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));
  }

  refresh() {
  }

  openAssetManagement() {
    if (!this.profile.walletReady) return;

    this.showAssetManagement = true;
  }

  onCloseAssetManagement() {
    this.showAssetManagement = false;
  }

  changeLanguage(language: number) {
    this.language = language;

    if (this.assetManagement) {
      this.assetManagement.changeLanguage(language);
    }
  }
}
