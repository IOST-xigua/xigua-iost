import { Component, Input, OnInit, ViewChild } from '@angular/core';

import { environment } from '../../environments/environment';

import { ContractService } from '../contract.service';

import { BurnerManager } from '../burner-manager';
import { SwapManager } from '../swap-manager';
import { TokenManager } from '../token-manager';

@Component({
  selector: 'app-analytics-overall',
  templateUrl: './analytics-overall.component.html',
  styleUrls: ['./analytics-overall.component.css']
})
export class AnalyticsOverallComponent implements OnInit {

  @ViewChild('alertMessage') alertMessage;

  @Input() profile: any;

  language: number = 0;

  burnerManager: any = null;
  swapManager: any = null;
  tokenManager: any = null;

  xgSupply: number = 0;
  xgPrice: number = 0;
  xusdSupply: number = 0;
  xusdPrice: number = 0;

  poolIOST: number = 0;
  poolVOST: number = 0;
  poolXUSD: number = 0;
  poolXG: number = 0;

  waitBurning: number = 0;
  costBurning: number = 0;

  interval: any = null;

  stabFund: number = 0;
  iostLocked: number = 0;

  waiting: boolean = false;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));

    this.burnerManager = new BurnerManager(this.contractService.myIOST);
    this.swapManager = new SwapManager(this.contractService.myIOST);
    this.tokenManager = new TokenManager(this.contractService.myIOST);

    this.load();
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  async load() {
    this.xusdPrice = this.profile.xusdPrice;

    var poolXUSD = 0;

    const all = [(async () => {
      this.xgSupply = (await this.tokenManager.getSupply(environment.xg)) / 1e6;
    }) (), (async () => {
      this.xusdSupply = (await this.tokenManager.getSupply(environment.xusd)) / 1e6;
    }) (), (async () => {
      const pair = await this.swapManager.getPair(environment.xg, environment.xusd);
      this.xgPrice = +(pair.reserve1 / pair.reserve0 * this.xusdPrice).toPrecision(3);

      const xlpShare = await this.tokenManager.getTokenBalance(pair.xlp, environment.burner);
      this.poolXG = +(pair.reserve0 * xlpShare / pair.xlpSupply).toFixed(2);
      poolXUSD += +(pair.reserve1 * xlpShare / pair.xlpSupply).toFixed(2);
    }) (), (async () => {
      const pair = await this.swapManager.getPair('iost', environment.xusd);
      const xlpShare = await this.tokenManager.getTokenBalance(pair.xlp, environment.burner);
      this.poolIOST = +(pair.reserve0 * xlpShare / pair.xlpSupply).toFixed(2);
      poolXUSD += +(pair.reserve1 * xlpShare / pair.xlpSupply).toFixed(2);
    }) (), (async () => {
      const pair = await this.swapManager.getPair('vost', environment.xusd);
      const xlpShare = await this.tokenManager.getTokenBalance(pair.xlp, environment.burner);
      this.poolVOST = +(pair.reserve0 * xlpShare / pair.xlpSupply).toFixed(2);
      poolXUSD += +(pair.reserve1 * xlpShare / pair.xlpSupply).toFixed(2);
    }) (), (async () => {
      this.stabFund = (await this.tokenManager.getTokenBalance('iost', environment.bank)).toFixed(0);
    }) (), (async () => {
      this.iostLocked = ((await this.tokenManager.getTokenBalance('vost', environment.bank)) +
          (await this.tokenManager.getTokenBalance('vost', environment.swap)) +
          (await this.tokenManager.getTokenBalance('iost', environment.swap))).toFixed(0);
    }) ()];

    await Promise.all(all);

    this.poolXUSD = +poolXUSD.toFixed(2);
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
