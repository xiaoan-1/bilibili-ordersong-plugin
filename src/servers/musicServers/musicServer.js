import { qqmusicServer } from "./qqmusicServer.js";
import { wymusicServer } from "./wymusicServer.js";

export const musicServer = {

    getPlatform: function(platform){
        if(platform == "wy"){
            return wymusicServer;
        }else if(platform == "qq"){
            return qqmusicServer;
        }else{
            return wymusicServer;
        }
    },
}