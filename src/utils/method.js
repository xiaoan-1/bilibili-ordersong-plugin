/* 公用函数 */
export const publicMethod = {
    // 页面提示输出
    pageAlert: function(str){
        let alertBox = document.getElementsByClassName("alertBox")[0];
        let text = document.createElement('div');
        text.textContent = str;
        text.className = "text";
        alertBox.appendChild(text);
        setTimeout(function(){
            text.remove();
        }, 7000)
    },
    pageAlertRepeat: function(str){
        setInterval(() =>{
            this.pageAlert(str);
        }, 7000)
    },
    readConfig: function(obj){
        // 根据字段名读取配置项
        for(const key in obj){
            if(!localStorage.getItem(key)){
                continue;
            }
            if (typeof obj[key] == "string") {
                // 字符串类型配置项
                obj[key] = localStorage.getItem(key);
            }else if( typeof obj[key] == "number"){
                // 数字类型配置项
                obj[key] = parseInt(localStorage.getItem(key));
            }else if(Array.isArray( obj[key] )){
                // 数组类型配置项
                obj[key] = JSON.parse(localStorage.getItem(key));
            }
            // 其他为function类型
        }
    }
}

