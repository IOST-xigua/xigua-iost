import { Injectable } from '@angular/core';

import { environment } from '../environments/environment'

const XG_LIST = ['xg_3', 'xg_30', 'xg_90', 'xg_180'];

class Callback {

  map: any = {};

  constructor() {
  }

  on(msg, f) {
    this.map[msg] = f;
    return this;
  }

  pushMsg(msg, args) {
    const f = this.map[msg];
    if (f === undefined) {
      return
    }
    f(args)
  }
}


@Injectable({ providedIn: 'root' })
export class ContractService {

  myAddress: string = '';
  myIOST: any = null;

  constructor() {
  }

  async init() {
    if (window['IWalletJS']) {
      this.myIOST = window['IWalletJS'].newIOST(window['IOST']);

      this.myAddress = await window['IWalletJS'].enable();
      this.myIOST.setAccount(this.myAddress);
      this.myIOST.config.gasLimit = 2000000;

      return true;
    } else {
      const IOST = window['IOST'];

      // use RPC
      const rpc = new IOST.RPC(new IOST.HTTPProvider("https://api.iost.io"));
      rpc.blockchain.getChainInfo().then(console.log);

      // init iost sdk
      this.myIOST = new IOST.IOST({ // will use default setting if not set
        gasRatio: 1,
        gasLimit: 2000000,
        delay:0,
      }, new IOST.HTTPProvider('https://api.iost.io'));

      this.myIOST.setAccount('token.iost');

      this.myIOST.rpc = rpc;
      this.myIOST.setRPC(rpc);

      return false;
    }
  }

  getUserAddress(): string {
    return this.myAddress;
  }

  isMe(address: string) : boolean {
    return address == this.myAddress;
  }

