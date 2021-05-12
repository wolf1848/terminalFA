const winax = require('winax');
const sbrf = new winax.Object('SBRFSRV.Server');
let cp866buffer = require('node-cp866buffer');
let SerialPort = require('serialport');
const Kkm = require('./kkm');


sbrf.SParam('Amount', 1*100);
opResultCode = sbrf.NFun(4000);
sbrf.NFun(6003);


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
    'OwnCard',
    'Cheque'
].reduce((acc, key) => {
    acc[key] = sbrf.GParamString(key);
    return acc;
}, {});


let kkm = new Kkm();

let check = e['Cheque'].split('~S\x01',1)[0];
check = check.split('\r\n');

console.log(check);

let data = [];
check.forEach(el =>{
    if(el.length > 0)
        data = data.concat(kkm.get({cmd : 64,param : [0,1]},cp866buffer.encode(el)));
})


data.push(kkm.get({cmd : 65,param : [0]}));
data.push(kkm.get({cmd : 62,param : [0]}));

console.log(data);




var port = new SerialPort('COM4');

data.forEach((el,i) => {
    port.write(Buffer.from(el,'hex'),function(err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
        }
    );
});




sbrf.NFun(6004);

sbrf.clear();
