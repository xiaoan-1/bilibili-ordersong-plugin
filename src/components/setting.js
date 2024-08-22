export const setting = {

    init: function(){
        //  显示设置界面 
        let elem_orderTable = document.getElementsByClassName("orderTable")[0];
        let elem_setting = document.getElementsByClassName("setting")[0];
        elem_orderTable.onclick = () => {
            elem_setting.style.height = "500px";
        }
        
        // 隐藏设置界面
        document.getElementById('upBtn').onclick = () => {
            elem_setting.style.height = "0px";
        }

        // 设置界面切换
        let elem_menu = document.getElementById('menu');
        let elem_pages = document.getElementById('pages');
        for (let i = 0; i < elem_menu.children.length - 1; i++) {
            const btn = elem_menu.children[i];
            btn.onclick = () => {
                elem_pages.style.left = -(520 * i) + "px";
            }
        }
    }
}