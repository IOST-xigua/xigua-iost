// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  xg: "xg",
  xusd: "xusd",
  swap: "ContractCMKuAnT6f4JtpcSNywg1EvCTZ7NQawWGqKqJD5YNpEn7",
  router: "ContractDPQ3Ef4vJAGqfuHwuJcwsSpWELMm5toDXjypD7nCLBjv",
  bank: "Contract2NrMFPeju44ddmkBkeMLjy56cofBVzd4BVfGGi6S5vdk",
  oracle: "Contract31zSoLKV2hgYHA7z2hvnnzPEtQKmUrkAPKQ5tTmQcepw",
  farm: "Contract4ZQsqLrDLUSFQRZoZRSxcdJhVaX6a6K7KbzotZRF6DoL",
  farmHelper: "Contract7SFfJjR1phn27UdqxJoNBB5Cdx4UxsVuSrqRX2fAQNBP",
  burner: "Contract9kdRJheh9PXe69tbVYYfyZZAGrzeKGbZmi2wCGSbWg78",
  allowedKeycodes: [8, 16, 17, 91, 37, 39, 86, 190, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 110],
  startTime: 1603800000 + 10800,  // 2020/10/27 12pm UTC (Beijing 8pm)
  xgPerDayBonus: 50000,
  bonusEndTime: 1607256000 + 10800,  // 40 days after START_TIME
  xgPerDayRegular: 10000,
  allEndTime: 1624536000 + 10800,  // 200 days after BONUS_END_TIME
  tokenWhiteList: [
    ['idt', 'xlp1603943943842', '0'],
    ['lol', 'xlp1603126828720', '0'],
    ['metx', 'xlp1603713983453', '0'],
    ['otbc', 'xlp1603292350826', '0'],
    ['zs', 'xlp1603126720057', '0'],
    ['bbh', 'xlp1609552484620', '0'],
    ['don', 'xlp1614958673725', '0'],
    ['ppt', 'xlp1603126734507', '0'],
    ['tpt', 'xlp1603126793694', '0'],
    ['iost', 'xlp1603017606495', '0'],
    ['vost', 'xlp1603126749670', '0'],
    ['xg', 'xlp1603126781817', '0'],
    ['xg_3', 'xg_3', '0'],
    ['xg_30', 'xg_30', '0'],
    ['xg_90', 'xg_90', '0'],
    ['xg_180', 'xg_180', '0'],
    ['xplus_30', 'xplus_30', '11.2'],
    ['xplus_60', 'xplus_60', '16.8'],
    ['xplus_90', 'xplus_90', '28'],
    ['iost_30', 'iost_30', '8.4'],
    ['iost_90', 'iost_90', '15.6'],
    ['iost_0', 'iost', '6.75'],
    ['husd_0', 'husd', '2.25'],
    ['xplus_0', 'xplus', '9'],
    ['xusd_0', 'xusd', '4.5'],
    ['iost_xplus', 'xlp1629635381732', '8.75'],
    ['husd_xplus', 'xlp1629538467333', '5.25'],
    ['husd_iost', 'xlp1634630264660', '3.5']
  ]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
