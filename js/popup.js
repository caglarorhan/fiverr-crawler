const state = {};
state['tabData']='';
state['viewList'] = ['welcomeScreenContainer','queryCapturedDataContainer','settingsContainer','targetUrlInfoContainer','crawlFiverrContainer','helpContainer'];


window.addEventListener('load',()=>{
totalLoad();

});



function totalLoad(){
    let settingsTabUl = document.querySelector('.tabs');
    let settingsTab = M.Tabs.init(settingsTabUl);
    // menu container match process
    hideAllContainers('welcomeScreenContainer');

    document.querySelectorAll("[data-view]").forEach(item=>{
        item.addEventListener('click',()=>{
            hideAllContainers(item.dataset.view);
        })
    });

    // Check and redirect to target url
    document.querySelector('#gotoTargetUrlButton').addEventListener('click',getmeToTheCurrentURL);

    // Begin to crawl
    document.querySelector('#beginToCrawlButton').addEventListener('click',()=>{
        document.querySelector('#crawlingProggressBar').style.display='block';
        m2c({action:'runRequest', value:'crawlIt'})
    });

    //Stop crawling
    document.querySelector('#stopCrawlingButton').addEventListener('click',()=>{
        document.querySelector('#crawlingProggressBar').style.display='none';
        m2c({action:'runRequest', value:'stopCrawling'})
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
/*
                       seller_name: title.seller_name,
                        gig_id: title.gig_id,
                        gig_created: title.gig_created,
                        gig_updated: title.gig_updated,
                        price: title.price
* */

function crawlData2Container(data){
    document.querySelector('#card-title').textContent = data.seller_name;
    let otherInfo=``;
    Object.entries(data).forEach((entry)=>{
        otherInfo+=`<div>${entry[0]}: ${entry[1]}</div>`;
    });
    document.querySelector('#card-info').innerHTML = otherInfo;

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
chrome.runtime.onMessage.addListener((request,sender, sendResponse)=>{

    switch(request.action){
        case 'crawlData':
            crawlData2Container(request.value);
            break;
    }

});

////////////////////////////////////////
