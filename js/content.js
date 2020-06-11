
//Sending message to popup side
function m2p(outgoingMessage){
    chrome.runtime.sendMessage(outgoingMessage,(res)=>{
        console.log(res);
    });
}
//AND Listener
chrome.runtime.onMessage.addListener(  (request,sender, sendResponse)=>{
    switch (request.action) {
        case 'runRequest':
            if(request.callBack){
                m2p({action:request.callBack, value:window[request.value]()})
            }
            break;
        default:
            console.log(request.value);
            break;
    }
    return true;
});

class BridgeCxP {
    constructor() {
        this.send = chrome.runtime.sendMessage({v:'', action:null, callbackName:null},()=>{});
        this.recieve=chrome.runtime.onMessage.addListener((r,s,sR)=>{
            switch (r.action) {
                case 'run':
                    window[r.v]();
                    if(r.callbackName){
                        
                    }
                    break;
                case 'test':
                    break;
                default:
                    this.msgs.push({v:r.v, read:false});
                    break;
            }
        });
        this.msgs = []; // [{v:'message', read:false}]
    }
    get msg(){
        return this.msgs[this.msgs.length-1].v;
    }

}
