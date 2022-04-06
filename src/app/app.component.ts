import { Component, OnInit, ViewChild } from '@angular/core';

import { ContractService } from './contract.service';

import { environment } from '../environments/environment';

import { BankManager } from './bank-manager';
import { SwapManager } from './swap-manager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('topBar') topBar;
  @ViewChild('bottomBar') bottomBar;
  @ViewChild('rightSide') rightSide;

  tabId: number = 0;

  waiting: boolean = false;

  bankManager: any = null;
  swapManager: any = null;

  willShowWechatBox: boolean = false;

  profile: any = {
  };

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.load();

    let language: number = parseInt(localStorage.getItem('language'));

    if (isNaN(language)) {
      localStorage.setItem('language', '0');
    }
  }

  async load() {
    this.waiting = true;

    const walletReady = await this.contractService.init();
    const account = this.contractService.getUserAddress();

    this.bankManager = new BankManager(this.contractService.myIOST);
    this.swapManager = new SwapManager(this.contractService.myIOST);

    this.profile = {};

    if (walletReady && account) {
      this.profile.account = this.contractService.getUserAddress();
      this.profile.allPairs = await this.swapManager.allPairs();

      setInterval(() => {
        this.loadPrices();
      }, 60000);
      this.loadPrices();

      this.profile.walletReady = true;
    } else {
      this.profile.account = "";
      this.profile.allPairs = [];
      this.profile.walletReady = false;
    }

    this.waiting = false;
  }

  async loadPrices() {
    this.profile.iostPrice = +(await this.bankManager.getOraclePrice());
    this.profile.xusdPrice = +(this.profile.iostPrice * (+(await this.swapManager.getIOSTXUSDRatio()))).toFixed(2);
  }

  gotoTab($event: any) {
    this.tabId = $event.tabId;
  }

  topBarGotoTab($event: any) {
    this.topBar.gotoTab($event.tabId);
  }

  onRefreshBottomBar($event: any) {
    this.bottomBar.refresh();
  }

  showWechatBox() {
    this.willShowWechatBox = true;
  }

  closeWechatBox() {
    this.willShowWechatBox = false;
  }

  changeLanguageByEvent($event: any) {
    this.changeLanguage($event.language);
  }

  changeLanguage(language: number) {
    if (this.topBar) {
      this.topBar.changeLanguage(language);
    }

    if (this.bottomBar) {
      this.bottomBar.changeLanguage(language);
    }

    if (this.rightSide) {
      this.rightSide.changeLanguage(language);
    }
  }
}
