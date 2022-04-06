import { environment } from '../environments/environment';

import { BigNumber } from "bignumber.js";

const UNIVERSAL_PRECISION = 12;
const ROUND_DOWN = 1;

export class SwapManager {

  _iost: any = null;

  constructor(iost: any) {
    this._iost = iost;
  }

  async allPairs() {
    let index = 0;
    let res = [];
    while (1) {
      const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.swap, "allPairs", index.toString(), true);
      const array = JSON.parse(obj.data) || [];

      if (array.length > 0) {
        res = res.concat(array);
      } else {
        break;
      }

      ++index;
    }

    res = res.map(pairStr => {
      return pairStr.split("/");
    });

    return res;
  }

  async getTokenBalance(token) {
    try {
      const obj = await this._iost.rpc.blockchain.getBalance(
          this._iost.currentAccount, token, true);
      return obj.balance;
    } catch(e) {
      return 0;
    }
  }

  async myPairs(allPairs: string[][], account: string) {
    var all = [];
    const res = [];
    for (let i = 0; i < allPairs.length; ++i) {
      all.push((async (i) => {
        const pair = await this.getPair(allPairs[i][0], allPairs[i][1]);
        const balance = await this.getTokenBalance(pair.xlp);
        if (balance > 0) {
          res.push(allPairs[i]);
        }
      }) (i));

      // 10 in a goup.
      if (all.length >= 10) {
        await Promise.all(all);
        all = [];
      }
    }

    if (all.length > 0) {
      await Promise.all(all);
    }

    return res;
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

  async getIOSTXUSDRatio() {
    const pair = await this.getPair('iost', 'xusd');
    return +(pair.reserve0 / pair.reserve1).toFixed(6);
  }

  async getIdealValue(tokenA: string, tokenB: string, amountIn: number) {
    const pair = await this.getPair(tokenA, tokenB);
    if (!pair) {
      return 0;
    }

    if (tokenA == pair.token0) {
      return 0
    }
  }

  // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
  getAmountOut(_amountIn: string, reserveIn: number, reserveOut: number, precision: number) {
    var amountIn = new BigNumber(_amountIn);

    if (amountIn.lte(0)) {
      throw 'Xigua: INSUFFICIENT_INPUT_AMOUNT';
    }

    if (reserveIn <= 0 || reserveOut <= 0) {
      throw 'Xigua: INSUFFICIENT_LIQUIDITY';
    }

    if (precision < 0) {
      throw 'Xigua: INVALID_PRECISION';
    }

    const amountInWithFee = amountIn.times(997);
    const numerator = amountInWithFee.times(reserveOut);
    const denominator = amountInWithFee.plus(reserveIn * 1000);
    return numerator.div(denominator).toFixed(precision, ROUND_DOWN);
  }

  // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
  getAmountIn(_amountOut: string, reserveIn: number, reserveOut: number, precision: number) {
    var amountOut = new BigNumber(_amountOut);

    if (amountOut.lte(0)) {
      throw 'Xigua: INSUFFICIENT_OUTPUT_AMOUNT';
    }

    if (reserveIn <= 0 || amountOut.gt(reserveOut)) {
      throw 'Xigua: INSUFFICIENT_LIQUIDITY';
    }

    if (precision < 0) {
      throw 'Xigua: INVALID_PRECISION';
    }

    const numerator = amountOut.times(reserveIn).times(1000);
    const denominator = new BigNumber(reserveOut).minus(amountOut).times(997);
    return numerator.div(denominator).plus(1 / 10 ** precision).toFixed(precision, ROUND_DOWN);
  }

  // performs chained getAmountOut calculations on any number of pairs
  async getAmountsOut(amountIn: string, path: string[]) {
    if (path.length < 2) {
      throw 'Xigua: INVALID_PATH';
    }

    const amounts = [amountIn];
    var ratio = 1;
    var finalPrecision = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const pair = await this.getPair(path[i], path[i + 1]);

      if (!pair) {
        throw 'Xigua: no pair';
      }

      if (pair.token0 == path[i]) {
        amounts.push(this.getAmountOut(amounts[i], +pair.reserve0, +pair.reserve1, pair.precision1));
        ratio *= (+pair.reserve1) / (+pair.reserve0);
        finalPrecision = pair.precision1;
      } else {
        amounts.push(this.getAmountOut(amounts[i], +pair.reserve1, +pair.reserve0, pair.precision0));
        ratio *= (+pair.reserve0) / (+pair.reserve1);
        finalPrecision = pair.precision0;
      }
    }

    return {
      amounts: amounts,
      ratio: ratio,
      precision: finalPrecision
    };
  }

  // performs chained getAmountIn calculations on any number of pairs
  async getAmountsIn(amountOut: string, path: string[]) {
    if (path.length < 2) {
      throw 'Xigua: INVALID_PATH';
    }

    const amounts = [amountOut];
    var ratio = 1;
    var finalPrecision = 0;

    for (let i = path.length - 1; i > 0; i--) {
      const pair = await this.getPair(path[i - 1], path[i]);

      if (!pair) {
        throw "Xigua: no pair";
      }

      if (pair.token0 == path[i - 1]) {
        amounts.push(this.getAmountIn(amounts[path.length - 1 - i], +pair.reserve0, +pair.reserve1, pair.precision0));
        ratio *= (+pair.reserve0) / (+pair.reserve1);
        finalPrecision = pair.precision0;
      } else {
        amounts.push(this.getAmountIn(amounts[path.length - 1 - i], +pair.reserve1, +pair.reserve0, pair.precision1));
        ratio *= (+pair.reserve1) / (+pair.reserve0);
        finalPrecision = pair.precision1;
      }
    }

    amounts.reverse();

    return {
      amounts: amounts, 
      ratio: ratio,
      precision: finalPrecision
    };
  }

  hasPath(allPairs: Array<string[]>, path: string[]) {
    for (let i = 0; i < path.length - 1; ++i) {
      const token0 = path[i] < path[i + 1] ? path[i] : path[i + 1];
      const token1 = path[i] < path[i + 1] ? path[i + 1] : path[i];

      let found = 0;
      for (let j = 0; j < allPairs.length; ++j) {
        if (allPairs[j][0] == token0 && allPairs[j][1] == token1) {
          found = 1;
          break;
        }
      }

      if (!found) return false;
    }

    return true;
  }

  _findAllPaths(allPairs: Array<string[]>, tokenA: string, tokenB: string, prefix: string[], depth: number) {
    if (prefix.indexOf(tokenA) >= 0 || prefix.indexOf(tokenB) >= 0) {
      return [];
    }

    if (depth <= 0) {
      const res = allPairs.filter(pair => pair[0] == tokenA && pair[1] == tokenB || pair[0] == tokenB && pair[1] == tokenA);
      return res.length > 0 ? [prefix.concat([tokenA, tokenB])] : [];
    }

    const pathArray = [];
    prefix.push(tokenA);

    for (let i = 0; i < allPairs.length; ++i) {
      if (tokenA == allPairs[i][0]) {
        if (tokenB == allPairs[i][1]) {
          pathArray.push(prefix.concat([tokenB]));
        } else {
          const tempArray = this._findAllPaths(allPairs, allPairs[i][1], tokenB, prefix, depth - 1);
          for (let j = 0; j < tempArray.length; ++j) {
            pathArray.push(tempArray[j]);
          }
        }
      } else if (tokenA == allPairs[i][1]) {
        if (tokenB == allPairs[i][0]) {
          pathArray.push(prefix.concat([tokenB]));
        } else {
          const tempArray = this._findAllPaths(allPairs, allPairs[i][0], tokenB, prefix, depth - 1);
          for (let j = 0; j < tempArray.length; ++j) {
            pathArray.push(tempArray[j]);
          }
        }
      }
    }

    prefix.pop();
  
    return pathArray;
  }

  _findSelectedPaths(allPairs: Array<string[]>, tokenA: string, tokenB: string) {
    var array = [];

    if (this.hasPath(allPairs, [tokenA, tokenB])) {
      array.push([tokenA, tokenB]);
    }

    if (this.hasPath(allPairs, [tokenA, 'iost', tokenB])) {
      array.push([tokenA, 'iost', tokenB]);
    }

    if (this.hasPath(allPairs, [tokenA, 'xusd', tokenB])) {
      array.push([tokenA, 'xusd', tokenB]);
    }

    if (array.length) {
      return array;
    } else {
      array = this._findAllPaths(allPairs, tokenA, tokenB, [], 2);
      array.sort((a, b) => a.length - b.length);
      return array.slice(0, 3);
    }
  }

  async getAmountOutSmartly(amountIn: string, slippage: number, allPairs: Array<string[]>, tokenA: string, tokenB: string) {
    const pathArray = this._findSelectedPaths(allPairs, tokenA, tokenB);
    if (pathArray.length == 0) {
      return null;
    }

    let index = -1;
    let maxOutput = 0;
    let ratio = 0;
    let precision = 0;

    const all = [];

    for (let i = 0; i < pathArray.length; ++i) {
      all.push((async (i) => {
        let obj;
        try {
          obj = await this.getAmountsOut(amountIn, pathArray[i]);
        } catch(e) {
          return;
        }

        if (index < 0 || obj.amounts[obj.amounts.length - 1] * 1 > maxOutput * 1) {
          index = i;
          maxOutput = obj.amounts[obj.amounts.length - 1];
          ratio = obj.ratio;
          precision = obj.precision;
        }
      }) (i));
    }

    await Promise.all(all);

    if (index < 0) {
      return null;
    }

    const priceImpact = Math.max(0, +((1 - maxOutput / parseFloat(amountIn) / ratio) * 100).toFixed(2));

    return [maxOutput, new BigNumber(maxOutput * (1 - slippage / 1000)).toFixed(precision, ROUND_DOWN), priceImpact, pathArray[index]];
  }

  async getAmountInSmartly(amountOut: string, slippage: number, allPairs: Array<string[]>, tokenA: string, tokenB: string) {
    const pathArray = this._findSelectedPaths(allPairs, tokenA, tokenB);
    if (pathArray.length == 0) {
      return null;
    }

    let index = -1;
    let minInput = 0;
    let ratio = 0;
    let precision = 0;

    const all = [];

    for (let i = 0; i < pathArray.length; ++i) {
      all.push((async (i) => {
        let obj;
        try {
          obj = await this.getAmountsIn(amountOut, pathArray[i]);
        } catch(e) {
          return;
        }

        if (index < 0 || obj.amounts[0] * 1 < minInput * 1) {
          index = i;
          minInput = obj.amounts[0];
          ratio = obj.ratio;
          precision = obj.precision;
        }
      }) (i));
    }

    await Promise.all(all);

    if (index < 0) {
      return null;
    }

    const priceImpact = Math.max(0, +((1 - ratio / minInput * parseFloat(amountOut)) * 100).toFixed(2));

    return [minInput, new BigNumber(minInput * (1 + slippage / 1000)).toFixed(precision, ROUND_DOWN), priceImpact, pathArray[index]];
  }
};
