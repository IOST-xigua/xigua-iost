import { Component, OnInit, Input, ViewChild } from '@angular/core';

import { BigNumber } from "bignumber.js";

import { environment } from '../../environments/environment';

import { ContractService } from '../contract.service';
import { SwapManager } from '../swap-manager';
import { TokenManager } from '../token-manager';

const ROUND_DOWN = 1;

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.css']
})
export class SwapComponent implements OnInit {

  @ViewChild('tokenSelection') tokenSelection;
  @ViewChild('slippage') slippage;
  @ViewChild('alertMessage') alertMessage;

  @Input() profile: any;

  swapManager: any = null;
  tokenManager: any = null;

  language: number = 0;

  willShowTokenSelection: boolean = false;
  tokenSelectionIndex: number = 0;

  willDisable: boolean = true;
  buttonMessageArray: string[] = [];

  willShowSlippage: boolean = false;

  willShowInfo: boolean = false;
  infoMinOrMax: boolean = false;  // false: min, true: max
  infoMinOrMaxAmount: number = 0;
  infoPriceImpact: number = 0;
  infoPath: string = "";
  infoPathArray: string[] = [];
  infoFee: string = "";
  workingOnOut: boolean = true;

  fromTokenName: string = "iost";
  fromTokenImage: string = "iost";
  fromBalance: number = 0;
  fromPrice: number = 0;
  toTokenName: string = "---";
  toTokenImage: string = "_";
  toBalance: number = 0;
  toPrice: number = 0;

  slippageValue: number = 10;

  amountIn: string = "";
  amountInOld: string = "";
  amountOut: string = "";
  amountOutOld: string = "";

  ratioValue: number = 0;
  ratioDirection: boolean = false;

  waiting: boolean = false;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  interval: any = null;

  isMobile: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.swapManager = new SwapManager(this.contractService.myIOST);
    this.tokenManager = new TokenManager(this.contractService.myIOST);

    this.language = parseInt(localStorage.getItem('language'));

    this.buttonMessageArray = ['请输入兑换额','Enter an amount'];
    this.loadInitialBalance();

    const slippageValue = parseInt(localStorage.getItem("-xg-slippage"));
    if ([1, 5, 10, 50, 100].indexOf(slippageValue) >= 0) {
      this.slippageValue = slippageValue;
    }

    this.interval = setInterval(() => {
      this._refresh();
    }, 10 * 1e3);

    this.isMobile = this._isMobile();
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  _isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  async loadInitialBalance() {
    const balance = +(new BigNumber(await this.tokenManager.getTokenBalance(this.fromTokenName)).toFixed(6, ROUND_DOWN));
    this.fromBalance = balance;
  }

  showTokenSelection(index: number) {
    this.willShowTokenSelection = true;
    this.tokenSelectionIndex = index;
  }

  _refresh() {
    if (this.waiting) return;

    if (this.workingOnOut) {
      this._showOut();
    } else {
      this._showIn();
    }
  }

  async onTokenSelection($event: any) {
    this.willShowTokenSelection = false;

    const tokenName = $event.tokenName;
    const imageList = await this.tokenManager.getImageList();

    if (this.tokenSelectionIndex == 0) {
      this.fromTokenName = tokenName;
      this.fromTokenImage = imageList.indexOf(tokenName) >= 0 ? tokenName : "_";

      if (this.toTokenName == this.fromTokenName) {
        this.toTokenName = "---";
        this.toBalance = 0;
      }

      const balance = $event.balance || +(new BigNumber(await this.swapManager.getTokenBalance(tokenName)).toFixed(6, ROUND_DOWN));
      this.fromBalance = balance;
    } else {
      this.toTokenName = tokenName;
      this.toTokenImage = imageList.indexOf(tokenName) >= 0 ? tokenName : "_";

      if (this.fromTokenName == this.toTokenName) {
        this.fromTokenName = "---";
        this.fromBalance = 0;
      }

      const balance = $event.balance || +(new BigNumber(await this.swapManager.getTokenBalance(tokenName)).toFixed(6, ROUND_DOWN));
      this.toBalance = balance;
    }

    this._refresh();
  }

  onCloseTokenSelection() {
    this.willShowTokenSelection = false;
  }

  goMax() {
    this.amountIn = this.fromBalance.toString();
    this.enterInAmount();
  }

  goReverse() {
    const tempName = this.fromTokenName;
    const tempImage = this.fromTokenImage;
    const tempBalance = this.fromBalance;
    const tempAmount = this.amountIn;
    const tempAmountOld = this.amountInOld;

    this.fromTokenName = this.toTokenName;
    this.fromTokenImage = this.toTokenImage;
    this.fromBalance = this.toBalance;
    this.amountIn = this.amountOut;
    this.amountInOld = this.amountOutOld;

    this.toTokenName = tempName;
    this.toTokenImage = tempImage;
    this.toBalance = tempBalance;
    this.amountOut = tempAmount;
    this.amountOutOld = tempAmountOld;

    this._refresh();
  }

