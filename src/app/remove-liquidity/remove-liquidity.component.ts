import { Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';

import { ContractService } from '../contract.service';
import { SwapManager } from '../swap-manager';
import { TokenManager } from '../token-manager';

@Component({
  selector: 'app-remove-liquidity',
  templateUrl: './remove-liquidity.component.html',
  styleUrls: ['./remove-liquidity.component.css']
})
export class RemoveLiquidityComponent implements OnInit {

  @ViewChild('slider') slider: any;
  @ViewChild('slippage') slippage;
  @ViewChild('alertMessage') alertMessage;

  @Input() token0: any;
  @Input() token1: any;
  @Input() profile: any;
  @Output() onRemove: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  swapManager: any = null;
  tokenManager: any = null;

  isMovingSlider: boolean = false;
  sliderXOffset: number = 0;
  sliderX: number = 0;

  sliderValue: number = 0;

  pair: any = null;
  myShare: number = 0;  // of xlp

  amount0: number = 0;
  amount1: number = 0;

  removeAmount0: number = 0;
  removeAmount1: number = 0;
  liquidityToRemove: number = 0;

  ratioValue: number = 0;
  ratioDirection: boolean = false;

  willShowSlippage: boolean = false;
  slippageValue: number = 10;

  waiting: boolean = false;

  interval: any = null;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.swapManager = new SwapManager(this.contractService.myIOST);
    this.tokenManager = new TokenManager(this.contractService.myIOST);

    const slippageValue = parseInt(localStorage.getItem("-xg-slippage"));
    if ([1, 5, 10, 50, 100].indexOf(slippageValue) >= 0) {
      this.slippageValue = slippageValue;
    }

    this._load();

    this.interval = setInterval(() => {
      // Every 10 seconds, load in case reserver changes.
      this._load();
    }, 10 * 1e3);

    this.language = parseInt(localStorage.getItem('language'));
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  async _load() {
    this.pair = await this.swapManager.getPair(this.token0, this.token1);
    this.myShare = await this.tokenManager.getTokenBalance(this.pair.xlp);
    this.amount0 = +(this.pair.reserve0 * this.myShare / this.pair.xlpSupply).toFixed(this.pair.precision0);
    this.amount1 = +(this.pair.reserve1 * this.myShare / this.pair.xlpSupply).toFixed(this.pair.precision1);
    this.ratioValue = +(this.pair.reserve0 / this.pair.reserve1).toFixed(this.pair.precision0);
    this._reloadBySliderValue();
  }

  _reloadBySliderValue() {
    this.removeAmount0 = +(this.amount0 * this.sliderValue / 100).toFixed(this.pair.precision0);
    this.removeAmount1 = +(this.amount1 * this.sliderValue / 100).toFixed(this.pair.precision1);
    this.liquidityToRemove = Math.min(this.myShare, +(this.myShare * this.sliderValue / 100).toFixed(8));
  }

  _isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  setSliderValue(value: number) {
    if (!this.pair) {
      return;
    }

    this.sliderX = value / 100 * this.slider.nativeElement.offsetWidth;
    this.sliderValue = value;
    this._reloadBySliderValue();
  }

  onSliderMove($event) {
    if (!this.pair) {
      return;
    }

    if (this.isMovingSlider) {
      if ($event.type == "touchmove" && this._isMobile()) {
        this.sliderX = Math.max(0, Math.min(this.slider.nativeElement.offsetWidth, $event.touches[0].clientX - this.sliderXOffset));
        this.sliderValue = Math.round(this.sliderX / this.slider.nativeElement.offsetWidth * 100);
        this._reloadBySliderValue();
      } else if ($event.type == "mousemove" && !this._isMobile()) {
        this.sliderX = Math.max(0, Math.min(this.slider.nativeElement.offsetWidth, $event.screenX - this.sliderXOffset));
        this.sliderValue = Math.round(this.sliderX / this.slider.nativeElement.offsetWidth * 100);
        this._reloadBySliderValue();
      }
    }
  }

  onSliderMoveStart($event) {
    if ($event.type == "touchstart" && this._isMobile()) {
      this.isMovingSlider = true;
      this.sliderXOffset = -this.sliderX + $event.touches[0].clientX;
    } else if ($event.type == "mousedown" && !this._isMobile()) {
      this.isMovingSlider = true;
      this.sliderXOffset = -this.sliderX + $event.screenX;
    }
  }

  onSliderMoveEnd($event) {
    this.isMovingSlider = false;
  }

  reverseRatio() {
    this.ratioDirection = !this.ratioDirection;
    if (this.ratioDirection) {
      this.ratioValue = +(this.pair.reserve1 / this.pair.reserve0).toFixed(this.pair.precision1);
    } else {
      this.ratioValue = +(this.pair.reserve0 / this.pair.reserve1).toFixed(this.pair.precision0);
    }
  }

  showSlippage() {
    this.willShowSlippage = true;
  }

  onSlippage($event) {
    this.slippageValue = $event.value;
    this.willShowSlippage = false;
  }

  onCloseSlippage() {
    this.willShowSlippage = false;
  }

  async submit() {
    await this.removeLiquidity();
  }

  cancel() {
    this.onClose.emit();
  }

  async removeLiquidity() {
    this.waiting = true;
    try {
      const res = await this.contractService.removeLiquidity(
          this.token0, this.token1,
          this.pair.xlp,
          this.liquidityToRemove,
          +(this.removeAmount0 * (1 - this.slippageValue / 1000)).toFixed(this.pair.precision0),
          +(this.removeAmount1 * (1 - this.slippageValue / 1000)).toFixed(this.pair.precision1));

      this.onRemove.emit({
        value: this.sliderValue
      });
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else if (err.indexOf('Xigua: no pair') >= 0) {
        this.showAlert('去除失败', 'Transaction Failed', '该交易对不存在', 'The pair doesn\'t exit')
      } else {
        this.showAlert('去除失败', 'Transaction Failed', '请再次尝试', 'Please try again')
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

    if (this.slippage) {
      this.slippage.changeLanguage(language);
    }

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }
}
