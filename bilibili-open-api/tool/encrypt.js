const crypto = require('crypto');
const axios = require('axios');

class Encrypt {
    constructor() {
        // 项目秘钥
        this.access_key_id = "";
        // 签名秘钥
        this.access_key_secred = "";
    }
    
    // 鉴权加密
    getEncodeHeader(body) {
        // 时间戳
        const timestamp = parseInt(Date.now()+ "") 
        // 随机
        const nonce = parseInt(Math.random() * 100000000 + "") + timestamp
        
        // 构建请求头
        const header = {
            // 项目秘钥
            "x-bili-accesskeyid": this.access_key_id,
            // 请求体的编码值，根据请求体计算所得。算法说明：将请求体内容当作字符串进行MD5编码。
            "x-bili-content-md5": this.getMd5Content(JSON.stringify(body)),
            // 签名方式。取值：HMAC-SHA256
            "x-bili-signature-method": "HMAC-SHA256",
            // 签名唯一随机数。用于防止网络重放攻击，建议您每一次请求都使用不同的随机数。
            "x-bili-signature-nonce": nonce + "",
            // 签名版本， 默认1.0
            "x-bili-signature-version": "1.0",
            // unix时间戳，单位是秒。请求时间戳不能超过当前时间10分钟，否则请求会被丢弃。
            "x-bili-timestamp": timestamp
        }

        const data = [];
        for (const key in header) {
            data.push(`${key}:${header[key]}`)
        }

        // 签名秘钥
        const signature = crypto.createHmac("sha256", this.access_key_secred).update(data.join("\n")).digest("hex")
        
        // 返回加密后的头部信息
        return {
            // 接受的返回结果的类型。目前只支持JSON类型，取值：application/json。
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...header,
            "Authorization": signature
        }
    }

    // MD5加密
    getMd5Content (str) {
        return crypto.createHash("md5").update(str).digest("hex")
    }

    async test(){
        let body = {
            "code": "DFTJO4NTWVEO7",
            "app_id": 1711708120386
        };
        await axios({
            method: "post",
            url: "https://live-open.biliapi.com/v2/app/start",
            data:body,
            headers: this.getEncodeHeader(body)
        }).then(resp => {
            console.log(resp.data);
        }).catch(function(error){
            console.log("???");
        });  
    }
}

module.exports = new Encrypt();



