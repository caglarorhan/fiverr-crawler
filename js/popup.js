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
state['freshCategories']={refreshDate:minutesNow, categoryList:[], bestBefore:60};
state['firebaseConfig'] = {};
state['settings']={console:true, toast:true};
state['sellerLevels']={"level_one_seller": {title: "Level One", switch:false}, "level_two_seller": {title:"level Two", switch: false}, "na": {title:"New Seller", switch:false}, "top_rated_seller":{title: "Top Rated", switch:false}};
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


function saveGigToFireStore(gG,documentName,statusIndicatorId){
    if(!checkFirebaseConnection()){
        M.toast({html:`Firebase db couldn't initiate! Quitting`});
        state.firebaseConfig.continue =false;
        return false;
    }
    fF.db.collection(documentName).add(gG)
        .then(function() {
            document.querySelector('#'+statusIndicatorId).textContent=`Saved!`; //savingInfo
            window.setTimeout(()=>{
                document.querySelector('#'+statusIndicatorId).textContent=`Done!`; //savingInfo
            },200)
        })
        .catch(function(error) {
            document.querySelector('#'+statusIndicatorId).textContent=`Error!`;
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


//?ref=seller_level%3Atop_rated_seller%2Clevel_two_seller%7Cseller_language%3Aen%2Cur%2Cbn%7Cseller_location%3ACA%2CDE%2CUS
//?ref=seller_level:top_rated_seller,level_two_seller|seller_language:en,ur,bn|seller_location:CA,DE,US


async function totalLoad(){
    let settingsTab = M.Tabs.init(document.querySelector('#settingTabs'));
    let queryTab = M.Tabs.init(document.querySelector('#queryTabs'));
    let datePicker = M.Datepicker.init(document.querySelectorAll('.datepicker'),{autoClose:true,format:'yyyy-mm-dd', }); //2020-05-10
    //-first add countries to select options
    addCountriesToSellerCountrySelect();
    let allSelects = M.FormSelect.init(document.querySelectorAll('select'), {});
    // modal initiate
    let modals = M.Modal.init(document.querySelectorAll('.modal'), {});
    //floating button init
    let floatingButtons = M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn'), {
        direction: 'left',
        hoverEnabled: false
    });
    //



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
        m2c({value:fC})
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
        let orderQueTotals = await urlRequester(fC);
        orderQueTotals='DateCollected, Category URL, Gig URL, Seller Id, Seller Name, Order Que, 5 Star, 4 Star, 3 Star, 2 Star, 1 Star' +'\n' +orderQueTotals;
        locSt.setItem('orderQueueData',orderQueTotals);
        pushToDownloadTextFile(orderQueTotals);
    });


    // reports floating button click
    document.querySelector('#reportsDownloadCsvFileButton').addEventListener('click',()=>{
        pushToDownloadTextFile(locSt.getItem('orderQueueData'));
    });

    //CrawlSetting Div
    //crawlSettingsDiv
    let cSetDiv = document.querySelector('#crawlSettingsDiv');
    let aRow = gimmeAnElement('div',12);
    let aForm = gimmeAnElement('form',12,['col','s12']);
    aRow.append(aForm);
    cSetDiv.append(aRow);
    let formRow = gimmeAnElement('div',12);
    aForm.append(formRow);
    //
    Object.entries(state.sellerLevels).forEach(([key,val])=>{
        formRow.innerHTML += `
        <label>
            <input type="checkbox" class="filled-in" id="sellerLevel_${val.value}" value="${key}" ${!val.switch?'':'checked="checked"'}"/>
            <span>${val.title}</span>
        </label>`;
    });

    let getCategoriesCall = await getCategories();

        let autoCompleteCategoryDataSource = Object.fromEntries(new Map(state.freshCategories.categoryList.map(item=>[item,null])));
        //m2c({value:autoCompleteCategoryDataSource});
        let autoCompleteCategoryList = M.Autocomplete.init(document.querySelector('#beginningCategoryInput'), {data:autoCompleteCategoryDataSource, onAutocomplete:()=>{
                // couldnt got because of promise
            }});


    //crawlsettings button
    document.querySelector('#crawlSettingsButton').addEventListener('click',()=>{

        });



