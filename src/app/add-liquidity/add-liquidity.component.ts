import { Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';

import { environment } from '../../environments/environment';

import { ContractService } from '../contract.service';
import { SwapManager } from '../swap-manager';
import { TokenManager } from '../token-manager';

@Component({
  selector: 'app-add-liquidity',
  templateUrl: './add-liquidity.component.html',
  styleUrls: ['./add-liquidity.component.css']
})
export class AddLiquidityComponent implements OnInit {

  @ViewChild('tokenSelection') tokenSelection;
  @ViewChild('slippage') slippage;
  @ViewChild('alertMessage') alertMessage;

  @Input() tokenA: any;
  @Input() tokenB: any;
  @Input() profile: any;
  @Output() onAdd: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  swapManager: any = null;
  tokenManager: any = null;

  willShowTokenSelection: boolean = false;
  tokenSelectionIndex: number = 0;

  fromTokenName: string = "---";
  fromTokenImage: string = "_";
  fromBalance: number = 0;
  toTokenName: string = "iost";
  toTokenImage: string = "iost";
  toBalance: number = 0;
  iostBalance: number = 0;

  amountIn: string = "";
  amountInOld: string = "";
  amountOut: string = "";
  amountOutOld: string = "";

  workingOnOut: boolean = true;

  ratioValue: number = 0;
  ratioDirection: boolean = false;
  shareOfPool: number = 0;

  willShowSlippage: boolean = false;
  slippageValue: number = 10;

  waiting: boolean = false;

  willDisable: boolean = true;
  buttonMessageArray: string[] = [];

  pair: any = null;
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

    this.language = parseInt(localStorage.getItem('language'));

    this.load();

    const slippageValue = parseInt(localStorage.getItem("-xg-slippage"));
    if ([1, 5, 10, 50, 100].indexOf(slippageValue) >= 0) {
      this.slippageValue = slippageValue;
    }

    this.interval = setInterval(() => {
      // Every 10 seconds, preprocess in case reserver changes.
      this.preProcess(true);
    }, 10 * 1e3);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  async load() {
    if (this.tokenA && this.tokenB) {
      this.fromTokenName = this.tokenA;
      this.fromTokenImage = this.tokenA;
      this.toTokenName = this.tokenB;
      this.toTokenImage = this.tokenB;
      this.pair = await this.swapManager.getPair(this.tokenA, this.tokenB);
      this.buttonMessageArray = ['请输入数额','Enter an amount'];
    } else {
      this.buttonMessageArray = ['请选择代币','Select a token'];
    }

    if (this.fromTokenName) {
      this.fromBalance = +(await this.tokenManager.getTokenBalance(this.fromTokenName)) || 0;
    }

    if (this.toTokenName) {
      this.toBalance = +(await this.tokenManager.getTokenBalance(this.toTokenName)) || 0;
    }
  }

  showTokenSelection(index: number) {
    this.willShowTokenSelection = true;
    this.tokenSelectionIndex = index;
  }

  async onTokenSelection($event: any) {
    const tokenName = $event.tokenName;
    const balance = $event.balance;
    const imageList = await this.tokenManager.getImageList();

    if (this.tokenSelectionIndex == 0) {
      this.fromTokenName = tokenName;
      this.fromTokenImage = imageList.indexOf(tokenName) >= 0 ? tokenName : "_";

      if (this.fromTokenName == "iost") {
        this.fromBalance = Math.max(balance - 20000, 0);
      } else {
        this.fromBalance = balance;
      }

      if (this.toTokenName == this.fromTokenName) {
        this.toTokenName = "---";
      }
    } else {
      this.toTokenName = tokenName;
      this.toTokenImage = imageList.indexOf(tokenName) >= 0 ? tokenName : "_";

      if (this.toTokenName == "iost") {
        this.toBalance = Math.max(balance - 20000, 0);
      } else {
        this.toBalance = balance;
      }

      if (this.fromTokenName == this.toTokenName) {
        this.fromTokenName = "---";
      }
    }

    this.willShowTokenSelection = false;
    this.preProcess(true);
  }

  onCloseTokenSelection() {
    this.willShowTokenSelection = false;
  }

  goMaxFrom() {
    this.amountIn = this.fromBalance.toString();
    this.enterFromAmount();
  }

  goMaxTo() {
    this.amountOut = this.toBalance.toString();
    this.enterToAmount();
  }

  async preProcess(willReloadPair) {
    if (this.fromTokenName == "---" || this.toTokenName == "---") {
      this.willDisable = true;
      this.buttonMessageArray = ['请选择代币','Select a token'];
      return;
    }

    if (willReloadPair) {
      this.pair = await this.swapManager.getPair(this.fromTokenName, this.toTokenName);
    }

    if (!this.pair) {
      this.willDisable = true;
      this.buttonMessageArray = ['交易对不存在','Pair doesn\'t exist'];
      return;
    }

    var valueIn = parseFloat(this.amountIn);
    var valueOut = parseFloat(this.amountOut);

    if (this.workingOnOut && !valueIn || !this.workingOnOut && !valueOut) {
      this.willDisable = true;
      this.buttonMessageArray = ['请输入数额','Enter an amount'];

      // When the user deletes, the other value should also delete.
      if (+this.pair.reserve0 && +this.pair.reserve1) {
        if (this.workingOnOut) {
          this.amountOut = "";
          this.amountOutOld = "";
        } else {
          this.amountIn = "";
          this.amountInOld = "";
        }
      }
      return;
    }

    if (this.pair.token0 == this.fromTokenName && +this.pair.reserve0 && +this.pair.reserve1) {
      if (this.workingOnOut) {
        this.amountOut = (valueIn * this.pair.reserve1 / this.pair.reserve0).toFixed(this.pair.precision1);
        this.amountOutOld = this.amountOut;
        valueOut = parseFloat(this.amountOut);
      } else {
        this.amountIn = (valueOut * this.pair.reserve0 / this.pair.reserve1).toFixed(this.pair.precision0);
        this.amountInOld = this.amountIn;
        valueIn = parseFloat(this.amountIn);
      }
    } else if (+this.pair.reserve0 && +this.pair.reserve1) {
      if (this.workingOnOut) {
        this.amountOut = (valueIn * this.pair.reserve0 / this.pair.reserve1).toFixed(this.pair.precision0);
        this.amountOutOld = this.amountOut;
        valueOut = parseFloat(this.amountOut);
      } else {
        this.amountIn = (valueOut * this.pair.reserve1 / this.pair.reserve0).toFixed(this.pair.precision1);
        this.amountInOld = this.amountIn;
        valueIn = parseFloat(this.amountIn);
      }
    }

    if (!valueIn || !valueOut) {
      this.willDisable = true;
      this.buttonMessageArray = ['请输入数额','Enter an amount'];
      return;
    }

    if (this.ratioDirection) {
      this.ratioValue = +(valueIn / valueOut).toPrecision(4);
    } else {
      this.ratioValue = +(valueOut / valueIn).toPrecision(4);
    }

    if (+this.pair.xlpSupply > 0) {
      this.shareOfPool = await this.swapManager.getTokenBalance(this.pair.xlp) / this.pair.xlpSupply;
    } else {
      this.shareOfPool = 1;
    }

    if (valueIn > this.fromBalance) {
      this.willDisable = true;
      this.buttonMessageArray = [this.fromTokenName + '余额不足', this.fromTokenName + ' not enough balance'];
      return;
    }

    if (valueOut > this.toBalance) {
      this.willDisable = true;
      this.buttonMessageArray = [this.toTokenName + '余额不足', this.toTokenName + ' not enough balance'];
      return;
    }

    this.willDisable = false;
    this.buttonMessageArray = ['提交','Submit'];
  }

  async enterFromAmount() {
    this.workingOnOut = true;

    if (isNaN(+this.amountIn)) {
      this.amountIn = this.amountInOld;
      return;
    }

    this.amountIn = this.amountIn.trim();
    this.amountInOld = this.amountIn;
    this.preProcess(false);
  }

  async enterToAmount() {
    this.workingOnOut = false;

    if (isNaN(+this.amountOut)) {
      this.amountOut = this.amountOutOld;
      return;
    }

    this.amountOut = this.amountOut.trim();
    this.amountOutOld = this.amountOut;
    this.preProcess(false);
  }

  checkAmount($event) {
    if (environment.allowedKeycodes.indexOf($event.which) < 0) {
      return false;
    }

    return true;
  }

  reverseRatio() {
    this.ratioDirection = !this.ratioDirection;
    this.preProcess(false);
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
    await this.addLiquidity();
  }

  cancel() {
    this.onClose.emit();
  }

  async addLiquidity() {
    this.waiting = true;
    try {
      const res = await this.contractService.addLiquidity(
          this.fromTokenName, this.toTokenName,
          +this.amountIn,
          +this.amountOut,
          +((+this.amountIn) * (1 - this.slippageValue / 1000)).toFixed(this.pair.precision0),
          +((+this.amountOut) * (1 - this.slippageValue / 1000)).toFixed(this.pair.precision1));

      this.showAlert('流动性添加成功', 'Liquidity added successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you added, please refresh the page in a few seconds')

      this.amountIn = "";
      this.amountInOld = "";
      this.amountOut = "";
      this.amountOutOld = "";
      this.preProcess(true);

      if (this.fromTokenName) {
        this.fromBalance = +(await this.tokenManager.getTokenBalance(this.fromTokenName)) || 0;
      }

      if (this.toTokenName) {
        this.toBalance = +(await this.tokenManager.getTokenBalance(this.toTokenName)) || 0;
      }

      this.onAdd.emit();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else if (err.indexOf('Xigua: no pair') >= 0) {
        this.showAlert('添加失败', 'Transaction Failed', '该交易对不存在', 'The pair doesn\'t exit')
      } else {
        this.showAlert('添加失败', 'Transaction Failed', '请再次尝试', 'Please try again')
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
