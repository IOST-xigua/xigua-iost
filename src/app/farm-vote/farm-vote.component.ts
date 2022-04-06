import { Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';

import { environment } from '../../environments/environment';

import { ContractService } from '../contract.service';

import { FarmHelperManager } from '../farm-helper-manager';


@Component({
  selector: 'app-farm-vote',
  templateUrl: './farm-vote.component.html',
  styleUrls: ['./farm-vote.component.css']
})
export class FarmVoteComponent implements OnInit {

  @ViewChild('alertMessage') alertMessage;

  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  farmHelperManager: any = null;

  totalVote: string = "";
  array: any = [];

  waiting: boolean = false;

  alertTitleCN: string = "";
  alertTitleEN: string = "";
  alertBodyCN: string = "";
  alertBodyEN: string = "";
  willShowAlertMessage: boolean = false;

  constructor(private contractService: ContractService) { }

  ngOnInit() {
    this.farmHelperManager = new FarmHelperManager(this.contractService.myIOST);
    this.language = parseInt(localStorage.getItem('language'));

    this.load();
  }

  async load() {
    this.totalVote = ((await this.farmHelperManager.getTotalVote()) * 1).toFixed(0);
    this.array = [];
    const all = environment.tokenWhiteList.map(async tuple => {
      const vote = JSON.parse(await this.farmHelperManager.getVote(tuple[0])) || 0;
      this.array.push({
        name: tuple[0],
        vote: vote.toFixed(0),
        default: +parseFloat(tuple[2]),
        more: Math.floor(vote / parseFloat(this.totalVote) * 20) / 2
      });
    });
    await Promise.all(all);

    this.array.sort((a, b) => {
      if (a.default == b.default) {
        return b.vote * 1 - a.vote * 1;
      } else {
        return a.default - b.default;
      }
    });
  }

  async vote(token) {
    this.waiting = true;
    try {
      const res = await this.contractService.vote(token);

      this.showAlert('投票成功', 'Voted successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you voted, please refresh the page in a few seconds')

      this.load();
    } catch(err) {
      if (err.indexOf('gas not enough') >= 0) {
        this.showAlert('Gas不足', 'Gas not enough',
            '请通过抵押获得更多', 'Please pledge IOST to get more');
      } else if (err.indexOf('pay ram failed') >= 0) {
        this.showAlert('Ram不足', 'Ram not enough',
            '请通过购买获得更多', 'Please buy some with IOST');
      } else {
        this.showAlert('投票失败', 'Transaction Failed', '请再次尝试', 'Please try again')
      }
    }

    this.waiting = false;
  }

  close() {
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
