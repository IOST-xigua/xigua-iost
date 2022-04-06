import { environment } from '../environments/environment';


const PRICE_PRECISION = 6;
const TOTAL_MINUTES = 60 * 24 * 30;

export class BankManager {

  _iost: any = null;

  constructor(iost: any) {
    this._iost = iost;
  }

  async getInfo() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.bank, "info", this._iost.currentAccount, true);
    return JSON.parse(obj.data) || null;
  }

  async getMinRatio() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.bank, "minRatio");
    return JSON.parse(obj.data) || 1.5;
  }

  async getMaxRatio() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.bank, "maxRatio");
    return JSON.parse(obj.data) || 2.5;
  }

  async getOraclePrice() {
    const now = Math.floor((+(await this._iost.rpc.blockchain.getChainInfo()).head_block_time) / 1e9);
    const tid = Math.floor(now / 60) % (60 * 24 * 10);
    var sum = 0;
    var count = 0;
    const all = [];
    for (let i = 0; i < 10; ++i) {
      all.push((async (i) => {
        const obj = await this._iost.rpc.blockchain.getContractStorage(
            environment.oracle,
            "huobi_price",
            ((tid + TOTAL_MINUTES - i) % TOTAL_MINUTES).toString(),
            true);
        const price = +obj.data || 0;
        if (price) {
          sum += price;
          ++count;
        }
      })(i));
    }

    await Promise.all(all);

    if (count) {
      return +(sum / count).toFixed(PRICE_PRECISION);
    } else {
      return 0;
    }
  }

  async getFullInfo(iostPrice: number) {
    var info;
    var minRatio;
    var maxRatio;

    const all = [(async () => {
      info = await this.getInfo() || {locked: "0", borrowed: "0"};
    })(), (async () => {
      minRatio = await this.getMinRatio();
    })(), (async () => {
      maxRatio = await this.getMaxRatio();
    })()];

    await Promise.all(all);

    return {
      locked: +info.locked,
      borrowed: +info.borrowed,
      price: iostPrice,
      liquidationPrice: +info.locked ? +(info.borrowed / info.locked * minRatio).toFixed(PRICE_PRECISION) : 0,
      canUnlock: +info.borrowed ? Math.max(0, +((info.locked - info.borrowed * maxRatio / iostPrice) * 0.99 - 0.005).toFixed(2)) : +info.locked.toString(),
      canBorrow: Math.max(0, +((info.locked * iostPrice / maxRatio - info.borrowed) * 0.99 - 0.005).toFixed(2))
    }
  }
};
