
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



function fetchCategories(){

    let boxes = document.querySelectorAll('.sitemap-box');
    let fullCategories =[];
    boxes.forEach((box)=>{
        box.querySelectorAll('.mp-categories-columns.cf').forEach((subcat)=>{
            subcat.querySelectorAll('li > a').forEach((scl)=>{
                //console.log(scl.href)
                let clearUrlPart = scl.href.replace('https://www.fiverr.com/categories/','');
                clearUrlPart = clearUrlPart.replace('https://www.fiverr.com/','');
                fullCategories.push(clearUrlPart)
                //
            })
        })
    });
    let minutesNow = Math.floor(new Date().getTime() / 60000);
    return {'freshCategories':{refreshDate:minutesNow, categoryList:fullCategories}}
}



