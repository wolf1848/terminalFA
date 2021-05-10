let cp866buffer = require('node-cp866buffer');
var SerialPort = require('serialport');

let text = '';
let textBuffer = cp866buffer.encode(text);
let bufferLength = textBuffer.length;
let start = 'B629';
let cmd = '643F9C';
let cmdl = 3;

let len64 = (+ bufferLength + 2).toString(16).padStart(2,"0") + '00';

let len = '00'+ (+ bufferLength + cmdl + 4).toString(16).padStart(2,"0");

let crcBuffer = Buffer.from((len + cmd + len64 + '0000' + textBuffer.toString('hex')),'hex');

let arr = new Uint16Array(256);


let temp,a;

for (let i = 0; i < arr.length; ++i){
    temp = 0;
    a = i << 8;
    for (let j = 0; j < 8; ++j)
    {
        if (((temp ^ a) & 0x8000) != 0)
        {
            temp = (temp << 1) ^ 0x1021;
        }
        else
        {
            temp <<= 1;
        }
        a <<= 1;
    }

    arr[i] = temp;
}
let crc = 0xffff;

function XOR(a,b){
    a = a.toString(2).toString(2).slice(-16).padStart(16,"0").split('');
    b = b.toString(2).toString(2).slice(-16).padStart(16,"0").split('');

    let res = a.map((el,i) => {
        return el ^ b[i];
    })
    return parseInt(res.join(''),2);
}


for (let i = 0; i < crcBuffer.length; ++i)
{
    let start = (+arr[((crc >> 8) ^ (0xff & crcBuffer[i]))]);
    let finish = (+(crc << 8));

    crc = XOR(start,finish)
}

crcStr = crc.toString(16)
crcStr = crcStr[2]+crcStr[3]+crcStr[0]+crcStr[1];

let command = start + len + cmd + len64 + '0000' + textBuffer.toString('hex') + crcStr;


var port = new SerialPort('COM4');

port.write(Buffer.from(command,'hex'),function(err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    }
);
port.write(Buffer.from('B629000265007F1E','hex'),function(err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    }
);
port.write(Buffer.from('B62900026200E887','hex'),function(err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
    }
);
