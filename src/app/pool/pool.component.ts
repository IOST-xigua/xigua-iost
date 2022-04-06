import { Component, OnInit, Input, ViewChild } from '@angular/core';

import { ContractService } from '../contract.service';
import { SwapManager } from '../swap-manager';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.css']
})
export class PoolComponent implements OnInit {

  @ViewChild('createPair') createPair;
  @ViewChild('alertMessage') alertMessage;

  @Input() profile: any;

  language: number = 0;

  swapManager: any = null;

  waiting: boolean = false;

  willShowCreatePair: boolean = false;

  willShowAddLiquidity: boolean = false;
  addLiquidityTokenA: string = "";
  addLiquidityTokenB: string = "";
  addLiquidityIndex: number = 0;

  willShowRemoveLiquidity: boolean = false;
  removeLiquidityToken0: string = "";
  removeLiquidityToken1: string = "";
  removeLiquidityIndex: number = 0;

  myPairObjs: any[] = [];

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.language = parseInt(localStorage.getItem('language'));
    this.swapManager = new SwapManager(this.contractService.myIOST);

    this.load();
  }

  async load() {
    this.waiting = true;
    const myPairs = await this.swapManager.myPairs(
        this.profile.allPairs, this.contractService.getUserAddress());
    this.myPairObjs = myPairs.map(pair => {
      return {
        token0: pair[0],
        token1: pair[1],
        loading: false,
        showing: false
      };
    });
    this.waiting = false;
  }

  async showPair(index: number) {
    await this.loadPair(index);
    this.myPairObjs[index].showing = true;
  }

  hidePair(index: number) {
    this.myPairObjs[index].showing = false;
  }

  async loadPair(index: number) {
    this.myPairObjs[index].loading = true;
    const pair = await this.swapManager.getPair(this.myPairObjs[index].token0, this.myPairObjs[index].token1);
    this.myPairObjs[index].xlpAmount = await this.swapManager.getTokenBalance(pair.xlp);
    this.myPairObjs[index].xlpShare = +pair.xlpSupply ? this.myPairObjs[index].xlpAmount / (+pair.xlpSupply) : 0;
    this.myPairObjs[index].token0Amount =
        this.myPairObjs[index].xlpShare * pair.reserve0;
    this.myPairObjs[index].token1Amount =
        this.myPairObjs[index].xlpShare * pair.reserve1;
    this.myPairObjs[index].loading = false;
  }

  showCreatePair() {
    this.willShowCreatePair = true;
  }

  showAddLiquidity(tokenA: string, tokenB: string, index: number) {
    this.addLiquidityTokenA = tokenA;
    this.addLiquidityTokenB = tokenB;
    this.addLiquidityIndex = index;
    this.willShowAddLiquidity = true;
  }

  showRemoveLiquidity(token0: string, token1: string, index: number) {
    this.removeLiquidityToken0 = token0;
    this.removeLiquidityToken1 = token1;
    this.removeLiquidityIndex = index;
    this.willShowRemoveLiquidity = true;
  }

  onCreatePair() {
    this.load();
  }

  onCloseCreatePair() {
    this.willShowCreatePair = false;
  }

  onAddLiquidity() {
    if (this.addLiquidityIndex >= 0) {
      this.loadPair(this.addLiquidityIndex);
    } else {
      this.load();
    }
  }

  onCloseAddLiquidity() {
    this.willShowAddLiquidity = false;
  }

  onRemoveLiquidity($event) {
    this.willShowRemoveLiquidity = false;

    this.showAlert('流动性去除成功', 'Liquidity removed successfully',
       '如果还没有看到，请几秒后刷新页面',
       'If you don\'t see what you added, please refresh the page in a few seconds')

    if (this.removeLiquidityIndex >= 0 && $event.value < 100) {
      this.loadPair(this.removeLiquidityIndex);
    } else {
      // If removed 100% liquidity.
      this.load();
    }
  }

  onCloseRemoveLiquidity() {
    this.willShowRemoveLiquidity = false;
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

    if (this.createPair) {
      this.createPair.changeLanguage(language);
    }

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }
}
