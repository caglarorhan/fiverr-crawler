const state = {};
state['tabData']='';
state['viewList'] = ['welcomeScreenContainer','queryCapturedDataContainer','settingsContainer','targetUrlInfoContainer','crawlFiverrContainer','helpContainer'];


window.addEventListener('load',()=>{
totalLoad();

});



function totalLoad(){
    // menu container match process
    hideAllContainers('welcomeScreenContainer');

    document.querySelectorAll("[data-view]").forEach(item=>{
        item.addEventListener('click',()=>{
            hideAllContainers(item.dataset.view);
        })
    });

    // Check and redirect to target url
    document.querySelector('#gotoTargetUrlButton').addEventListener('click',getmeToTheCurrentURL);

    document.querySelector('#crawlFiverrButton').addEventListener('click',()=>{
        m2c({action:'runRequest', value:'crawlIt'})
    });

document.querySelector('#test').addEventListener('click',()=>{
    test('batlican')
})
// total load sonu
}


function getmeToTheCurrentURL(){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        m2c({value:`Current url is: ${tabs[0].url.toString()}`})
        if(tabs[0].url.toString().indexOf('fiverr.com')>-1){
            M.toast({html: 'You are already there, crawl it with the <i class="material-icons">cloud_download</i>icon on the menu!'});
        }else{
            chrome.tabs.update({url: "https://www.fiverr.com/categories"});
        }
    })

}




function hideAllContainers(exceptThat){
    let viewNames = state['viewList'];
    viewNames.forEach((oView)=>{
        if(oView===exceptThat){document.querySelector("#"+oView).style.display='block';}else{document.querySelector("#"+oView).style.display='none';}
    })
}



function test(msg){
    m2c({value:'Popup taraindan contente giden mesaj:'+msg})
}



//Sending message to content side
function m2c(messageToContentSide){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, messageToContentSide, function (response) {
            //('Mesaj yayinlandi') yani contente gitti
        });
    });
}

//Receiving message from the content side
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'runRequest':
            console.log(request.value);
            window[request.value]();
            break;
        case 'mToast':
            M.Toast({html:request.value});
            break;
        default:
            console.log(request.value);
            break;

    }
});
////////////////////////////////////////
////////////////////////////////////////

//     var port = chrome.runtime.connect({name: "fC"});
//     port.postMessage({joke: "Mesaj budur"});// extension tarafina mesaj gondermek icin
// // gelen mesajlari yakalamak icin
//     port.onMessage.addListener(function(msg) {
//         // Gelen mesaj bu formatta msg.question == "Who's there?"
//         // mesaj gonderme    port.postMessage({answer: "Madame"});
//     });
//
//
//
//     chrome.runtime.onConnect.addListener(function(port) {
//         console.assert(port.name === "fC");
//         port.onMessage.addListener(function(msg) {
//             //Gelen mesaj msg.joke == "Knock knock"
//             //Gonderilen mesaj     port.postMessage({question: "Who's there?"})
//         });
//     });
//
