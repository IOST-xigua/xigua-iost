import { Component, EventEmitter, OnInit, Output, Input, ViewChild } from '@angular/core';

import { environment } from '../../environments/environment';

import { BigNumber } from "bignumber.js";

import { ContractService } from '../contract.service';
import { FarmManager } from '../farm-manager';
import { SwapManager } from '../swap-manager';

const ROUND_DOWN = 1;

const XG_LIST = ['xg_3', 'xg_30', 'xg_90', 'xg_180'];

@Component({
  selector: 'app-vault-manage',
  templateUrl: './vault-manage.component.html',
  styleUrls: ['./vault-manage.component.css']
})
export class VaultManageComponent implements OnInit {

  @ViewChild('alertMessage') alertMessage;

  @Input() profile: any;
  @Input() fullName: string;
  @Input() token: string;
  @Input() precision: number;
  @Input() extra: string;
  @Input() extraPrecision: number;
  @Input() lockDays: number;

  @Output() onRefresh: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  realToken: string = "";

  farmManager: any = null;
  swapManager: any = null;

  tokenBalance: string = "0";
  poolAmount: string = "0";
  pendingAmount: string = "0";
  extraPendingAmount: string = "0";

  canUnlockAmount: string = "";

  amountDeposit: string = "";
  amountDepositOld: string = "";

  waitingDeposit: boolean = false;
  canDeposit: boolean = false;

  waitingWithdraw: boolean = false;
  canWithdraw: boolean = false;

  waitingClaim: boolean = false;
  canClaim: boolean = false;

  now: number = 0;
  nowLocal: number = 0;
  totalAlloc: number = 0;
  pool: any = null;
  userInfoToken: any = null;

  pair: any = null;
  token0Balance: string = "";
  token1Balance: string = "";

