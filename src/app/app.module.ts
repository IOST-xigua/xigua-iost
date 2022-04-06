import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; 
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { RightSideComponent } from './right-side/right-side.component';
import { BottomBarComponent } from './bottom-bar/bottom-bar.component';
import { AlertMessageComponent } from './alert-message/alert-message.component';
import { LoadingBoxComponent } from './loading-box/loading-box.component';
import { AssetManagementComponent } from './asset-management/asset-management.component';
import { WechatBoxComponent } from './wechat-box/wechat-box.component';
import { SwapComponent } from './swap/swap.component';
import { PoolComponent } from './pool/pool.component';
import { BankComponent } from './bank/bank.component';
import { VaultComponent } from './vault/vault.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { TokenSelectionComponent } from './token-selection/token-selection.component';
import { SlippageComponent } from './slippage/slippage.component';
import { CreatePairComponent } from './create-pair/create-pair.component';
import { AddLiquidityComponent } from './add-liquidity/add-liquidity.component';
import { RemoveLiquidityComponent } from './remove-liquidity/remove-liquidity.component';
import { LoginBoxComponent } from './login-box/login-box.component';
import { VaultManageComponent } from './vault-manage/vault-manage.component';
import { FarmVoteComponent } from './farm-vote/farm-vote.component';
import { AnalyticsOverallComponent } from './analytics-overall/analytics-overall.component';
import { FarmVote2Component } from './farm-vote2/farm-vote2.component';
import { XplusComponent } from './xplus/xplus.component';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    RightSideComponent,
    BottomBarComponent,
    AlertMessageComponent,
    LoadingBoxComponent,
    AssetManagementComponent,
    WechatBoxComponent,
    SwapComponent,
    PoolComponent,
    BankComponent,
    VaultComponent,
    AnalyticsComponent,
    TokenSelectionComponent,
    SlippageComponent,
    CreatePairComponent,
    AddLiquidityComponent,
    RemoveLiquidityComponent,
    LoginBoxComponent,
    VaultManageComponent,
    FarmVoteComponent,
    AnalyticsOverallComponent,
    FarmVote2Component,
    XplusComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
