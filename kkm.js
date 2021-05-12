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
        64 : function(param,data){
            let params = [
                ['00', '08', '10', '20', '40', '80'],
                ['00', '01', '02']
            ];

            let cut = [],arr = [...data], flag = true;
            while(flag){
                let cutEl = arr.splice(0,124);
                if(cutEl.length > 0){
                    cut.push(cutEl);
                }else
                    flag = false;
            }

            cut = cut.map(el => {
                let start = '643F9C';
                start += Kkm.getLengthTlv(el);
                param.forEach((p,i) => {
                    start += params[i][p];
                });
                start += Buffer.from(el).toString('hex');

                return start;
            });

            return cut;
        },
        65 : function(param) {
            let params = [
                    ['00','01']
                ],
                str = '65';

            param.forEach((el,i) => {
                str += params[i][el];
            });

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

}

module.exports = Kkm;