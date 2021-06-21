const winax = require('winax');
const sbrf = new winax.Object('SBRFSRV.Server');
let cp866buffer = require('node-cp866buffer');
let SerialPort = require('serialport');
const Kkm = require('./kkm');
const EventEmitter = require('events');
const Readline = require('@serialport/parser-readline')
const fs = require("fs");
const debug = true;

function log(message,err = ''){
    if(debug){
        let date = new Date();
        let logFile = './' + date.getDate() + '-' + ((date.getMonth() + 1) + '').padStart(2,"0") + '-' + date.getFullYear() + '.log';
        fs.appendFile(logFile,(date + ' - ' + message + '\r\n\t' + err  +  '\r\n'), function (err) {});
    }
}




function pay (payObj){

    const kkm = new Kkm();
    const port = new SerialPort('COM4',{ autoOpen : false });
    const event = new EventEmitter();

    //Подписываемся на все что приходит на порт
    port.on('data', function (data) {
        event.emit('responsePort',data);
        log('Ответ порта - '+ JSON.stringify(data));
    });

    let queue = [];
    let summ = 0;
    payObj.forEach(el =>{
        el.name = cp866buffer.encode(el.name.split('',128).join(''))
        queue.push({el : el,function : function(queue){
                return new Promise((res,rej) => {
                    log('Передать данные предмета расчета.');

                    port.write(Buffer.from(kkm.get({cmd : '2B',param : []},queue[0].el),'hex'),function(err) {
                        if (err) {
                            throw new Error('Запись не удалась (Передать данные предмета расчета.) \r\n\t' + err.message);
                        }else
                            log('Запись команды успешна');
                    });
                    event.once('responsePort',function(buffer){
                        if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                            queue.splice(0,1)
                            res();
                        }else{
                            rej(new Error('Передать данные предмета расчета не исполнено \r\n\t' + buffer));
                        }
                    })
                }).then(res => {
                    if(queue.length > 0)
                        queue[0].function(queue);
                    else{
                        event.emit('writeProduct',true);
                    }
                })
                    .catch(err => {
                        event.emit('writeProductFalse',true);
                        log(err);
                        if(port.isOpen)
                            port.close();
                    })
            }});
        summ += +el.price;
    })


    return new Promise((res,rej) => {
        port.open((err) => {
            try{
                if(!err){
                    res();
                }else{
                    throw new Error('Порт недоступен ' + err.message)
                }
            }catch(err){
                rej(err)
            }
        })
    })
        .then(result => {
            return new Promise((res,rej) => {
                log('Запрос статуса смены');
                port.write(Buffer.from(kkm.get({cmd : 20,param : []}),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Проверка смены) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                        res(buffer);
                    }else{
                        rej(new Error('Проверка смены не исполнена \r\n\t' + buffer));
                    }
                })
            });
        }).then(result => {
            if(result[5].toString(16) == 0){
                log('Смена закрыта');
                return true;
            }else{
                log('Смена открыта');
                return false
            }
        }).then(result => {
            return new Promise((res,rej) => {
                if(result){
                    res({open : true,close : false});
                }else{
                    fs.readFile('./shift.json', function(err, shiftJson) {
                        if(err){
                            log('Нет файла смены');
                            res({open : true,close : true});
                        }else{
                            let sJ = JSON.parse(shiftJson)
                            if((Date.now() - sJ.date >= 82800000)){//82800000
                                log('Смена привысила 23 часа');
                                res({open : true,close : true});
                            }else{
                                event.emit('checkShift',false);
                            }
                        }
                    });
                    event.once('checkShift',function(check){
                        log('Проверка смены успешна, действий не требуется');
                        res({open : false,close : check});
                    })
                }
            })
        }).then(result => {
            return new Promise((res,rej) => {
                if(result.close){
                    log('Начало закрытия смены.');
                    port.write(Buffer.from(kkm.get({cmd : 29,param : [1]}),'hex'),function(err) {
                        if (err) {
                            throw new Error('Запись не удалась (Начать закрытие смены) \r\n\t' + err.message);
                        }else
                            log('Запись команды успешна');
                    });
                    event.once('responsePort',function(buffer){
                        if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                            res({open : result.open,close : result.close});
                        }else{
                            rej(new Error('Начало закрытия смены не исполнено \r\n\t' + buffer));
                        }
                    })
                }else{
                    log('Начало закрытия смены не запускалось.');
                    res({open : result.open,close : result.close});
                }
            });
        }).then(result => {
            return new Promise((res,rej) => {
                if(result.close){
                    log('Закрытие смены.');
                    port.write(Buffer.from(kkm.get({cmd : '2A',param : []}),'hex'),function(err) {
                        if (err) {
                            throw new Error('Запись не удалась (Закрытие смены) \r\n\t' + err.message);
                        }else
                            log('Запись команды успешна');

                    });
                    event.once('responsePort',function(buffer){
                        if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                            let opResultCode = sbrf.NFun(6000);
                            let date = new Date();
                            let name = './shiftPinPad/' + date.getDate() + '-' + ((date.getMonth() + 1) + '').padStart(2,"0") + '-' + date.getFullYear() + '_' + Date.now() + '.shift';
                            check = sbrf.GParamString('Cheque');
                            fs.writeFile(name,check, function (err) {
                                if(!err){
                                    log('Закрытие смены пинпада прошло');
                                    res({open : result.open,close : false});
                                }else
                                    log('Закрытие смены пинпада не прошло');
                            });

                        }else{
                            rej(new Error('Закрытие смены не исполнено \r\n\t' + buffer));
                        }
                    })
                }else{
                    log('Смена не закрывалась.');
                    res({open : result.open,close : result.close});
                }
            });
        }).then(result => {
            return new Promise((res,rej) => {
                if(result.open){
                    log('Начало открытия смены.');
                    port.write(Buffer.from(kkm.get({cmd : 21,param : [1]}),'hex'),function(err) {
                        if (err) {
                            throw new Error('Запись не удалась (Начало открытия смены) \r\n\t' + err.message);
                        }else{
                            log('Запись команды успешна');
                        }
                    });
                    event.once('responsePort',function(buffer){
                        if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                            res({open : result.open,close : result.close});
                        }else{
                            rej(new Error('Начало открытия смены не исполнено \r\n\t' + buffer));
                        }
                    })

                }else{
                    log('Начало открытия смены не запускалось');
                    res({open : result.open,close : result.close});
                }
            });
        }).then(result => {
            return new Promise((res,rej) => {
                if(result.open){
                    log('Открытие смены.');
                    port.write(Buffer.from(kkm.get({cmd : 22,param : []}),'hex'),function(err) {
                        if (err) {
                            throw new Error('Запись не удалась (Открытие смены) \r\n\t' + err.message);
                        }else
                            log('Запись команды успешна');
                    });
                    event.once('responsePort',function(buffer){
                        if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                            fs.writeFile('./shift.json',JSON.stringify({date : Date.now(),buffer : buffer}),(err) => {if(err)log('Проблема при создании файла смены');})
                            res({open : false, close : result.close});
                        }else{
                            rej(new Error('Открытие смены не исполнено \r\n\t' + buffer));
                        }
                    })
                }else{
                    log('Смена не открывалась');
                    res({open : result.open, close : result.close});
                }
            });
        })
        .then(result =>{
            return new Promise((res,rej) => {
                if(!result.open && !result.close){
                    log('Запрос статуса смены');
                    port.write(Buffer.from(kkm.get({cmd : 20,param : []}),'hex'),function(err) {
                        if (err) {
                            throw new Error('Запись не удалась (Проверка смены) \r\n\t' + err.message);
                        }else
                            log('Запись команды успешна');
                    });
                    event.once('responsePort',function(buffer){
                        if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                            res(buffer);
                        }else{
                            rej(new Error('Проверка смены не исполнена \r\n\t' + buffer));
                        }
                    })
                }else{
                    throw new Error('Произошла неведомая хуйня \r\n\t' + buffer);
                }
            });
        }).then(result =>{
            return result[6] + result[7];
        }).then(result => {
            log('Смена №'+result)
            return new Promise((res,rej) => {
                log('Терминал запущен на оплату.');
                sbrf.SParam('Amount', summ*100);
                let opResultCode = sbrf.NFun(4000);
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

                if(opResultCode == 0){
                    let check = e['Cheque'].split('~S\x01',1)[0];
                    let date = new Date();
                    let name = './check/' + date.getDate() + '-' + ((date.getMonth() + 1) + '').padStart(2,"0") + '-' + date.getFullYear() + '_' + Date.now() + '.check';
                    fs.writeFile(name,check, function (err) {});
                    check = check.split('\r\n');
                    let checkArr = [];
                    check.forEach(el =>{
                        if(el != ''){
                            el = cp866buffer.encode(el)
                            checkArr.push({el : el,function : function(checkArr){
                                    return new Promise((res,rej) => {
                                        log('Запись в буфер печати.');
                                        port.write(Buffer.from(kkm.get({cmd : '64',param : [0,0]},checkArr[0].el.toString('hex')),'hex'),function(err) {
                                            if (err) {
                                                throw new Error('Запись не удалась (Запись в буфер печати.) \r\n\t' + err.message);
                                            }else
                                                log('Запись команды успешна');
                                        });
                                        event.once('responsePort',function(buffer){
                                            if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                                                checkArr.splice(0,1)
                                                res();
                                            }else{
                                                rej(new Error('Запись в буфер печати не исполнено \r\n\t' + buffer));
                                            }
                                        })
                                    }).then(res => {
                                        if(checkArr.length > 0)
                                            checkArr[0].function(checkArr);
                                        else{
                                            event.emit('writeCheck',true);
                                        }
                                    })
                                        .catch(err => {
                                            event.emit('writeCheckFalse',true);
                                            log(err);
                                            if(port.isOpen)
                                                port.close();
                                        })
                                }});
                        }
                    })

                    res(checkArr);
                }else{
                    rej(new Error('Оплата не прошла'));
                }
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Печать слипа 2.');
                result[0].function(result);
                event.once('writeCheck',function(){
                    res();
                });
                event.once('writeCheckFalse',function(){
                    rej();
                });
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Печать слипа 3.');
                port.write(Buffer.from(kkm.get({cmd : 65,param : []}),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Печать буфера.) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    res();
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Печать слипа 4.');
                port.write(Buffer.from(kkm.get({cmd : 62,param : [1]}),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Отрезать бумагу.) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    res();
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Отменить документ на случай если был начат и не закончен.');
                port.write(Buffer.from(kkm.get({cmd : 10,param : []}),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Отменить документ на случай если был начат и не закончен.) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    res();
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Открыть кассовый чек.',kkm.get({cmd : 23,param : []}));
                port.write(Buffer.from(kkm.get({cmd : 23,param : []}),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Открыть кассовый чек) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                        res();
                    }else{
                        rej(new Error('Открыть кассовый чек не исполнено \r\n\t' + buffer.toString('hex')));
                    }
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                queue[0].function(queue);
                event.once('writeProduct',function(){
                    res();
                });
                event.once('writeProductFalse',function(){
                    rej();
                });
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Передать Данные платежного агента.');
                port.write(Buffer.from(kkm.get({cmd : '2C',param : []}),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Передать Данные платежного агента) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                        res();
                    }else{
                        rej(new Error('Передать Данные платежного агента не исполнено \r\n\t' + buffer));
                    }
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Передать Данные оплаты.');
                port.write(Buffer.from(kkm.get({cmd : '2D',param : []},summ),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Передать Данные оплаты) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                        res();
                    }else{
                        rej(new Error('Передать Данные оплаты не исполнено \r\n\t' + buffer));
                    }
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                log('Сформировать чек.');
                port.write(Buffer.from(kkm.get({cmd : 24,param : []},summ),'hex'),function(err) {
                    if (err) {
                        throw new Error('Запись не удалась (Сформировать чек) \r\n\t' + err.message);
                    }else
                        log('Запись команды успешна');
                });
                event.once('responsePort',function(buffer){
                    if((buffer[4] + '').padStart(2,"0").toString(16) == 0){
                        res();
                    }else{
                        rej(new Error('Сформировать чек не исполнено \r\n\t' + buffer));
                    }
                })
            })
        }).then(result =>{
            return new Promise((res,rej) => {
                res(true);
                log('Чек распечатан')
                sbrf.NFun(6001);
                sbrf.clear();
                port.close();
            })
        }).catch(err => {
            log(err);
            sbrf.NFun(6004);
            sbrf.clear();
            if(port.isOpen)
                port.close();
            throw new Error(err)

        });
}

module.exports = pay;