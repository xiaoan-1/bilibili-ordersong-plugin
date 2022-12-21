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
            musicMethod.pageAlert("test error");
        });        
        return url;
    },
}