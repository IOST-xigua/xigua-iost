import { Component, OnInit, Input, ViewChild } from '@angular/core';

import { environment } from '../../environments/environment';

import { ContractService } from '../contract.service';
import { FarmManager } from '../farm-manager';

const XG_LIST = ['xg_3', 'xg_30', 'xg_90', 'xg_180'];

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.css']
})
export class VaultComponent implements OnInit {

  @Input() profile: any;

  language: number = 0;

  farmManager: any = null;

  infoArray: any[] = [];

  vaultManageFullName: string = "";
  vaultManageToken: string = "";
  vaultManagePrecision: number = 0;
  vaultManageExtra: string = "";
  vaultManageExtraPrecision: number = 0;
  vaultManageLockDays: number = 0;
  willShowVaultManage: boolean = false;

  willShowFarmVote: boolean = false;
  willShowFarmVote2: boolean = false;

  countingDownSecs: number = 0;
  now: number = 0;
  nowLocal: number = 0;
  interval: any = null;

  waiting: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));

    this.farmManager = new FarmManager(this.contractService.myIOST);

    this.load();

    this.interval = setInterval(() => {
      this._tick();
    }, 1 * 1e3);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  async load() {
    this.waiting = true;
    this.infoArray = await this.farmManager.getInfoArray();
    this.infoArray.forEach(info => {
      if (XG_LIST.indexOf(info.token) >= 0) {
        info.canVote = 1;
      }
    });
    this.infoArray.sort((a, b) => b.alloc - a.alloc);

    this.waiting = false;
    this.now = await this.farmManager.getNow();
    this.nowLocal = Math.floor(new Date().getTime() / 1000);
  }

  _tick() {
    const nowRealTime = Math.floor(new Date().getTime() / 1000);
    const nowEstimated = this.now + nowRealTime - this.nowLocal;
    this.countingDownSecs = Math.max(0, environment.startTime - nowEstimated);
  }

  showVault(info: any) {
    this.vaultManageFullName = info.fullName;
    this.vaultManageToken = info.token;
    this.vaultManagePrecision = info.tokenPrecision;
    this.vaultManageExtra = info.extra;
    this.vaultManageExtraPrecision = info.extraPrecision;
    this.vaultManageLockDays = parseInt(info.lockDays);

    this.willShowVaultManage = true;
  }

  onCloseVaultManage() {
    this.willShowVaultManage = false;
  }

  onRefreshVaultManage() {
    this.load();
  }

  showFarmVote() {
    this.willShowFarmVote = true;
  }

  onCloseFarmVote() {
    this.willShowFarmVote = false;
  }

  showFarmVote2() {
    this.willShowFarmVote2 = true;
  }

  onCloseFarmVote2() {
    this.willShowFarmVote2 = false;
  }

  changeLanguage(language: number) {
    this.language = language;
  }
}
