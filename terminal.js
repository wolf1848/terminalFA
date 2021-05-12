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

let data = kkm.get({cmd : 64,param : [0,0]},e['Cheque']);
data.push(kkm.get({cmd : 65,param : [0]}));
data.push(kkm.get({cmd : 62,param : [1]}));



let text = 'Команды 0x64 и 0x65 используется для форматированного вывода на печать любой текстовой\n' +
    'информации. Тем самым расширяя возможности печати произвольного текста по сравнению с\n' +
    'предыдущей версией конфигурации ККТ\n' +
    'Длина одной команды ограничена размером пакета (см. логический уровень)\n' +
    'Отдельно взятой командой 0x64 можно передавать как один, так и несколько текстовых\n' +
    'фрагментов, главное, чтобы не превышался максимальный размер пакета.\n' +
    'Можно выполнять несколько команд подряд, последовательно заполняя буфер печати.\n' +
    'Максимальная Длина текста для одной передаваемой строки равна 124 байт\n' +
    'Максимальное количество хранимых строк в буфере равно 255;';
text = cp866buffer.encode(text);


data = data.concat(kkm.get({cmd : 64,param : [0,0]},text));
data.push(kkm.get({cmd : 65,param : [0]}));
data.push(kkm.get({cmd : 62,param : [0]}));

var port = new SerialPort('COM4');

data.forEach(el => {
    port.write(Buffer.from(el,'hex'),function(err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
        }
    );
})




sbrf.NFun(6004);

sbrf.clear();
