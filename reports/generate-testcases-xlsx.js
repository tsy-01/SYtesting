const XLSX = require('xlsx');
const path = require('path');

// Test cases identified as missing coverage vs GitHub issue #9642,
// written in the same terse "Case N: Title" / BO-Playsite style as the existing Testpad script #9642.
const rows = [
  ['Case', 'Section', 'Step'],

  ["Case 16: Verify Min Deposit Message Uses Player's Own Currency Setting (Not Another Currency's)", '', ''],
  ['', 'BO', 'Note current Min Deposit for THB and MYR (must be different values)'],
  ['', 'Playsite', "Verify eligibility message shows player's own currency's Min Deposit (not another currency's)"],
  ['', 'BO', 'Angpow Rain > Edit Setting > Update MYR Min Deposit only (leave THB unchanged)'],
  ['', 'Playsite', "Refresh THB player > Verify message still shows THB's own unchanged Min Deposit value, not MYR's new value"],
  ['', 'BO', 'Repeat check with a second non-MYR currency (e.g. SGD or AFA) to characterize blast radius'],

  ['Case 17: Verify Message Template Localization (en-us / zh-cn / th-th)', '', ''],
  ['', 'Playsite', 'Switch playsite language to en-us > Verify Angpow Rain messages display in English'],
  ['', 'Playsite', 'Switch playsite language to zh-cn > Verify Angpow Rain messages display in Chinese'],
  ['', 'Playsite', 'Switch playsite language to th-th > Verify Angpow Rain messages display in Thai'],

  ['Case 18: Verify Game Resources Setting Permission (Themes/Audio Sets) is BO Agent Only', '', ''],
  ['', 'BO', 'Login as BO Agent operator > Verify able to access Angpow Rain > Game Resources Setting (Themes/Audio Sets)'],
  ['', 'BO', 'Login as COM/Company operator > Verify access_angpow_game_resources_setting is denied (Themes/Audio Sets not accessible)'],

  ['Case 19 (optional): Verify Mobile Version Display Under CashLine', '', ''],
  ['', 'Playsite', 'Login as CashLine player on mobile viewport > Verify Angpow Rain banner/modal renders correctly (currently only covered under CreditLine)'],
];

const ws = XLSX.utils.aoa_to_sheet(rows);
ws['!cols'] = [{ wch: 78 }, { wch: 10 }, { wch: 90 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Missing Test Cases');

const outPath = path.join(__dirname, 'angpow-rain-missing-test-cases.xlsx');
XLSX.writeFile(wb, outPath);
console.log('written:', outPath);
