import { environment } from '../environments/environment';


const PRICE_PRECISION = 6;
const TOTAL_MINUTES = 60 * 24 * 30;

export class BurnerManager {

  _iost: any = null;

  constructor(iost: any) {
    this._iost = iost;
  }

  async getNow() {
    const now = Math.floor((+(await this._iost.rpc.blockchain.getChainInfo()).head_block_time) / 1e9);
    return now;
  }

  async getNextLottery() {
    const obj = await this._iost.rpc.blockchain.getContractStorage(
        environment.burner, "nextLottery");
    return +obj.data || 0;
  }
};
