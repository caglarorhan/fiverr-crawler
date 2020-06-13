
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

