const winax = require('winax');
const sbrf = new winax.Object('SBRFSRV.Server');



sbrf.SParam('Amount', 1*100);
opResultCode = sbrf.NFun(4000);
console.log(opResultCode);
const e = [
    'AmountClear',
    'Amount',
    'CardName',
    'CardType',
    'TrxDate',
    'TrxTime',
    'TermNum',
    'MerchNum',
    'AuthCode',
    'RRN',
    'MerchantTSN',
    'MerchantBatchNum',
    'ClientCard',
    'ClientExpiryDate',
    'Hash',
    'OwnCard'
].reduce((acc, key) => {
    acc[key] = sbrf.GParamString(key);
    return acc;
}, {});
console.log(e);
sbrf.clear();