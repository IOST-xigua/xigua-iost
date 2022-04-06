import { environment } from '../environments/environment';

import { BigNumber } from "bignumber.js";

const UNIVERSAL_PRECISION = 12;

export class FarmHelperManager {

  _iost: any = null;

  constructor(iost: any) {
    this._iost = iost;
  }

  async getTotalVote() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farmHelper, "totalVote", true);
    return obj.data || "0";
  }

  async getVote(token) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farmHelper, "vote", token, true);
    return obj.data || "0";
  }

  async getUserToken() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farmHelper, "userTokenXG", this._iost.currentAccount, true);
    return obj.data || "";
  }

  async getProposal(proposalId) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farmHelper, "proposal", proposalId.toString(), true);
    return JSON.parse(obj.data) || [];
  }

  async getProposalAction(proposalId) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farmHelper, "proposalAction", proposalId.toString() + ":" + this._iost.currentAccount, true);
    return +obj.data || "0";
  }

  async getProposalStat(proposalId) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farmHelper, "proposalStat", proposalId.toString(), true);
    return JSON.parse(obj.data) || {};
  }
};
