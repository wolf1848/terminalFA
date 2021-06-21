/* Расчет массива BYTE для просчета crc

        let temp,
            a,
            byte = new Uint16Array(256);
        for (let i = 0; i < byte.length; ++i){
            temp = 0;
            a = i << 8;
            for (let j = 0; j < 8; ++j) {
                if (((temp ^ a) & 0x8000) != 0) {
                    temp = (temp << 1) ^ 0x1021;
                } else {
                    temp <<= 1;
                }
                a <<= 1;
            }

            byte[i] = temp;
        }

* */

class Crc{
    static byte = new Uint16Array([
        0,
        4129,
        8258,
        12387,
        16516,
        20645,
        24774,
        28903,
        33032,
        37161,
        41290,
        45419,
        49548,
        53677,
        57806,
        61935,
        4657,
        528,
        12915,
        8786,
        21173,
        17044,
        29431,
        25302,
        37689,
        33560,
        45947,
        41818,
        54205,
        50076,
        62463,
        58334,
        9314,
        13379,
        1056,
        5121,
        25830,
        29895,
        17572,
        21637,
        42346,
        46411,
        34088,
        38153,
        58862,
        62927,
        50604,
        54669,
        13907,
        9842,
        5649,
        1584,
        30423,
        26358,
        22165,
        18100,
        46939,
        42874,
        38681,
        34616,
        63455,
        59390,
        55197,
        51132,
        18628,
        22757,
        26758,
        30887,
        2112,
        6241,
        10242,
        14371,
        51660,
        55789,
        59790,
        63919,
        35144,
        39273,
        43274,
        47403,
        23285,
        19156,
        31415,
        27286,
        6769,
        2640,
        14899,
        10770,
        56317,
        52188,
        64447,
        60318,
        39801,
        35672,
        47931,
        43802,
        27814,
        31879,
        19684,
        23749,
        11298,
        15363,
        3168,
        7233,
        60846,
        64911,
        52716,
        56781,
        44330,
        48395,
        36200,
        40265,
        32407,
        28342,
        24277,
        20212,
        15891,
        11826,
        7761,
        3696,
        65439,
        61374,
        57309,
        53244,
        48923,
        44858,
        40793,
        36728,
        37256,
        33193,
        45514,
        41451,
        53516,
        49453,
        61774,
        57711,
        4224,
        161,
        12482,
        8419,
        20484,
        16421,
        28742,
        24679,
        33721,
        37784,
        41979,
        46042,
        49981,
        54044,
        58239,
        62302,
        689,
        4752,
        8947,
        13010,
        16949,
        21012,
        25207,
        29270,
        46570,
        42443,
        38312,
        34185,
        62830,
        58703,
        54572,
        50445,
        13538,
        9411,
        5280,
        1153,
        29798,
        25671,
        21540,
        17413,
        42971,
        47098,
        34713,
        38840,
        59231,
        63358,
        50973,
        55100,
        9939,
        14066,
        1681,
        5808,
        26199,
        30326,
        17941,
        22068,
        55628,
        51565,
        63758,
        59695,
        39368,
        35305,
        47498,
        43435,
        22596,
        18533,
        30726,
        26663,
        6336,
        2273,
        14466,
        10403,
        52093,
        56156,
        60223,
        64286,
        35833,
        39896,
        43963,
        48026,
        19061,
        23124,
        27191,
        31254,
        2801,
        6864,
        10931,
        14994,
        64814,
        60687,
        56684,
        52557,
        48554,
        44427,
        40424,
        36297,
        31782,
        27655,
        23652,
        19525,
        15522,
        11395,
        7392,
        3265,
        61215,
        65342,
        53085,
        57212,
        44955,
        49082,
        36825,
        40952,
        28183,
        32310,
        20053,
        24180,
        11923,
        16050,
        3793,
        7920
    ]);
    static format (data){
        return data.toString(2).toString(2).slice(-16).padStart(16,"0").split('');
    }

    static XOR(a,b){
        a = Crc.format(a);
        b = Crc.format(b);

        let res = a.map((el,i) => {
            return el ^ b[i];
        })
        return parseInt(res.join(''),2);
    }

    static get(buffer){
        let crc = 0xffff,str;
        for (let i = 0; i < buffer.length; ++i)
        {
            let start = (+Crc.byte[((crc >> 8) ^ (0xff & buffer[i]))]);
            let finish = (+(crc << 8));

            crc = Crc.XOR(start,finish)
        }

        str = (crc.toString(16) + "").padStart(4,"0");

        return str[2] + str[3] + str[0] + str[1];
    }

}

String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}

class Kkm{
    constructor() {
        this.start = 'B629';
        this.length = '';
        this.cmd = '';
        this.data = '';
        this.crc = '';
    }