  swapExactTokensForTokens(amountIn: number,
                           amountOutMin: number,
                           path: string[]): Promise<number[]> {
    this.myIOST.config.gasLimit = 180000 + 100000 * (path.length - 2);
    const tx = this.myIOST.callABI(environment.router,
                                   'swapExactTokensForTokens',
                                   [amountIn.toString(),
                                    amountOutMin.toString(),
                                    JSON.stringify(path),
                                    this.myAddress]);
    tx.addApprove(path[0], amountIn);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve(JSON.parse(JSON.parse(result.returns[0])[0]));
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  swapTokensForExactTokens(amountOut: number,
                           amountInMax: number,
                           path: string[]): Promise<number[]> {
    this.myIOST.config.gasLimit = 180000 + 100000 * (path.length - 2);
    const tx = this.myIOST.callABI(environment.router,
                                   'swapTokensForExactTokens',
                                   [amountOut.toString(),
                                    amountInMax.toString(),
                                    JSON.stringify(path),
                                    this.myAddress]);
    tx.addApprove(path[0], amountInMax);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve(JSON.parse(JSON.parse(result.returns[0])[0]));
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  _addABit(amount: number) {
    if (amount > 0.1) {
      return amount + 0.12;
    } else if (amount > 0.01) {
      return amount + 0.012;
    } else if (amount > 0.001) {
      return amount + 0.0012;
    } else if (amount > 0.0001) {
      return amount + 0.00012;
    } else {
      return amount + 0.000012;
    }
  }

  createPairAndAddLiquidity(tokenA: string,
                            tokenB: string,
                            amountADesired: number,
                            amountBDesired: number): Promise<number[]> {
    this.myIOST.config.gasLimit = 400000;
    const tx = this.myIOST.callABI(environment.router,
                                   'createPairAndAddLiquidity',
                                   [tokenA,
                                    tokenB,
                                    amountADesired.toString(),
                                    amountBDesired.toString(),
                                    this.myAddress]);
    if (tokenA == "xg") {
      tx.addApprove(tokenA, this._addABit(amountADesired) + 200);
      tx.addApprove(tokenB, this._addABit(amountBDesired));
    } else if (tokenB == "xg") {
      tx.addApprove(tokenA, this._addABit(amountADesired));
      tx.addApprove(tokenB, this._addABit(amountBDesired) + 200);
    } else {
      tx.addApprove(tokenA, this._addABit(amountADesired));
      tx.addApprove(tokenB, this._addABit(amountBDesired));
      tx.addApprove("xg", 200);
    }

    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve(JSON.parse(JSON.parse(result.returns[0])[0]));
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  addLiquidity(tokenA: string,
               tokenB: string,
               amountADesired: number,
               amountBDesired: number,
               amountAMin: number,
               amountBMin: number): Promise<number[]> {
    this.myIOST.config.gasLimit = 400000;
    const tx = this.myIOST.callABI(environment.router,
                                   'addLiquidity',
                                   [tokenA,
                                    tokenB,
                                    amountADesired.toString(),
                                    amountBDesired.toString(),
                                    amountAMin.toString(),
                                    amountBMin.toString(),
                                    this.myAddress]);
    tx.addApprove(tokenA, this._addABit(amountADesired));
    tx.addApprove(tokenB, this._addABit(amountBDesired));
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve(JSON.parse(JSON.parse(result.returns[0])[0]));
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  removeLiquidity(tokenA: string,
                  tokenB: string,
                  xlp: string,
                  liquidity: number,
                  amountAMin: number,
                  amountBMin: number): Promise<number[]> {
    this.myIOST.config.gasLimit = 400000;
    const tx = this.myIOST.callABI(environment.router,
                                   'removeLiquidity',
                                   [tokenA,
                                    tokenB,
                                    liquidity.toString(),
                                    amountAMin.toString(),
                                    amountBMin.toString(),
                                    this.myAddress]);
    tx.addApprove(xlp, liquidity);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve(JSON.parse(JSON.parse(result.returns[0])[0]));
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  lock(iostAmount: number): Promise<any> {
    this.myIOST.config.gasLimit = 200000;
    const tx = this.myIOST.callABI(environment.bank,
                                   'lock',
                                   [iostAmount.toString()]);
    tx.addApprove('iost', iostAmount);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve("");
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  unlockWithVOST(iostAmount: number): Promise<any> {
    this.myIOST.config.gasLimit = 500000;
    const tx = this.myIOST.callABI(environment.bank,
                                   'unlockWithVOST',
                                   [iostAmount.toString()]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  unlockWithDelay(iostAmount: number): Promise<any> {
    this.myIOST.config.gasLimit = 500000;
    const tx = this.myIOST.callABI(environment.bank,
                                   'unlockWithDelay',
                                   [iostAmount.toString()]);
    tx.addApprove('vost', iostAmount);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  unlockImmediately(iostAmount: number): Promise<any> {
    this.myIOST.config.gasLimit = 500000;
    const tx = this.myIOST.callABI(environment.bank,
                                   'unlockImmediately',
                                   [iostAmount.toString()]);
    tx.addApprove('vost', iostAmount);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  borrow(xusdAmount: number): Promise<any> {
    this.myIOST.config.gasLimit = 200000;
    const tx = this.myIOST.callABI(environment.bank,
                                   'borrow',
                                   [xusdAmount.toString()]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  payBack(xusdAmount: number): Promise<any> {
    this.myIOST.config.gasLimit = 200000;
    const tx = this.myIOST.callABI(environment.bank,
                                   'payBack',
                                   [xusdAmount.toString()]);
    tx.addApprove('xusd', xusdAmount);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  deposit(token: string, valueDeposit: number) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farm,
                                   'deposit',
                                   [token, valueDeposit.toString()]);

    if (XG_LIST.indexOf(token) >= 0) {
      tx.addApprove(environment.xg, valueDeposit);
    } else if ((['xplus_30', 'xplus_60', 'xplus_90']).indexOf(token) >= 0) {
      tx.addApprove('xplus', valueDeposit);
    } else if ((['iost_30', 'iost_90']).indexOf(token) >= 0) {
      tx.addApprove('iost', valueDeposit);
    } else {
      tx.addApprove(token, valueDeposit);
    }

    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  withdraw(token: string) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farm,
                                   'withdraw',
                                   [token]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  claim(token: string) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farm,
                                   'claim',
                                   [token]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => { 
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  helperDeposit(token: string, valueDeposit: number) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farmHelper,
                                   'deposit',
                                   [token, valueDeposit.toString()]);

    if (XG_LIST.indexOf(token) >= 0) {
      tx.addApprove(environment.xg, valueDeposit);
    } else if ((['xplus_30', 'xplus_60', 'xplus_90']).indexOf(token) >= 0) {
      tx.addApprove('xplus', valueDeposit);
    } else if ((['iost_30', 'iost_90']).indexOf(token) >= 0) {
      tx.addApprove('iost', valueDeposit);
    } else {
      tx.addApprove(token, valueDeposit);
    }

    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  helperWithdraw(token: string) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farmHelper,
                                   'withdraw',
                                   [token]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  vote(token: string) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farmHelper,
                                   'vote',
                                   [token]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  approveProposal(proposalId: number) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farmHelper,
                                   'approveProposal',
                                   [proposalId.toString()]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  disapproveProposal(proposalId: number) {
    this.myIOST.config.gasLimit = 800000;
    const tx = this.myIOST.callABI(environment.farmHelper,
                                   'disapproveProposal',
                                   [proposalId.toString()]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  checkProposal(proposalId: number) {
    this.myIOST.config.gasLimit = 4000000;
    const tx = this.myIOST.callABI(environment.farmHelper,
                                   'checkProposal',
                                   [proposalId.toString()]);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve('');
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }

  maybeBurn(estimatedCost: number): Promise<number> {
    this.myIOST.config.gasLimit = 4000000;
    const tx = this.myIOST.callABI(environment.burner,
                                   'maybeBurn',
                                   []);
    tx.addApprove('iost', estimatedCost * 1 + 1);
    return new Promise((resolve, reject) => {
      this.myIOST.signAndSend(tx).on('success', result => {
        resolve(JSON.parse(JSON.parse(result.returns[0])[0]));
      }).on('failed', result => {
        if (typeof result == "object" && result.message) {
          result = result.message;
        }
        reject(result);
      });
    });
  }
}
