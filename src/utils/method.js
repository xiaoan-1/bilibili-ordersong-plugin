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
}

