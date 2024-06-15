
/* 
    音乐api扩展，扩展其他音乐平台API 
*/

const testServer = {
    
    // 服务器地址
    baseUrl: "127.0.0.1:2233",
    
    /* API
        @param param 参数
    */
    get: async function(param){
        await axios({
            method: "get",
            url: this.baseUrl + "/audio",
            params:{
                param: param
            }
        }).then(function (resp) {
            console.log(resp.data);
        }).catch(function(error){
            publicMethod.pageAlert("test error");
        });        
        return url;
    },
}