// total load sonu
}





function gimmeAnElement(tagName='div', gridSize=12, classes=['row']){
    let newDiv = document.createElement(tagName);
    classes.push('s'+gridSize);
    newDiv.classList.add(...classes);
    return newDiv;
}



async function urlRequester(fC){
    let totalUrlValues='';
    let divHeight = 25;
    for(let orderNum=0; orderNum<fC.length; orderNum++){ //her temel url buradan giriyor
        document.querySelector('#processingURLdiv_'+orderNum).classList.remove('cumulDiv');
        document.querySelector('#processingURLdiv_'+orderNum).classList.add('cumulDivActive');
        document.querySelector('#processingURLPageNumber_'+orderNum).textContent=`process`;
        document.querySelector('#reports').scrollTo({top: divHeight*orderNum , behavior: 'smooth'});
        let urlData = await sumQueue('https://www.fiverr.com/categories/'+fC[orderNum]+'?ref=seller_level%3Atop_rated_seller', fC[orderNum], orderNum);
        // m2c({value:fC[orderNum]});
        // m2c({value:urlData});
        totalUrlValues+=urlData.rowDataBatch;
        // toplamlari satirlara yazdir burada
        //{pagesTotalOrderQueue: pagesTotalOrderQueue, starsTotal: starsTotal }
        document.querySelector('#processingURLPageNumber_'+orderNum).textContent = urlData.pagesTotalOrderQueue;
        document.querySelector('#processingURLPageNumber_'+orderNum).title = urlData.starsTotal.toString();
    }
return new Promise(resolve=>{
    resolve(totalUrlValues)
})
}