    static Command = {
        //Отмена документа
        10 : function() {
            let str = '10';
            return str;
        },
        //Запрос статуса смены
        20 : function() {
            let str = '20';
            return str;
        },
        // Начало открытия смены
        21 : function(param) {
            let params = [
                    ['00','01']
                ],
                str = '21';

            param.forEach((el,i) => {
                str += params[i][el];
            });

            return str;
        },
        // Открытие смены
        22 : function() {
            let str = '22';
            return str;
        },
        // Открыть чек
        23 : function() {
            let str = '2345A0';
            return str;
        },
        // Передать данные предмета расчета
        '2B' : function(param,data) {
            let obj = {
                name                : Kkm.getTag(1030,data.name),
                price               : Kkm.getTag(1079,Kkm.getVlnLe(data.price*100)),
                count               : Kkm.getTag(1023,Kkm.getFvlnLe(data.count)),
                nds                 : Kkm.getTag(1199,'01'),
                payFlag             : Kkm.getTag(1214,'04'),
                productTypeFlag     : Kkm.getTag(1212,'01'),
                codeTN              : Kkm.getTag(1162,''),
                metric              : Kkm.getTag(1197,''),
                akciz               : Kkm.getTag(1229,'00'),
                numberTD            : Kkm.getTag(1231,''),
                contryCode          : Kkm.getTag(1230,''),
                dReq                : Kkm.getTag(1191,''),
                agentFlag           : Kkm.getTag(1222,'00'),
                phonePayAgent       : Kkm.getTag(1075,''),
                OPA			    	: Kkm.getTag(1044,''),
                TPA			    	: Kkm.getTag(1073,''),
                TOPP			    : Kkm.getTag(1074,''),
                NOP			    	: Kkm.getTag(1026,''),
                AOP			    	: Kkm.getTag(1005,''),
                INNOP		    	: Kkm.getTag(1016,''),
                TP			    	: Kkm.getTag(1171,''),
                NP			    	: Kkm.getTag(1225,''),
                INNP		    	: Kkm.getTag(1226,'202020202020202020202020'),
            }
            let implodeStr = ''
            for(let key in obj){
                let el = obj[key];
                implodeStr += el
            }


            let buffer = Kkm.getTag(1059,implodeStr)

            let str = '2B' + buffer;
            return str;
        },
        // Передать данные платежного агента
        '2C' : function() {
            let obj = {
                agentFlag           : Kkm.getTag(1057,'00'),
                phonePayAgent       : Kkm.getTag(1073,''),
                OPA			    	: Kkm.getTag(1044,''),
                TOPP			    : Kkm.getTag(1074,''),
                NOP			    	: Kkm.getTag(1026,''),
                INNOP		    	: Kkm.getTag(1016,'202020202020202020202020'),
                AOP			    	: Kkm.getTag(1005,''),
                TPA			    	: Kkm.getTag(1075,''),
                TP			    	: Kkm.getTag(1171,''),
            }
            let implodeStr = ''
            for(let key in obj){
                let el = obj[key];
                implodeStr += el
            }

            let str = '2C' + implodeStr;
            return str;
        },
        // Передать данные оплаты
        '2D' : function(param,data) {
            let obj = {
                regimTax            : Kkm.getTag(1055,'01'),
                NAL       			: Kkm.getTag(1031,'00'),
                BNAL		    	: Kkm.getTag(1081 ,Kkm.getVlnLe(data*100)),
                PRED			    : Kkm.getTag(1215,'00'),
                POST		    	: Kkm.getTag(1216,'00'),
                CRED		    	: Kkm.getTag(1217,'00'),
                clienEmail	    	: Kkm.getTag(1008,''),
                INNclient	    	: Kkm.getTag(1228,'202020202020202020202020'),
                client	    		: Kkm.getTag(1227,''),
                DOPREQ	    		: Kkm.getTag(1192,''),

            }
            let implodeStr = ''
            for(let key in obj){
                let el = obj[key];
                implodeStr += el
            }

            let str = '2D' + implodeStr;
            return str;
        },
        // Сформировать чек
        24 : function(param,data) {

            //2401 приход
            //2402 возврат
            let str = '2401' + Kkm.getVlnLe(data*100).padEnd(10,"0");
            return str;
        },
        // Начало закрытия смены
        29 : function(param) {
            let params = [
                    ['00','01']
                ],
                str = '29';

            param.forEach((el,i) => {
                str += params[i][el];
            });

            return str;
        },
        //Закрытие смены
        '2A' : function() {
            let str = '2A';
            return str;
        },
        // Отрезать бумагу
        62 : function(param) {
            let params = [
                    ['00','01']
                ],
                str = '62';

            param.forEach((el,i) => {
                str += params[i][el];
            });

            return str;
        },
        //Записать в буфер печати массив форматированных строк символов
        64 : function(param,data){
            let params = [
                ['00', '08', '10', '20', '40', '80'],
                ['00', '01', '02']
            ];
            let paramsStr = '';

            param.forEach((el,i) => {
                paramsStr += params[i][el];
            });

            return '64' + Kkm.getTag(39999,paramsStr + data);
        },
        // Печать буфера форматированных строк
        65 : function(param) {
            let str = '65';

            return str;
        },

    }

    get(cmd,data = ''){
        let res = Kkm.Command[cmd.cmd](cmd.param,data);
        if(res instanceof Array){
            res = res.map(el =>{

                return this.start + Kkm.getLength(el) + el + Crc.get(Buffer.from(Kkm.getLength(el) + el,'hex'))
            })
        }else
            res = this.start + Kkm.getLength(res) + res + Crc.get(Buffer.from(Kkm.getLength(res) + res,'hex'))

        return res;
    }

    static getLength(str){
        return '00' + ((Buffer.from(str,'hex').length).toString(16) + '').padStart(2,"0")
    }

    static getLengthTlv(buffer){
        return ((buffer.length + 2).toString(16) + '').padStart(2,"0") + '00';
    }

    static getTag(num,data){
        if(!(data instanceof Object)){
            data = Buffer.from(data,'hex')
        }
        let len = (data.length.toString(16) + '').padStart(4,"0")
        let str = (num.toString(16) + '').padStart(4,"0")
        return str[2] + str[3] + str[0] +str[1] + len[2] + len[3] + len[0] + len[1] + Buffer.from(data).toString('hex');
    }
    static  getVlnLe(num){
        let str = num.toString(16);
        if(str % 2 != 0)
            str = '0' + str;
        return (Buffer.from(str,'hex').reverse()).toString('hex');
    }
    static  getFvlnLe(num){
        let str = num.toString(16);
        if(str % 2 != 0)
            str = '0' + str;
        return '00' + (Buffer.from(str,'hex').reverse()).toString('hex');
    }

}

module.exports = Kkm;