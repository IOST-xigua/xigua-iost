import { Component, OnInit, Input, ViewChild } from '@angular/core';

import { ContractService } from '../contract.service';
import { BankManager } from '../bank-manager';
import { TokenManager } from '../token-manager';

@Component({
  selector: 'app-bank',
  templateUrl: './bank.component.html',
  styleUrls: ['./bank.component.css']
})
export class BankComponent implements OnInit {

  @ViewChild('alertMessage') alertMessage;

  @Input() profile: any;

  language: number = 0;

  tabId: number = 0;

  tokenManager: any = null;
  bankManager: any = null;

  iostBalance: number = 0;
  xusdBalance: number = 0;

  info: any = {
    locked: 0,
    borrowed: 0,
    price: 0,
    liquidationPrice: 0,
    canUnlock: 0,
    canBorrow: 0
  };

  amountLock: string = "";
  amountUnlock: string = "";
  amountBorrow: string = "";
  amountPayBack: string = "";

  waiting: boolean = false;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  interval: any = null;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));

    this.bankManager = new BankManager(this.contractService.myIOST);
    this.tokenManager = new TokenManager(this.contractService.myIOST);

    this.interval = setInterval(() => {
      this._refresh();
    }, 10 * 1e3);

    this._refresh();
  }

  async _refresh() {
    const all = [(async () => {
      this.iostBalance = await this.tokenManager.getTokenBalance('iost');
    }) (), (async () => {
      this.xusdBalance = await this.tokenManager.getTokenBalance('xusd');
    }) (), (async () => {
      this.info = await this.bankManager.getFullInfo(this.profile.iostPrice);
    }) ()];
  }

  goMaxLock() {
    this.amountLock = this.iostBalance.toString();
  }

  goMaxUnlock() {
    this.amountUnlock = this.info.canUnlock;
  }

  goMaxBorrow() {
    this.amountBorrow = this.info.canBorrow;
  }

  goMaxPayBack() {
    this.amountPayBack = this.xusdBalance.toString();
  }

  checkAmount($event) {
    if ([8, 16, 17, 91, 37, 39, 86, 190, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57].indexOf($event.which) < 0) {
      return false;
    }

    return true;
  }

  async lock() {
    this.waiting = true;
    try {
      await this.contractService.lock(+this.amountLock);

      this.amountLock = "";
      this._refresh();

      this.showAlert('抵押成功', 'Transaction Succeeded', '', '');
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('抵押失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
  }

  async unlockWithVOST() {
    this.waiting = true;
    try {
      await this.contractService.unlockWithVOST(+this.amountUnlock);

      this.amountUnlock = "";
      this._refresh();

      this.showAlert('解锁成功', 'Transaction Succeeded', '', '');
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('解锁失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
  }

  async unlockWithDelay() {
    this.waiting = true;
    try {
      await this.contractService.unlockWithDelay(+this.amountUnlock);
 
      this.amountUnlock = "";
      this._refresh();
      
      this.showAlert('解锁成功', 'Transaction Succeeded', '', '');
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('解锁失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
  }

  async unlockImmediately() {
    this.waiting = true;
    try {
      await this.contractService.unlockImmediately(+this.amountUnlock);

      this.amountUnlock = "";
      this._refresh();

      this.showAlert('解锁成功', 'Transaction Succeeded', '', '');
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('解锁失败', 'Transaction Failed', '请尝试其他解锁方法',
            'Please try other options.')
      }
    }

    this.waiting = false;
  }

  async borrow() {
    this.waiting = true;
    try {
      await this.contractService.borrow(+this.amountBorrow);

      this.amountBorrow = "";
      this._refresh();

      this.showAlert('借出成功', 'Transaction Succeeded', '', '');
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('借出失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
  }

  async payBack() {
    this.waiting = true;
    try {
      await this.contractService.payBack(+this.amountPayBack);

      this.amountPayBack = "";
      this._refresh();

      this.showAlert('归还成功', 'Transaction Succeeded', '', '');
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('归还失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
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

  gotoTab(tabId: number) {
    this.tabId = tabId;
  }

  changeLanguage(language: number) {
    this.language = language;

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }
}
