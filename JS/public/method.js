/* 用于处理点歌信息的函数 */
export const musicMethod = {
    // 页面提示输出
    pageAlert: function(str){
        let alertBox = document.getElementsByClassName("alertBox")[0];
        let div = document.createElement('div');
        div.textContent = str;
        div.className = "text";
        alertBox.appendChild(div);
        setTimeout(function(){
            div.remove();
        }, 7000)
    },
    setCookie: function(cookie){
        var cookiePairs = cookie.split(';'); // 分割为键值对数组

        for (var i = 0; i < cookiePairs.length; i++) {
            var pair = cookiePairs[i].trim().split('=');
            var key = pair[0];
            var value = pair[1];
            
            // 设置 Cookie
            document.cookie = key + "=" + encodeURIComponent(value) + "; path=/";
        }
    }
}