async function sumQueue(targetHTMLurl, categoryURL,orderNum){
    let rowDataBatch=``;
    let pagesTotalOrderQueue = 0;
    let starsTotal = [0,0,0,0,0];
    //  url yi fetch et page=1 olarak request yap
    m2c({value:`
    ------------------------(*)
    KOK URL: ${targetHTMLurl}
    ------------------------
    `});
    for(let page=1; page<200; page++){
        let response = await fetch(targetHTMLurl+'&page='+page); // 48 gig ve altinda paging olan sayfa gelecek
        m2c({value:`Sunucu cevabi: ${response.status}`});
        if (response.status !== 200) {page = 200; break;}
        let tempHTML = await response.text();
        if(tempHTML.indexOf('error-page')>-1){page=200; break}
        m2c({value:`URL:${targetHTMLurl+'&page='+page}`});
        //m2c({value:tempHTML});
        //m2c({value:tempHTML})
        let tmp = JSON.parse(tempHTML.split('initialData.search_perseus = ')[1].split(';\n' +
            '  </script>')[0]);
        if(tmp.listings && !tmp.tracking.error){
            // sayfa son sayfa degil devam
            let gigSize = tmp.listings[0].gigs.length;//48 donecek
            if(gigSize<48){page=200}
            //m2c({value:gigSize})
            let gigsTotalOrderQueue=0;
            for(let order = 0; order<gigSize; order++){
                let thisGigTotalOrderQueue = 0;
                // gigs icindeki her nesne icin gig_url urlsine gidilecek
                // "https://www.fiverr.com" + tmp.listings[0].gigs[order]
                m2c({value:tmp.listings[0].gigs[order].gig_url});

                let gigPage = await (()=>{
                    return new Promise((resolve,reject)=>{
                        window.setTimeout(()=>{
                            resolve(fetch("https://www.fiverr.com" + tmp.listings[0].gigs[order].gig_url))
                        },4000)
                    })
                })();
                m2c({value:`Gigpage Sunucu cevabi:${gigPage.status}`});
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

                        starsTotal[star-1]+=starPoint;
                    }
                    m2c({value:thisGigTotalOrderQueue +'/'+starsTotal.toString()});
                }

                gigsTotalOrderQueue+=thisGigTotalOrderQueue;
                //add new gig data into csv
                m2c({value:`Seller: ${tmp.listings[0].gigs[order].seller_name}`});
                m2c({value:`Seller: ${tmp.listings[0].gigs[order].seller_id}`});
            //adding data to csv here. CSV schema
                let theDate = new Date();
                let todayIs = `${theDate.getMonth()}/${theDate.getDate()}/${theDate.getFullYear()}`;
                // DateCollected, Category URL,Targetted URL, Gig URL, Seller Id, Seller Name, 5 Star, 4 Star, 3 Star, 2 Star, 1 Star
                rowDataBatch+= `${todayIs}, ${categoryURL}, ${tmp.listings[0].gigs[order].gig_url}, ${tmp.listings[0].gigs[order].seller_id}, ${tmp.listings[0].gigs[order].seller_name}, ${thisGigTotalOrderQueue}, ${starsTotal.toString()}`+'\n';
                //firebase
                let dailyIndividualGigQueueDataJson = {
                    dateCollected: todayIs,
                    categoryUrl: categoryURL,
                    gigUrl: tmp.listings[0].gigs[order].gig_url,
                    sellerId: tmp.listings[0].gigs[order].seller_id,
                    sellerName: tmp.listings[0].gigs[order].seller_name,
                    thisGigTotalOrderQueue: thisGigTotalOrderQueue,
                    reviewStars: starsTotal
                };
                saveGigToFireStore(dailyIndividualGigQueueDataJson,'dailyIndividualGigQueueData','processingURLPageNumber_'+orderNum)
            }
            pagesTotalOrderQueue+=gigsTotalOrderQueue;

        }else{
            page=200; break
        }
    }
    //
    return new Promise(resolve=>{
        window.setTimeout(()=>{
            resolve({pagesTotalOrderQueue:pagesTotalOrderQueue, starsTotal:starsTotal, rowDataBatch:rowDataBatch})
        },2000)
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
        if(tabs[0].url.toString().indexOf('fiverr.com')>-1){
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
        //M.toast({html:'State is modified...'});
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
    //m2c({value:urlList});
    for(let oUrl of urlList){
        //m2c({value:oUrl})
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
        saveGigToFireStore(title,'gigs','savingInfo');
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
    m2c({value:'getcategories fired'});
    let minutesNow = Math.floor(new Date().getTime() / 60000);
    // TODO:'Category list fressness mantigi hatali debug edilecek'
    // if(state && (minutesNow-state.freshCategories.refreshDate)<state.freshCategories.bestBefore){
    //     m2c({value:'state.freshCategories daha taze, yeniden cekilmeyecek'})
    //     return new Promise(resolve=>{
    //             resolve(state.freshCategories.categoryList);
    //     });
    // }

    let fetchPage = await (()=>{
        return new Promise((resolve,reject)=>{
            window.setTimeout(()=>{
                resolve(fetch("https://www.fiverr.com/categories"))
            },4000)
        })
    })();
    let pageSrc= await fetchPage.text();
    //m2c({value:pageSrc});
    let domParser = new DOMParser();
    let doc = domParser.parseFromString(pageSrc, "text/html");
    let boxes = doc.querySelectorAll('.sitemap-box');
    let fullCategories =[];
    boxes.forEach((box)=>{
        box.querySelectorAll('.mp-categories-columns.cf').forEach((subcat)=>{
            subcat.querySelectorAll('li > a').forEach((scl)=>{
                //m2c({value:scl.href});
                let clearUrlPart = scl.href.toString().split("/categories/")[1];
                //m2c({value:clearUrlPart});
                if(clearUrlPart!==null && clearUrlPart!==undefined && clearUrlPart!=='') fullCategories.push(clearUrlPart)
                //
            })
        })
    });

    stateModifier({'freshCategories':{refreshDate:minutesNow, categoryList:fullCategories}});
    //m2c({value:state.freshCategories.categoryList});
    return await new Promise(resolve=>{
        setTimeout(()=>{
            resolve(state.freshCategories.categoryList);
        },1000);
    });
}



//


