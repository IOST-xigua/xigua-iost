import { environment } from '../environments/environment';

import { BigNumber } from "bignumber.js";

const XG_PRECISION = 6;
const ROUND_DOWN = 1;
const UNIVERSAL_PRECISION = 12;

const XG_LIST = ['xg_3', 'xg_30', 'xg_90', 'xg_180'];

export class FarmManager {

  _iost: any = null;

  constructor(iost: any) {
    this._iost = iost;
  }

  async getNow() {
    const now = Math.floor((+(await this._iost.rpc.blockchain.getChainInfo()).head_block_time) / 1e9);
    return now;
  }

  async getTokenArray() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farm, "tokenArray", true);
    return JSON.parse(obj.data) || [];
  }

  async getTotalAlloc() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farm, "totalAlloc", true);
    return +obj.data || 0;
  }

  async getPool(token) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farm, "pool", token, true);
    return JSON.parse(obj.data) || null;
  }

  async getFullName(token) {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        "token.iost","TI" + token,"fullName", true);
    return obj.data;
  }

  _getPairName(token0: string, token1: string) {
    let pairName;
    if (token0 < token1) {
      pairName = token0 + "/" + token1;
    } else {
      pairName = token1 + "/" + token0;
    }
    return pairName;
  }

  async getPair(tokenA: string, tokenB: string) {
    const pairName = this._getPairName(tokenA, tokenB);
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.swap, "pair", pairName, true);
    return JSON.parse(obj.data) || null;
  }

  async getUserInfo() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farm, "userInfo", this._iost.currentAccount, true);
    return JSON.parse(obj.data) || {};
  }

  async getUserInfoOfToken(token: string) {
    const info = await this.getUserInfo();
    return info[token] || null;
  }

  _getMultiplier(fromTime, toTime) {
    fromTime = Math.max(fromTime, environment.startTime);
    toTime = Math.min(toTime, environment.allEndTime);

    if (toTime <= environment.startTime || fromTime >= environment.allEndTime) {
      return 0;
    }

    if (toTime <= environment.bonusEndTime) {
      return new BigNumber(environment.xgPerDayBonus).times(toTime - fromTime).div(3600 * 24);
    }

    if (fromTime >= environment.bonusEndTime) {
      return new BigNumber(environment.xgPerDayRegular).times(toTime - fromTime).div(3600 * 24);
    }

    return new BigNumber(environment.xgPerDayBonus).times(environment.bonusEndTime - fromTime).plus(
        new BigNumber(environment.xgPerDayRegular).times(toTime - environment.bonusEndTime)).div(3600 * 24);
  }

  getRewardPending(now: number, totalAlloc: number, pool: any, userInfoToken: any) {
    if (!userInfoToken) {
      return 0;
    }

    var accPerShare = new BigNumber(pool.accPerShare);
    const total = new BigNumber(pool.total);

    if (now > pool.lastRewardTime && total.gt(0)) {
      const multiplier = this._getMultiplier(pool.lastRewardTime, now);
      const reward = new BigNumber(multiplier).times(pool.alloc).div(totalAlloc);
      accPerShare = accPerShare.plus(reward.div(total));
    }

    const result = accPerShare.times(userInfoToken.amount).plus(
        userInfoToken.rewardPending).minus(
            userInfoToken.rewardDebt);

    return result.gt(0) ? result.toFixed(XG_PRECISION, ROUND_DOWN) : "0";
  }

  getExtraPending(now: number, totalAlloc: number, pool: any, userInfoToken: any) {
    if (!userInfoToken) {
      return 0;
    }

    var accPerShareExtra = new BigNumber(pool.accPerShareExtra);
    const total = new BigNumber(pool.total);

    const result = accPerShareExtra.times(userInfoToken.amount).plus(
        userInfoToken.extraPending).minus(
            userInfoToken.extraDebt);

    return result.gt(0) ? result.toFixed(pool.extraPrecision, ROUND_DOWN) : "0";
  }

  async getXUSDPairPrice(token) {
    if (token == 'xusd') return 1;

    if (XG_LIST.indexOf(token) >= 0) {
      token = environment.xg;
    } else if ((['xplus_0', 'xplus_30', 'xplus_60', 'xplus_90']).indexOf(token) >= 0) {
      token = 'xplus';
    } else if ((['iost_0', 'iost_30', 'iost_90']).indexOf(token) >= 0) {
      token = 'iost';
    } else if ((['husd_0']).indexOf(token) >= 0) {
      token = 'husd';
    } else if ((['xusd_0']).indexOf(token) >= 0) {
      token = 'xusd';
    }

    if (token == 'xplus') {
      const pair = await this.getPair('husd', 'xplus');
      return +(pair.reserve0 / pair.xlpSupply * 2).toFixed(6);
    } else {
      const pair = await this.getPair(token, 'xusd');

      if (pair.token0 == "xusd") {
        return +(pair.reserve0 / pair.xlpSupply * 2).toFixed(6);
      } else {
        return +(pair.reserve1 / pair.xlpSupply * 2).toFixed(6);
      }
    }
  }

  async getXUSDPrice(token) {
    if (token == 'xusd') return 1;

    if (XG_LIST.indexOf(token) >= 0) {
      token = environment.xg;
    } else if ((['xplus', 'xplus_30', 'xplus_60', 'xplus_90']).indexOf(token) >= 0) {
      return 0.0286;  // HACK for xplus price.
    } else if ((['iost_30', 'iost_90']).indexOf(token) >= 0) {
      token = 'iost';
    }

    const pair = await this.getPair(token, 'xusd');
    if (pair.token0 == "xusd") {
      return +(pair.reserve0 / pair.reserve1).toFixed(6);
    } else {
      return +(pair.reserve1 / pair.reserve0).toFixed(6);
    }
  }

  extractTokenName(fullName) {
    const array = fullName.split("-");
    if (array.length == 2) {
      return array[0] == 'xusd' ? array[1] : array[0];
    } else {
      return fullName;
    }
  }

  async getCanUnlock(token, amount, today, days) {
    const mapObj = await this._iost.rpc.blockchain.getContractStorage(
        environment.farm, "lockMap", this._iost.currentAccount, true);
    const map = JSON.parse(mapObj.data) || {};
    if (!map[token]) {
      map[token] = [];
    }

    var remain = new BigNumber(amount);

    while (map[token].length > 0 && remain.gt(0)) {
      const head = map[token][0];

      if (today < head[0] + days) {
        break;
      }

      if (remain.gte(head[1])) {
        remain = remain.minus(head[1]);
        map[token].shift();
      } else {
        head[1] = new BigNumber(head[1]).minus(remain).toFixed(6, ROUND_DOWN);
        remain = new BigNumber(0);
        break;
      }
    }

    // The actually withdraw amount.
    return new BigNumber(amount).minus(remain).toFixed(6, ROUND_DOWN);
  }

  async getInfoArray() {
    const now = Math.floor(new Date().getTime() / 1000);
    const tokenArray = await this.getTokenArray();

    var infoArray = [];

    let tasks = tokenArray.map(async token => {
      const pool = await this.getPool(token);

      let fullName;

      if (XG_LIST.indexOf(token) >= 0) {
        fullName = environment.xg;
      } else if ((['xplus_30', 'xplus_60', 'xplus_90']).indexOf(token) >= 0) {
        fullName = 'xplus';
      } else if ((['iost_30', 'iost_90']).indexOf(token) >= 0) {
        fullName = 'iost';
      } else {
        fullName = await this.getFullName(token);
        if (fullName.indexOf("Xigua LP Token: ") == 0) {
          fullName = fullName.slice(16).split(' / ').sort((a, b)=>a=='xusd'?1:-1).join('-');
        } else {
          fullName = token;
        }
      }

      let lockDays = "";
      if (XG_LIST.indexOf(token) >= 0 || (['xplus_30', 'xplus_60', 'xplus_90']).indexOf(token) >= 0 || (['iost_30', 'iost_90']).indexOf(token) >= 0) {
        lockDays = token.split('_')[1];
      }

      infoArray.push({
        token: token,
        tokenPrecision: pool.tokenPrecision,
        extra: pool.extra,
        extraPrecision: pool.extraPrecision,
        fullName: fullName,
        alloc: pool.alloc,
        total: pool.total,
        totalInXUSD: 0,
        apy: 0,
        lockDays: lockDays
      });
    });

    await Promise.all(tasks);

/*    infoArray = infoArray.filter(info => XG_LIST.indexOf(info.token) >= 0).concat(
        infoArray.filter(info => info.fullName == 'xg-xusd')).concat(
            infoArray.filter(info => info.fullName == 'xusd')).concat(
                infoArray.filter(info => XG_LIST.indexOf(info.token) < 0 &&
                    info.fullName != 'xusd' &&
                        info.fullName != 'xg-xusd').sort((a, b) => a.alloc - b.alloc));*/

    const doMore = async () => {
      //const xgPrice = await this.getXUSDPrice(environment.xg) || 0;
const xplusPrice = await this.getXUSDPrice('xplus') || 0;
      const totalAlloc = await this.getTotalAlloc();

      infoArray.forEach(async (info) => {
        const halfTokenName = this.extractTokenName(info.fullName);

        let tokenPrice;
        if (info.fullName.indexOf("-") < 0) {
          tokenPrice = await this.getXUSDPrice(halfTokenName);
        } else {
          tokenPrice = await this.getXUSDPairPrice(halfTokenName);
        }

        let apy;
/*
        if (!(+info.total)) {
          apy = 0;
        } else if (now >= environment.startTime && now < environment.bonusEndTime) {
          apy = xgPrice * environment.xgPerDayBonus * 365 * info.alloc / totalAlloc / (tokenPrice * info.total);
        } else if (now >= environment.bonusEndTime && now < environment.allEndTime) {
          apy = xgPrice * environment.xgPerDayRegular * 365 * info.alloc / totalAlloc / (tokenPrice * info.total);
        } else {
          apy = 0;
        }*/
apy = xplusPrice * 8888 * 365 * info.alloc / 80 / (tokenPrice * info.total);

        info.totalInXUSD = +(tokenPrice * info.total).toFixed(2);
        info.apy = apy;
      });
    }

    doMore();

    return infoArray;
  }
};
