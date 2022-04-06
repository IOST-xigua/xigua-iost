import { Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';

import { ContractService } from '../contract.service';
import { SwapManager } from '../swap-manager';
import { TokenManager } from '../token-manager';

@Component({
  selector: 'app-create-pair',
  templateUrl: './create-pair.component.html',
  styleUrls: ['./create-pair.component.css']
})
export class CreatePairComponent implements OnInit {

  @ViewChild('tokenSelection') tokenSelection;
  @ViewChild('alertMessage') alertMessage;

  @Input() profile: any;
  @Output() onCreate: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  tokenManager: any = null;

  willShowTokenSelection: boolean = false;
  tokenSelectionIndex: number = 0;

  fromTokenName: string = "---";
  fromTokenImage: string = "_";
  fromBalance: number = 0;
  toTokenName: string = "iost";
  toTokenImage: string = "iost";
  toBalance: number = 0;
  xgBalance: number = 0;

  amountIn: string = "";
  amountInOld: string = "";
  amountOut: string = "";
  amountOutOld: string = "";

  ratioValue: number = 0;
  ratioDirection: boolean = false;

  waiting: boolean = false;

  willDisable: boolean = true;
  buttonMessageArray: string[] = [];

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.tokenManager = new TokenManager(this.contractService.myIOST);

    this.language = parseInt(localStorage.getItem('language'));

    this.buttonMessageArray = ['请选择代币','Select a token'];
    this.loadInitialBalance();
  }

  async loadInitialBalance() {
    this.xgBalance = +(await this.tokenManager.getTokenBalance("xg")) || 0;

    if (this.toTokenName == "xg") {
      this.toBalance = this.xgBalance;
    } else {
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

      if (this.fromTokenName == "xg") {
        this.fromBalance = Math.max(balance - 200, 0);
      } else {
        this.fromBalance = balance;
      }

      if (this.toTokenName == this.fromTokenName) {
        this.toTokenName = "---";
      }
    } else {
      this.toTokenName = tokenName;
      this.toTokenImage = imageList.indexOf(tokenName) >= 0 ? tokenName : "_";

      if (this.toTokenName == "xg") {
        this.toBalance = Math.max(balance - 200, 0);
      } else {
        this.toBalance = balance;
      }

      if (this.fromTokenName == this.toTokenName) {
        this.fromTokenName = "---";
      }
    }

    this.willShowTokenSelection = false;
    this.preProcess();
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

  preProcess() {
    if (this.fromTokenName == "---" || this.toTokenName == "---") {
      this.willDisable = true;
      this.buttonMessageArray = ['请选择代币','Select a token'];
      return;
    }

    const valueIn = parseFloat(this.amountIn);
    const valueOut = parseFloat(this.amountOut);

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

    if (valueIn > this.fromBalance || valueOut > this.toBalance) {
      this.willDisable = true;
      this.buttonMessageArray = ['余额不足','Not enough balance'];
      return;
    }

    if (this.fromTokenName == 'xg' && valueIn + 200 > this.xgBalance ||
        this.toTokenName == 'xg' && valueOut + 200 > this.xgBalance ||
        this.xgBalance < 200) {
      this.willDisable = true;
      this.buttonMessageArray = ['xg余额不足','Not enough xg'];
      return;
    }

    this.willDisable = false;
    this.buttonMessageArray = ['提交','Submit'];
  }

  async enterFromAmount() {
    if (isNaN(+this.amountIn)) {
      this.amountIn = this.amountInOld;
      return;
    }

    this.amountIn = this.amountIn.trim();
    this.amountInOld = this.amountIn;
    this.preProcess();
  }

  async enterToAmount() {
    if (isNaN(+this.amountOut)) {
      this.amountOut = this.amountOutOld;
      return;
    }
    
    this.amountOut = this.amountOut.trim();
    this.amountOutOld = this.amountOut;
    this.preProcess();
  }

  checkAmount($event) {
    if ([8, 16, 17, 91, 37, 39, 86, 190, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57].indexOf($event.which) < 0) {
      return false;
    }

    return true;
  }

  reverseRatio() {
    this.ratioDirection = !this.ratioDirection;
    this.preProcess();
  }

  async submit() {
    await this.createPairAndAddLiquidity();
  }

  cancel() {
    this.onClose.emit();
  }

  async createPairAndAddLiquidity() {
    this.waiting = true;
    try {
      const res = await this.contractService.createPairAndAddLiquidity(
          this.fromTokenName, this.toTokenName, +this.amountIn, +this.amountOut);

      this.profile.allPairs.push([this.fromTokenName, this.toTokenName]);

      this.showAlert('添加成功', 'Pair Added Successfully',
         '如果您希望给代币添加图标，请发邮件到contact@xigua.ist申请',
         'If you wanna add an icon for certain token, please apply by email contact@xigua.ist')

      this.amountIn = "";
      this.amountInOld = "";
      this.amountOut = "";
      this.amountOutOld = "";
      this.preProcess();

      if (this.fromTokenName) {
        this.fromBalance = +(await this.tokenManager.getTokenBalance(this.fromTokenName)) || 0;
      }

      if (this.toTokenName) {
        this.toBalance = +(await this.tokenManager.getTokenBalance(this.toTokenName)) || 0;
      }

      this.onCreate.emit();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else if (err.indexOf('pair exists') >= 0) {
        this.showAlert('添加失败', 'Transaction Failed', '该交易对已经存在', 'The pair already exits')
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

    if (this.alertMessage) {
      this.alertMessage.changeLanguage(language);
    }
  }
}
