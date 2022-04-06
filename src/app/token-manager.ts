import { environment } from '../environments/environment';


export class TokenManager {

  _iost: any = null;

  constructor(iost: any) {
    this._iost = iost;
  }

  async getTokenBalance(token: string, who?: string) {
    try {
      const obj = await this._iost.rpc.blockchain.getBalance(
          who ? who : this._iost.currentAccount, token, true);
      return obj.balance;
    } catch(e) {
      return 0;
    }
  }

  async getSupply(token: string) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        "token.iost", "TI" + token, "supply", true);
    return JSON.parse(obj.data) || 0;
  }

  async getTokenInfo(token) {
    try {
      const url = "https://www.iostabc.com/api/token/" + token;
      const response = await fetch(url);
      return await response.json();
    } catch(e) {
      return null;
    }
  }

  async getDefaultList() {
    const now10Minutes = Math.floor(new Date().getTime() / 1000 / 600);
    try {
      const url = "/assets/json/default_list.json?r=" + now10Minutes;
      const response = await fetch(url);
      return await response.json();
    } catch(e) {
      return null;
    }
  }

  async getImageList(tokenName) {
    const now10Minutes = Math.floor(new Date().getTime() / 1000 / 600);
    try {
      const url = "/assets/json/image_list.json?r=" + now10Minutes;
      const response = await fetch(url);
      return await response.json();
    } catch(e) {
      return null;
    }
  }

  getMergedList(allPairs: string[][]) {
    var list = [];
    for (let i = 0; i < allPairs.length; ++i) {
      if (list.indexOf(allPairs[i][0]) < 0) {
        list.push(allPairs[i][0]);
      }

      if (list.indexOf(allPairs[i][1]) < 0) {
        list.push(allPairs[i][1]);
      }
    }

    return list;
  }
};
