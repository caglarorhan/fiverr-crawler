//////////////////////////////////////////////////////////////////////////////
const state = {};
const locSt = window.localStorage;
const fF = {};
const minutesNow = Math.floor(new Date().getTime() / 60000);
state['tabData']='';
state['viewList'] = {};
state['failedURLz']=[];
state['crawlStatusOrder']={continue:true};
state['crawlStatusChangerButton'] = {position:true};
state['freshCategories']={refreshDate:minutesNow, categoryList:[]};
state['firebaseConfig'] = {};
state['settings']={console:true, toast:true};
state['countries']= ["Argentina", "Australia", "Bahrain", "Bangladesh", "Barbados", "Bosnia and Herzegovina", "Bulgaria", "Cameroon", "Canada", "China", "Colombia", "Croatia", "Cyprus", "Czech Republic", "Dominican Republic", "Ecuador", "Egypt", "France", "Germany", "Ghana", "Greece", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Kenya", "Lithuania", "Macedonia [FYROM]", "Malaysia", "Moldova", "Morocco", "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia", "Serbia", "Slovenia", "Spain", "Sri Lanka", "Suriname", "Sweden", "Switzerland", "Thailand", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam", "Zambia"];
state['languages'] =["Arabic", "Bengali", "Chinese", "Dutch", "English", "French", "German", "Gujarati", "Hebrew", "Hindi", "Italian", "Kannada", "Malayalam", "Marathi", "Oriya", "Persian", "Polish", "Portuguese", "Portuguese-BR", "Punjabi", "Russian", "Spanish", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese"];

//if firebaseconfig is already saved local retrieve it and set the state. Also, write it to the textarea
if(locSt.getItem('firebaseConfig')){
    const confObj = {};
    let fbC = locSt.getItem('firebaseConfig');
    //----------------------------------------------
    fbC = fbC.replace(/\s/g,'');
    if(fbC[0]==='{'){fbC = fbC.substring(1,fbC.length-1)}
    if(fbC[fbC.length-1]==="}"){fbC = fbC.substring(0,fbC.length-2)}
    fbC.split(',').forEach((entry)=>{
       let keyVal = entry.split(':');
       confObj[keyVal[0]] = entry.replace(keyVal[0]+':','').replace(/"/g, "");
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

function checkFirebaseConnection(){
    if(!fF.db){
        state.firebaseConfig.continue =false;
        return false;
    }else{
        return true;
    }
}


m2c({value:checkFirebaseConnection()});

window.addEventListener('load',()=>{
totalLoad();
});


function saveGigToFireStore(gG){
    if(!checkFirebaseConnection()){
        M.toast({html:`Firebase db couldn't initiate! Quitting`});
        state.firebaseConfig.continue =false;
        return false;
    }
    fF.db.collection('gigs').add(gG)
        .then(function() {
            document.querySelector('#savingInfo').textContent=`Saved!`; //savingInfo
            window.setTimeout(()=>{
                document.querySelector('#savingInfo').textContent=`Done!`; //savingInfo
            },200)
        })
        .catch(function(error) {
            document.querySelector('#savingInfo').textContent=`Error!`;
            m2c({value:`Error happened: ${error}`})
        });
}

function pushToDownloadTextFile(ingredient){
    let blob = new Blob([ingredient], {type: "text/plain"});
    let url = URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url // The object URL can be used as download URL
        //...
    });
}



function totalLoad(){
    let settingsTab = M.Tabs.init(document.querySelector('#settingTabs'));
    let queryTab = M.Tabs.init(document.querySelector('#queryTabs'));
    let datePicker = M.Datepicker.init(document.querySelectorAll('.datepicker'),{autoClose:true,format:'yyyy-mm-dd', }); //2020-05-10
    //-first add countries to select options
    addCountriesToSellerCountrySelect();
    let allSelects = M.FormSelect.init(document.querySelectorAll('select'), {});

    document.querySelectorAll("[data-view]").forEach(item=>{
        state['viewList'][item.dataset.view]=item.dataset.caption;
        item.addEventListener('click',()=>{
            hideAllContainers(item.dataset.view);
        })
    });
    //m2c({value:state.viewList});
    hideAllContainers('welcomeScreenContainer');


    // Check and redirect to target url
    document.querySelector('#gotoTargetUrlButton').addEventListener('click',getmeToTheCurrentURL);

    // Begin/Quit to crawl
    document.querySelector('#beginToCrawlButton').addEventListener('click',()=>{
        if(state.crawlStatusChangerButton.position){
            M.toast({html:'Crawl process will begin shortly!'});
            state.crawlStatusOrder.continue = true;
            let crawling = crawlIt();
            state.crawlStatusChangerButton.position = false;
            document.querySelector('#beginToCrawlButton').innerText = 'QUIT';
            document.querySelector('#beginToCrawlButton').title = 'Quit from crawling!';

        }else{
            M.toast({html:'Quitting from crawl process...'});
            state.crawlStatusOrder.continue = false;
            state.crawlStatusChangerButton.position = true;
            document.querySelector('#beginToCrawlButton').innerText = 'BEGIN';
            document.querySelector('#beginToCrawlButton').title = 'Begin to Crawl';
        }
        document.querySelector('#beginToCrawlButton').classList.toggle('red');
        document.querySelector('#beginToCrawlButton').classList.toggle('green');

    });

    //firebaseConfigSaveButton
    document.querySelector('#firebaseConfigSaveButton').addEventListener('click', ()=>{
        let confText = document.querySelector('#firebaseConfig').value;
        locSt.setItem('firebaseConfig',confText);
        M.toast({html:'Firebase configuration text saved into localStorage!'})
    });

    // getURL list
    document.querySelector('#getTheCategoryURLzButton').addEventListener('click',async ()=>{
        document.querySelector('#urlList').innerHTML= loadingCircle();
        let fC = await getCategories();
        let divCreation = await urlDivCreator(fC,'urlList');
    });

    //setting console status button
    document.querySelector('#settingsConsoleStatus').addEventListener('click',()=>{
        m2c({value:state});
        state.settings.console=this.checked;
    });

    //setting toast messages
    document.querySelector('#settingsToastStatus').addEventListener('click',()=>{
        state.settings.toast=this.checked;
        if(state.settings.toast){
            let addStyle = document.createElement('style');
            //addStyle.id='toastContainerDisplaySetting';
            addStyle.innerHTML = `
            #toast-container{ display:none !important;}
            `;
            document.head.append(addStyle);
        }else{
            document.querySelector('#toastContainerDisplaySetting').remove();
        }


    });

    //reports
    document.querySelector('#reportsButton').addEventListener('click',async()=>{
        document.querySelector('#reports').innerHTML= loadingCircle();
        let fC = await getCategories();
        let divCreation = await urlDivCreator(fC,'reports');
        locSt.setItem('orderQueueData','');
        let orderQueTotals = await urlRequester(fC);
        m2c({value:orderQueTotals});
        orderQueTotals='CategoryURL,Category Total Queue Count, 5 Star Count, 4 Star Count, 3 Star Count, 2 Star Count, 1 Star Count' +'\n' +orderQueTotals;
        locSt.setItem('orderQueueData',orderQueTotals);

        pushToDownloadTextFile(orderQueTotals);
    });

    //floating button init
    let instances = M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn'), {
        direction: 'left',
        hoverEnabled: false
    });

    // reports floating button click
    document.querySelector('#reportsDownloadCsvFileButton').addEventListener('click',()=>{
        pushToDownloadTextFile(locSt.getItem('orderQueueData'));
    })


// total load sonu
}


async function urlRequester(fC){
    let totalUrlValues='';
    let divHeight = 25;
    for(let orderNum=0; orderNum<fC.length; orderNum++){ //her temel url buradan giriyor
        document.querySelector('#processingURLdiv_'+orderNum).classList.remove('cumulDiv');
        document.querySelector('#processingURLdiv_'+orderNum).classList.add('cumulDivActive');
        document.querySelector('#processingURLPageNumber_'+orderNum).textContent=`process`;
        document.querySelector('#reports').scrollTo({top: divHeight*orderNum , behavior: 'smooth'});
        let urlData = await sumQueue('https://www.fiverr.com/categories/'+fC[orderNum]+'?ref=seller_level%3Atop_rated_seller');
        m2c({value:fC[orderNum]});
        m2c({value:urlData});
        totalUrlValues+= fC[orderNum]+','+urlData.pagesTotalOrderQueue +','+urlData.starsTotal.toString()+'\n';
        // toplamlari satirlara yazdir burada
        //{pagesTotalOrderQueue: pagesTotalOrderQueue, starsTotal: starsTotal }
        document.querySelector('#processingURLPageNumber_'+orderNum).textContent = urlData.pagesTotalOrderQueue;
        document.querySelector('#processingURLPageNumber_'+orderNum).title = urlData.starsTotal;
    }
return new Promise(resolve=>{
    resolve(totalUrlValues)
})
}



async function sumQueue(targetHTMLurl){
    let pagesTotalOrderQueue = 0;
    let starsTotal = [0,0,0,0,0];
    //  url yi fetch et page=1 olarak request yap
    m2c({value:'HEDEF: '+targetHTMLurl});
    for(let page=1; page<200; page++){
        let response = await fetch(targetHTMLurl+'&page='+page); // 48 gig ve altinda paging olan sayfa gelecek
        if (response.status !== 200) {break;}
        let tempHTML = await response.text();
        //m2c({value:tempHTML})
        let tmp = JSON.parse(tempHTML.split('initialData.search_perseus = ')[1].split(';\n' +
            '  </script>')[0]);
        if(!tmp.tracking.error){
            // sayfa son sayfa degil devam
            let gigSize = tmp.listings[0].gigs.length;//48 donecek
            //m2c({value:gigSize})
            let gigsTotalOrderQueue=0;
            for(let order = 0; order<gigSize; order++){
                let thisGigTotalOrderQueue = 0;
                // gigs icindeki her nesne icin gig_url urlsine gidilecek
                // "https://www.fiverr.com" + tmp.listings[0].gigs[order]
                //m2c({value:"https://www.fiverr.com" + tmp.listings[0].gigs[order].gig_url});

                let gigPage = await (()=>{
                    return new Promise((resolve,reject)=>{
                        window.setTimeout(()=>{
                            resolve(fetch("https://www.fiverr.com" + tmp.listings[0].gigs[order].gig_url))
                        },1000)
                    })
                })();

                if(gigPage.status!==200){break;}
                let pageSrc= await gigPage.text();
                //m2c({value:pageSrc})
                //m2c({value:tmp.listings[0].gigs[order].seller_name})
                document.querySelector('#currentSellerName').textContent=tmp.listings[0].gigs[order].seller_name;
                let domparser = new DOMParser();
                let doc = domparser.parseFromString(pageSrc, "text/html");
                //m2c({value:parseInt(doc.querySelector('.orders-in-queue').textContent)})
                //orders in queue
                if(doc.querySelector('.orders-in-queue')){
                    thisGigTotalOrderQueue = parseInt(doc.querySelector('.orders-in-queue').textContent);
                }
                //stars
                if(doc.querySelector(`table.stars-counters`)){
                    for(let star=1; star<6; star++){
                        let starPointText = doc.querySelector(`table.stars-counters tr:nth-of-type(${star}) td.star-num`).textContent;
                        //m2c({value:starPointText});
                        let starPoint = parseInt(starPointText.replace(/"/g, "").replace(")","").replace("(","").replace(",",""));
                        //m2c({value:starPoint});
                        starsTotal[star-1]+=starPoint;
                    }
                }

                gigsTotalOrderQueue+=thisGigTotalOrderQueue;
            }
            pagesTotalOrderQueue+=gigsTotalOrderQueue;

        }else{
            break
        }
    }
    //
    return new Promise(resolve=>{
        window.setTimeout(()=>{
            resolve({pagesTotalOrderQueue: pagesTotalOrderQueue, starsTotal: starsTotal })
        },1000)
    })
}







function addCountriesToSellerCountrySelect(){
    //add country options to seller-country select
    let sellerCountrySelect = document.querySelector('#filter_seller_country');
    state.countries.forEach((countryName)=>{
        let newOption = document.createElement('option');
        newOption.textContent = countryName;
        newOption.value = countryName;
        sellerCountrySelect.add(newOption);
    });
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
        Object.keys(viewNames).forEach((key)=>{
            if(key===exceptThat){
                document.querySelector("#"+key).style.display='block';
                document.querySelector('#currentPageCaption').textContent=viewNames[key];
            }else{
                document.querySelector("#"+key).style.display='none';
            }
    });
}






//Sending message to content side
function m2c(messageToContentSide){
    if(!state.settings.console){return false;}
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

function loadingCircle(){
    return `  <div class="preloader-wrapper big active center-block">
    <div class="spinner-layer spinner-blue-only">
      <div class="circle-clipper left">
        <div class="circle"></div>
      </div><div class="gap-patch">
        <div class="circle"></div>
      </div><div class="circle-clipper right">
        <div class="circle"></div>
      </div>
    </div>
  </div>`
}

function urlDivCreator(urlList,targetDivId){
    document.querySelector('#'+targetDivId).innerHTML= loadingCircle();
    let orderNumber=0;
    let cumulDiv=``;
    for(let oUrl of urlList){
        let poURL = oUrl.split("/");
        let fontSize = 14;
        let attachInfo = '';
        if(poURL.length>2){
            attachInfo = ` <span title="Base category: ${poURL[0]}" style="cursor: pointer;"> ~ </span>`
            oUrl = poURL[1] + "/" + poURL[2];
            fontSize = 12;
        }//<a class="waves-effect waves-light btn red"
        cumulDiv+=`<div class="row cumulDiv" id="processingURLdiv_${orderNumber}">
                        <div class="col s1 left-align">
                        ${orderNumber}
                        </div>
                        <div class="col s9" style="font-size: ${fontSize}px">  ${attachInfo} ${oUrl}</div>
                        <div class="col s2" id="processingURLPageNumber_${orderNumber}">pg:0</div>
                    </div>`;
        orderNumber++;
    }
    document.querySelector('#'+targetDivId).innerHTML=cumulDiv;
    return new Promise((res)=>{res(true)});
}


const crawlIt = async function() {
    if(!checkFirebaseConnection()){return false;}
    state.crawlStatusOrder.continue=true;
    let fC = await getCategories();
    let divCreation = await urlDivCreator(fC,'urlList');
    let orderNum = document.querySelector('#urlOrderNum').value;
    let divHeight = 25;

    for(let trackNumber = orderNum; trackNumber< fC.length; trackNumber++) {
        if(!checkFirebaseConnection()){return false}
        if(!state.crawlStatusOrder.continue){
            let quittingMessage =`Continuing process is about to complete, wait for stable done!`;
            m2c({value:quittingMessage});
            M.toast({html:`<b>${quittingMessage}</b>`});
            break;
        }
        let url2ndPart = fC[trackNumber];
        let jsonJob = await getJSON('https://www.fiverr.com/categories/' + url2ndPart, trackNumber);
        document.querySelector('#urlList').scrollTo({top: divHeight*trackNumber , behavior: 'smooth'});
        m2c({value:`${url2ndPart} json dosyasi ${jsonJob}`});
    }

};
// Hedef json sayfasindan seller verilerini ceken kisim

function getJSON(targetJSONurl,orderNum){
//https://www.fiverr.com/categories/choose-website-platform/quiz  .json olmadigindan baska sayfaya yonlendirme var
    return new Promise(async (resolve)=>{
        //--------------------------------------------
        for(let page=1; page<500;page++){
            let donen = await returnMyJson(targetJSONurl, page, orderNum);
            m2c({value:`Donen durum:${donen}`});
            if(!state.crawlStatusOrder.continue){break;}
               if(!donen){break;}
        }


        window.setTimeout(()=>{
            resolve('tamamdir')
        },3500)

        //-------------------------------------------------------
    })
}

async function returnMyJson(targetJSONurl,page, orderNum){
    ////https://www.fiverr.com/categories/choose-website-platform/quiz  .json olmadigindan baska sayfaya yonlendirme var  duz html sayfa geliyor... json yok
    let response = await fetch(targetJSONurl+'.json?page='+page);
    //m2c({value:response.status})
        if (response.status !== 200) { state['failedURLz'].push(targetJSONurl); return new Promise(res=>{res(false)});}
    let jsonData = await response.json();
    //m2c({value:jsonData});
    document.querySelector('#processingURLdiv_'+orderNum).classList.add('cumulDivActive');
    document.querySelector('#processingURLdiv_'+orderNum).classList.remove('cumulDiv');
    for(let title of jsonData.gigs){
        // FIREBASE
        saveGigToFireStore(title);
        //m2c({value:title});
        let tit = {
            Seller_Name: title.seller_name,
            Is_PRO: title.is_pro,
            Seller_created: title.seller_created_at,
            Gig_ID: title.gig_id,
            Gig_created: title.gig_created,
            Gig_updated: title.gig_updated,
            Price: title.price,
            Full_URL: targetJSONurl,
            Category: targetJSONurl.split('/')[targetJSONurl.split('/').length-1],
            PAGE: page
        };
        // json bilgisinin yansitilma isini buradan halledecegiz
        // ,orderNum
        document.querySelector('#processingURLPageNumber_'+orderNum).textContent = `pg:${page}`;
    }
    //
    if(jsonData.next_page){
        return new Promise((res)=>{
            window.setTimeout(()=>{
                res(true);
            },2000)
        })
    }else{
        return new Promise((res)=>{
            res(false);
        });
    }
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


