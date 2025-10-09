/* 公用函数 */
export default class PublicMethod {

    // 加载配置项
    static readConfig(obj) {
        // 根据字段名读取配置项
        for (const key in obj) {
            if (!localStorage.getItem(key)) {
                continue;
            }
            if (typeof obj[key] == "string") {
                // 字符串类型配置项
                obj[key] = localStorage.getItem(key);
            } else if (typeof obj[key] == "number") {
                // 数字类型配置项
                obj[key] = parseInt(localStorage.getItem(key));
            } else if (typeof obj[key] == "object" || Array.isArray(obj[key])) {
                // 对象和数组
                obj[key] = JSON.parse(localStorage.getItem(key));
            }
            // 其他为function类型
        }
    }

    // 页面提示输出
    static pageAlert(str) {
        let alertBox = document.getElementsByClassName("alertBox")[0];
        let text = document.createElement('div');
        text.textContent = str;
        text.className = "text";
        alertBox.appendChild(text);
        setTimeout(function () {
            text.remove();
        }, 7000)
    }

    // 页面提示循环输出
    static pageAlertRepeat(str) {
        setInterval(() => {
            PublicMethod.pageAlert(str);
        }, 7000)
    }

    // 洗牌算法
    static shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }
}