  interval0: any = null;
  interval1: any = null;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));

    this.farmManager = new FarmManager(this.contractService.myIOST);
    this.swapManager = new SwapManager(this.contractService.myIOST);

    if (XG_LIST.indexOf(this.token) >= 0) {
      this.realToken = environment.xg;
    } else if ((['xplus_30', 'xplus_60', 'xplus_90']).indexOf(this.token) >= 0) {
      this.realToken = 'xplus';
    } else if ((['iost_30', 'iost_90']).indexOf(this.token) >= 0) {
      this.realToken = 'iost';
    } else {
      this.realToken = this.token;
    }

    this.load();

    this.interval0 = setInterval(() => {
      this.load();
    }, 60 * 1e3);

    this.interval1 = setInterval(() => {
      this.estimate();
    }, 1 * 1e3);
  }

  ngOnDestroy() {
    clearInterval(this.interval0);
    clearInterval(this.interval1);
  }

  isInList(token) {
    return XG_LIST.indexOf(this.token) >= 0 ||
        (['xplus_30', 'xplus_60', 'xplus_90']).indexOf(this.token) >= 0 ||
        (['iost_30', 'iost_90']).indexOf(this.token) >= 0;
  }

  isBonusUnlocked() {
    return +this.canUnlockAmount >= 1 && (+this.canUnlockAmount) + 1 >= +this.poolAmount;
  }

  async load() {
    const all = [(async () => {
      this.tokenBalance = await this.swapManager.getTokenBalance(this.realToken);
    })(), (async () => {
      this.now = await this.farmManager.getNow();
      this.nowLocal = Math.floor(new Date().getTime() / 1000);
    })(), (async () => {
      this.pool = await this.farmManager.getPool(this.token);
    })(), (async () => {
      this.totalAlloc = await this.farmManager.getTotalAlloc();
    })(), (async () => {
      this.userInfoToken = await this.farmManager.getUserInfoOfToken(this.token);
      this.poolAmount = this.userInfoToken ? this.userInfoToken.amount : "0";
      this.canWithdraw = new BigNumber(this.poolAmount).gt(0);
    })()];

    await Promise.all(all);

    this.pendingAmount = this.farmManager.getRewardPending(
        this.now, this.totalAlloc, this.pool, this.userInfoToken);
    this.extraPendingAmount = this.farmManager.getExtraPending(
        this.now, this.totalAlloc, this.pool, this.userInfoToken);

    const array = this.fullName.split('-');
    if (array.length == 2) {
      this.pair = await this.swapManager.getPair(array[0], array[1]);
    }

    if (this.pair && this.poolAmount) {
      this.token0Balance = new BigNumber(this.pair.reserve0).times(
          this.poolAmount).div(this.pair.xlpSupply).toFixed(
              this.pair.precision0, ROUND_DOWN);
      this.token1Balance = new BigNumber(this.pair.reserve1).times(
          this.poolAmount).div(this.pair.xlpSupply).toFixed(
              this.pair.precision1, ROUND_DOWN);
    }

    if (this.isInList(this.token)) {
      const today = Math.floor(this.now / 3600 / 24);
      this.canUnlockAmount = await this.farmManager.getCanUnlock(this.token, this.poolAmount, today, this.lockDays);
    }
  }

  estimate() {
    if (!this.now || !this.totalAlloc || !this.pool || !this.userInfoToken) {
      return;
    }

    const nowRealTime = Math.floor(new Date().getTime() / 1000);
    const nowEstimated = this.now + nowRealTime - this.nowLocal;
    this.pendingAmount = this.farmManager.getRewardPending(
        nowEstimated, this.totalAlloc, this.pool, this.userInfoToken);

    this.canClaim = new BigNumber(this.pendingAmount).gt(0);
  }

  goMax() {
    this.amountDeposit = new BigNumber(this.tokenBalance).toFixed(this.precision, ROUND_DOWN);
    this.enterAmount();
  }

  async enterAmount() {
    if (isNaN(+this.amountDeposit)) {
      this.amountDeposit = this.amountDepositOld;
      return;
    }

    this.amountDeposit = this.amountDeposit.trim();
    this.amountDepositOld = this.amountDeposit;

    var valueDeposit = parseFloat(this.amountDeposit);

    if (!valueDeposit) {
      this.canDeposit = false;
      return;
    }

    this.canDeposit = true;
  }

  checkAmount($event) {
    if (environment.allowedKeycodes.indexOf($event.which) < 0) {
      return false;
    }

    return true;
  }

  async deposit() {
    var valueDeposit = parseFloat(this.amountDeposit);

    if (!valueDeposit) {
      return;
    }

    this.waitingDeposit = true;
    try {
      const res = XG_LIST.indexOf(this.token) >= 0 ? await this.contractService.helperDeposit(
          this.token, valueDeposit) : await this.contractService.deposit(
          this.token, valueDeposit);

      this.showAlert('抵押成功', 'Staked successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you staked, please refresh the page in a few seconds')

      this.amountDeposit = "";
      this.amountDepositOld = "";
      this.canDeposit = false;

      this.load();

      this.onRefresh.emit();
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

    this.waitingDeposit = false;
  }

  async withdraw() {
    this.waitingWithdraw = true;
    try {
      const res = XG_LIST.indexOf(this.token) >= 0 ?
          await this.contractService.helperWithdraw(this.token) :
          await this.contractService.withdraw(this.token);
      
      this.showAlert('提取成功', 'Unstaked successfully',
         '如果还没有看到，请几秒后刷新页面', 
         'If you don\'t see what you staked, please refresh the page in a few seconds')

      this.load();

      this.onRefresh.emit();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('提取失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waitingWithdraw = false;
  }

  async claim() {
    this.waitingClaim = true;
    try {
      const res = await this.contractService.claim(this.token);

      this.showAlert('提取成功', 'Claimed successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you claimed, please refresh the page in a few seconds')

      this.load();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('提取失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waitingClaim = false;
  }

  cancel() {
    this.onClose.emit();
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

  changeLanguage(language: number) {
    this.language = language;

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }
}