  reverseRatio() {
    this.ratioDirection = !this.ratioDirection;
    if (this.ratioDirection) {
      this.ratioValue = +((+this.amountIn) / (+this.amountOut)).toPrecision(4);
    } else {
      this.ratioValue = +((+this.amountOut) / (+this.amountIn)).toPrecision(4);
    }
  }

  showSlippage() {
    this.willShowSlippage = true;
  }

  onSlippage($event) {
    this.slippageValue = $event.value;
    this.willShowSlippage = false;

    this._refresh();
  }

  onCloseSlippage() {
    this.willShowSlippage = false;
  }

  async _showOut() {
    if (this.fromTokenName == "---" || this.toTokenName == "---") {
      this.willShowInfo = false;
      this.amountOut = "";
      this.amountOutOld = "";
      this.willDisable = true;
      this.buttonMessageArray = ['请选择代币','Select a token'];
      return;
    }

    if (!this.amountIn || parseFloat(this.amountIn) == 0) {
      this.willShowInfo = false;
      this.amountOut = "";
      this.amountOutOld = "";
      this.willDisable = true;
      this.buttonMessageArray = ['请输入兑换额','Enter an amount'];
      return;
    }

    const res = await this.swapManager.getAmountOutSmartly(
        this.amountIn,
        this.slippageValue,
        this.profile.allPairs,
        this.fromTokenName,
        this.toTokenName);

    if (!res) {
      // This should not happen.
      this.willShowInfo = false;
      this.amountOut = "";
      this.amountOutOld = "";
      this.willDisable = true;
      this.buttonMessageArray = ['流动性不足','Not enough liquidity'];
      return;
    }

    this.willShowInfo = true;

    this.amountOut = res[0].toString();
    this.amountOutOld = res[0].toString();
    this.infoMinOrMax = false;
    this.infoMinOrMaxAmount = res[1];
    this.infoPriceImpact = res[2];
    this.infoPath = res[3].join(" -> ");
    this.infoPathArray = res[3];
    this.infoFee = (+(parseFloat(this.amountIn) * 0.003).toFixed(6)).toString();

    if (this.ratioDirection) {
      this.ratioValue = +((+this.amountIn) / (+this.amountOut)).toPrecision(4);
    } else {
      this.ratioValue = +((+this.amountOut) / (+this.amountIn)).toPrecision(4);
    }

    if (this.fromTokenName == "iost") {
      this.fromPrice = this.profile.iostPrice;
      this.toPrice = +(this.fromPrice * (+this.amountIn) / (+this.amountOut)).toPrecision(3);
    } else if (this.fromTokenName == "xusd") {
      this.fromPrice = this.profile.xusdPrice;
      this.toPrice = +(this.fromPrice * (+this.amountIn) / (+this.amountOut)).toPrecision(3);
    } else if (this.toTokenName == "iost") {
      this.toPrice = this.profile.iostPrice;
      this.fromPrice = +(this.toPrice * (+this.amountOut) / (+this.amountIn)).toPrecision(3);
    } else if (this.toTokenName == "xusd") {
      this.toPrice = this.profile.xusdPrice;
      this.fromPrice = +(this.toPrice * (+this.amountOut) / (+this.amountIn)).toPrecision(3);
    } else {
      this.fromPrice = 0;
      this.toPrice = 0;
    }

    if (parseFloat(this.amountIn) > this.fromBalance) {
      this.willDisable = true;
      this.buttonMessageArray = ['余额不足','Not enough balance'];
      return;
    }

    this.willDisable = false;
    this.buttonMessageArray = ['兑换','Swap'];
  }

