//////////////////////////////////////////////////////////////////////////////
const state = {};
const locSt = window.localStorage;
const fF = {};
const minutesNow = Math.floor(new Date().getTime() / 60000);
state['tabData']='';
state['viewList'] = ['welcomeScreenContainer','queryCapturedDataContainer','settingsContainer','targetUrlInfoContainer','crawlFiverrContainer','helpContainer'];
state['failedURLz']=[];
state['crawlStatusOrder']={continue:true};
state['freshCategories']={refreshDate:minutesNow, categoryList:[]};
state['firebaseConfig'] = {};


//if firebaseconfig is already saved local retrieve it and set the state. Also, write it to the textarea
if(locSt.getItem('firebaseConfig')){
    const confObj = {};
    let fbC = locSt.getItem('firebaseConfig');
    //----------------------------------------------
    fbC = fbC.replace(/\s/g,'');
    if(fbC[0]==='{'){fbC = fbC.substring(1,fbC.length-1)}
    if(fbC[fbC.length-1]==="}"){fbC = fbC.substring(0,fbC.length-2)}
    //m2c({value:fbC});
    fbC.split(',').forEach((entry)=>{
       let keyVal = entry.split(":");
       confObj[keyVal[0]] = keyVal[1];
    });
    //-----------------------------------------------
    state.firebaseConfig = confObj; //set state property  again
    //m2c({value:state.firebaseConfig});
    document.querySelector('#firebaseConfig').value = locSt.getItem('firebaseConfig');
    firebase.initializeApp(state.firebaseConfig); //init firebase with these configs
    fF.db = firebase.firestore();
    M.toast({html:'Firebase connection succeed!'})
}else{
    M.toast({html:`You should save firebase config credentials first!`});
}





window.addEventListener('load',()=>{
totalLoad();
});


function saveGigToFireStore(gG){
    if(!fF.db){
        M.toast({html:`Firebase db couldn't initiate!`});
        return false;
    }
    fF.db.collection("gigs").add(gG)
        .then(function() {
            document.querySelector('#acknowledgeOfTitleSave').textContent=`Saved to the firebase!`;
        })
        .catch(function(error) {
            document.querySelector('#acknowledgeOfTitleSave').textContent=`Error:${error}`;
        });
}


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
        M.toast({html:'Crawl process will begin shortly!'});
        document.querySelector('#crawlingProggressBar').style.display='block';
        let crawling = crawlIt();
        document.querySelector('#beginToCrawlButton').classList.toggle('disabled');
        document.querySelector('#stopCrawlingButton').classList.toggle('disabled');
    });

    //Stop crawling
    document.querySelector('#stopCrawlingButton').addEventListener('click',()=>{
        M.toast({html:'Quitting from crawl process...'});
        document.querySelector('#crawlingProggressBar').style.display='none';
        state.crawlStatusOrder.continue=false;
        document.querySelector('#beginToCrawlButton').classList.toggle('disabled');
        document.querySelector('#stopCrawlingButton').classList.toggle('disabled');
    });

    //firebaseConfigSaveButton
    document.querySelector('#firebaseConfigSaveButton').addEventListener('click', ()=>{
        let confText = document.querySelector('#firebaseConfig').value;
        locSt.setItem('firebaseConfig',confText);
        M.toast({html:'Firebase configuration text saved into localStorage!'})
    })

// total load sonu
}


function getmeToTheCurrentURL(){

    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
           m2c({value:`Current url is: ${tabs[0].url.toString()}`});
        if(tabs[0].url.toString()==='https://www.fiverr.com/categories'){
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


function crawlData2Container(data){
    document.querySelector('#card-title').textContent = data.seller_name;
    let otherInfo=``;
    Object.entries(data).forEach((entry)=>{
        otherInfo+=`<div><b>${entry[0]}</b>: ${entry[1]}</div>`;
    });
    document.querySelector('#card-info').innerHTML = otherInfo;

}





//Sending message to content side
function m2c(messageToContentSide){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, messageToContentSide, function (response) {

        });
    });
}
//Receiving message from the content side
chrome.runtime.onMessage.addListener((request,sender, sendResponse)=>{
    switch(request.action){
        case "runRequest":
            window[request.value]();
            break;
        case 'crawlData':
            crawlData2Container(request.value);
            break;
        case 'stateModifier':
            stateModifier(request.value);
            break;
        default:
            M.toast({html:`<b>${request.value}</b>`});
            break;
    }
    return true;
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function stateModifier(keyValueObject){
    Object.keys(keyValueObject).forEach((key)=>{
       state[key]=keyValueObject[key];
        M.toast({html:'State is modified...'});
    });

}


const crawlIt = async function() {
    state.crawlStatusOrder.continue=true;
    let fC = await getCategories();
    let cFL = fC.length;
    let fCi = 0;

    for (url2ndPart of fC) {
        if(!state.crawlStatusOrder.continue){
            let quittingMessage =`Continuing process is about to complete, once done will quit!`;
            m2c({value:quittingMessage});
            M.toast({html:`<b>${quittingMessage}</b>`});
            break;
        }
        let jsonJob = await getJSON('https://www.fiverr.com/categories/' + url2ndPart);
        m2c({value:`${url2ndPart} json dosyasi ${jsonJob}`});
    }

};
// Hedef json sayfasindan seller verilerini ceken kisim
function getJSON(targetJSONurl){

    return new Promise(async (resolve,reject)=>{
        //--------------------------------------------
        for(let page=1; page<500;){
            let donen = await returnMyJson(targetJSONurl, page)
            if(!donen){break}else{page++}
        }
        window.setTimeout(()=>{
            resolve('tamamdir')
        },2700)

        //-------------------------------------------------------
    })


}

function returnMyJson(targetJSONurl,page){
    let jsonRequest = fetch(targetJSONurl+'.json?page='+page);
    jsonRequest.then(response =>{
        if (response.status !== 200) {
            m2c({value:`Looks like there was a problem. Status Code: ${response.status}`});
            state['failedURLz'].push(targetJSONurl);
            return new Promise((res,rej)=>{
                res(false);
            });
        }
        let res = response.json();
        res.then((o)=>{
            //istenilen veriler o altinda yeraliyor
            m2c({value:`
                Bu categorideki teorik  sayfa sayisi: ${o.pagination.number_of_pages}
                -------------------------------------------------------------------
                `});
            // FIREBASE
            //saveGigToFireStore(o.gigs);
            o.gigs.forEach((title)=>{
                // insert title by title into firebase
                if(fF.db){saveGigToFireStore(title)}
                //------------------
                let tit = {
                    seller_name: title.seller_name,
                    gig_id: title.gig_id,
                    gig_created: title.gig_created,
                    gig_updated: title.gig_updated,
                    price: title.price
                };
                crawlData2Container(tit);
            });
            //
            if(o.next_page===true){
                 return new Promise((res,rej)=>{
                         window.setTimeout(()=>{
                             res(true);
                         },2500)

                     })

            }else{
                return new Promise((res,rej)=>{
                    res(false);
                });
            }
        })
    });
    jsonRequest.catch((e)=>{m2c({value:e})});
}



async function getCategories(){
    let minutesNow = Math.floor(new Date().getTime() / 60000);
    m2c({action:'runRequest', value:'fetchCategories', callBack:'stateModifier'});
    return await new Promise(resolve=>{
        setTimeout(()=>{
            resolve(state.freshCategories.categoryList);
            },4000);
    });


}
//


