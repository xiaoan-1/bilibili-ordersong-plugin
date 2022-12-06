const genshinVoiceServer = {
    
    // 服务器地址
    baseUrl: "http://plugin.changsheng.space:3100",
    
    /* 获取语音地址
        @name name 角色名
    */
    getVoiceUrl: async function(name){
        let url = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/audio",
            params:{
                name: name
            }
        }).then(function (resp) {
            if(resp.data.url){
                url = resp.data.url;
            }
        }).catch(function(error){
            musicMethod.pageAlert("getVoiceUrl() error");
        });        
        return url;
    },
}