  async _showIn() {
    if (this.fromTokenName == "---" || this.toTokenName == "---") {
      this.willShowInfo = false;
      this.amountIn = "";
      this.amountInOld = "";
      this.willDisable = true;
      this.buttonMessageArray = ['请选择代币','Select a token'];
      return;
    }

    if (!this.amountOut || parseFloat(this.amountOut) == 0) {
      this.willShowInfo = false;
      this.amountIn = "";
      this.amountInOld = "";
      this.willDisable = true;
      this.buttonMessageArray = ['请输入兑换额','Enter an amount'];
      return;
    }

    const res = await this.swapManager.getAmountInSmartly(
        this.amountOut,
        this.slippageValue,
        this.profile.allPairs,
        this.fromTokenName,
        this.toTokenName);

    if (!res) {
      // Not enough liquidity.
      this.willShowInfo = false;
      this.amountIn = "";
      this.amountInOld = "";
      this.willDisable = true;
      this.buttonMessageArray = ['流动性不足','Not enough liquidity'];
      return;
    }

    this.willShowInfo = true;

    this.amountIn = res[0].toString();
    this.amountInOld = res[0].toString();
    this.infoMinOrMax = true;
    this.infoMinOrMaxAmount = res[1];
    this.infoPriceImpact = res[2];
    this.infoPath = res[3].join(" -> ");
    this.infoPathArray = res[3];
    this.infoFee = (+(parseFloat(this.amountIn) * 0.003).toFixed(6)).toString();

    if (this.ratioDirection) {
      this.ratioValue = +((+this.amountIn) / (+this.amountOut)).toPrecision(4);
    } else {
      this.ratioValue = +((+this.amountOut) / (+this.amountIn)).toPrecision(4);
    }

    if (this.fromTokenName == "iost") {
      this.fromPrice = this.profile.iostPrice;
      this.toPrice = +(this.fromPrice * (+this.amountIn) / (+this.amountOut)).toPrecision(3);
    } else if (this.fromTokenName == "xusd") {
      this.fromPrice = this.profile.xusdPrice;
      this.toPrice = +(this.fromPrice * (+this.amountIn) / (+this.amountOut)).toPrecision(3);
    } else if (this.toTokenName == "iost") {
      this.toPrice = this.profile.iostPrice;
      this.fromPrice = +(this.toPrice * (+this.amountOut) / (+this.amountIn)).toPrecision(3);
    } else if (this.toTokenName == "xusd") {
      this.toPrice = this.profile.xusdPrice;
      this.fromPrice = +(this.toPrice * (+this.amountOut) / (+this.amountIn)).toPrecision(3);
    } else {
      this.fromPrice = 0;
      this.toPrice = 0;
    }

    if (parseFloat(this.amountIn) > this.fromBalance) {
      this.willDisable = true;
      this.buttonMessageArray = ['余额不足','Not enough balance'];
      return;
    }

    this.willDisable = false;
    this.buttonMessageArray = ['兑换','Swap'];
  }

  async enterInAmount() {
    this.workingOnOut = true;

    if (isNaN(+this.amountIn)) {
      this.amountIn = this.amountInOld;
      return;
    }

    this.amountIn = this.amountIn.trim();

    if (this.amountIn != this.amountInOld) {
      await this._showOut();
    }

    this.amountInOld = this.amountIn;
  }

  async enterOutAmount() {
    this.workingOnOut = false;

    if (isNaN(+this.amountOut)) {
      this.amountOut = this.amountOutOld;
      return;
    }

    this.amountOut = this.amountOut.trim();

    if (this.amountOut != this.amountOutOld) {
      await this._showIn();
    }

    this.amountOutOld = this.amountOut;
  }

  checkAmount($event) {
    if (environment.allowedKeycodes.indexOf($event.which) < 0) {
      return false;
    }

    return true;
  }

  async goSwap() {
    if (this.workingOnOut) {
      await this.swapExactTokensForTokens();
    } else {
      await this.swapTokensForExactTokens();
    }
  }

  async swapExactTokensForTokens() {
    this.waiting = true;
    try {
      const res = await this.contractService.swapExactTokensForTokens(
          +this.amountIn, this.infoMinOrMaxAmount, this.infoPathArray);

      this.fromBalance = +(new BigNumber(await this.swapManager.getTokenBalance(this.fromTokenName)).toFixed(6, ROUND_DOWN));
      this.toBalance = +(new BigNumber(await this.swapManager.getTokenBalance(this.toTokenName)).toFixed(6, ROUND_DOWN));

      this.showAlert('兑换成功', 'Transaction Succeeded',
         '用' + res[0] + ' ' + this.infoPathArray[0] + '换得了' + res[res.length - 1] + ' ' + this.infoPathArray[this.infoPathArray.length - 1],
         'Swapped ' + res[0] + ' ' + this.infoPathArray[0] + ' for ' + res[res.length - 1] + ' ' + this.infoPathArray[this.infoPathArray.length - 1]);

      this.amountIn = "";
      this.enterInAmount();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('交易失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
  }

  async swapTokensForExactTokens() {
    this.waiting = true;
    try {
      const res = await this.contractService.swapTokensForExactTokens(
          +this.amountOut, this.infoMinOrMaxAmount, this.infoPathArray);

      this.fromBalance = +(new BigNumber(await this.swapManager.getTokenBalance(this.fromTokenName)).toFixed(6, ROUND_DOWN));
      this.toBalance = +(new BigNumber(await this.swapManager.getTokenBalance(this.toTokenName)).toFixed(6, ROUND_DOWN));

      this.showAlert('兑换成功', 'Transaction Succeeded',
         '用' + res[0] + ' ' + this.infoPathArray[0] + '换得了' + res[res.length - 1] + ' ' + this.infoPathArray[this.infoPathArray.length - 1],
         'Swapped ' + res[0] + ' ' + this.infoPathArray[0] + ' for ' + res[res.length - 1] + ' ' + this.infoPathArray[this.infoPathArray.length - 1])

      this.amountIn = "";
      this.enterInAmount();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('交易失败', 'Transaction Failed', '请再次尝试', 'Please try again')
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

  changeLanguage(language: number) {
    this.language = language;

    if (this.tokenSelection) {
      this.tokenSelection.changeLanguage(language);
    }

    if (this.slippage) {
      this.slippage.changeLanguage(language);
    }

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }
}
