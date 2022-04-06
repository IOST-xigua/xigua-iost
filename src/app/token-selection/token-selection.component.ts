import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

import { BigNumber } from "bignumber.js";

import { ContractService } from '../contract.service';
import { TokenManager } from '../token-manager';

const ROUND_DOWN = 1;

@Component({
  selector: 'app-token-selection',
  templateUrl: './token-selection.component.html',
  styleUrls: ['./token-selection.component.css']
})
export class TokenSelectionComponent implements OnInit {
  @Input() profile: any;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  tokenManager: any = null;

  allTokens: any[] = [];
  cachedBalance: any = {};

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.tokenManager = new TokenManager(this.contractService.myIOST);

    this._loadDefaultList();
  }

  async _loadDefaultList() {
    const defaultList = await this.tokenManager.getDefaultList();
    await this._loadList(defaultList);
  }

  async _loadList(list) {
    const imageList = await this.tokenManager.getImageList();

    this.allTokens = list.map(tokenName => {
      const token = {
        name: tokenName,
        image: imageList.indexOf(tokenName) >= 0 ? tokenName : "_",
        balance: 0
      }

      if (this.cachedBalance[tokenName]) {
        token.balance = this.cachedBalance[tokenName];
      } else {
        this.tokenManager.getTokenBalance(tokenName).then(balance => {
          token.balance = +(new BigNumber(balance).toFixed(6, ROUND_DOWN));
          this.cachedBalance[tokenName] = token.balance;
        });
      }

      return token;
    });
  }

  search($event) {
    if ($event.which != 8 && ($event.which > 90 || $event.which < 48)) {
      return;
    }

    const prefix = $event.target.value.toLowerCase();

    if (!prefix) {
      this._loadDefaultList();
      return;
    }

    const list = this.tokenManager.getMergedList(this.profile.allPairs).filter(tokenName => tokenName.indexOf(prefix) == 0);

    this._loadList(list);

    if (list.indexOf(prefix) >= 0 || prefix.length < 2) {
      return;
    }

    this.tokenManager.getTokenInfo(prefix).then(async info => {
      if (info) {
        const balance = +(new BigNumber(await this.tokenManager.getTokenBalance(prefix)).toFixed(6, ROUND_DOWN));
        this.allTokens.unshift({
          name: prefix,
          image: '_',
          balance: balance
        });
      }
    });
  }

  async select(tokenName: string) {
    if (this.cachedBalance[tokenName] !== undefined) {
      this.onSelect.emit({
        tokenName: tokenName,
        balance: this.cachedBalance[tokenName]
      });
    } else {
      const balance = +(new BigNumber(await this.tokenManager.getTokenBalance(tokenName)).toFixed(6, ROUND_DOWN));
      this.onSelect.emit({
        tokenName: tokenName,
        balance: balance
      });
    }
  }

  close() {
    this.onClose.emit();
  }

  changeLanguage(language: number) {
    this.language = language;
  }
}
