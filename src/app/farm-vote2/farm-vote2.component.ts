import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';

import { environment } from '../../environments/environment';
import { FarmHelperManager } from '../farm-helper-manager';

import { ContractService } from '../contract.service';

@Component({
  selector: 'app-farm-vote2',
  templateUrl: './farm-vote2.component.html',
  styleUrls: ['./farm-vote2.component.css']
})
export class FarmVote2Component implements OnInit {

  @ViewChild('alertMessage') alertMessage;

  @Output() onClose: EventEmitter<any> = new EventEmitter();

  language: number = 0;

  farmHelperManager: FarmHelperManager = null;

  proposalIdArray: number[] = [10, 11];
  proposals: any = {};
  actionMap: any = {};
  statMap: any = {};

  totalVote: string = "";

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

    this.loadAll();
    this.loadTotal();
  }

  async loadTotal() {
    this.totalVote = ((await this.farmHelperManager.getTotalVote()) * 1).toFixed(0);
  }

  async loadAll() {
    this.waiting = true;

    const all = this.proposalIdArray.map(async proposalId => {
      await this.loadOne(proposalId);
    });
    await Promise.all(all);
    this.waiting = false;
  }

  async loadOne(proposalId) {
    this.proposals[proposalId] = await this.farmHelperManager.getProposal(proposalId);
    this.actionMap[proposalId] = await this.farmHelperManager.getProposalAction(proposalId);
    this.statMap[proposalId] = await this.farmHelperManager.getProposalStat(proposalId);
  }

  async approve(proposalId) {
    this.waiting = true;
    try {
      const res = await this.contractService.approveProposal(proposalId);

      this.showAlert('投票成功', 'Voted successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you voted, please refresh the page in a few seconds')

      this.loadOne(proposalId);
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

  async disapprove(proposalId) {
    this.waiting = true;
    try {
      const res = await this.contractService.disapproveProposal(proposalId);

      this.showAlert('投票成功', 'Voted successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you voted, please refresh the page in a few seconds')

      this.loadOne(proposalId);
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

  async refresh(proposalId) {
    this.waiting = true;
    try {
      const res = await this.contractService.checkProposal(proposalId);

      this.showAlert('刷新成功', 'Refreshed successfully',
         '如果还没有看到，请几秒后刷新页面',
         'If you don\'t see what you voted, please refresh the page in a few seconds')

      this.loadOne(proposalId);
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
