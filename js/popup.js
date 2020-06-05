//////////////////////////////////////////////////////////////////////////////
const state = {};
const locSt = window.localStorage;
const fF = {};
const minutesNow = Math.floor(new Date().getTime() / 60000);
state['tabData']='';
state['viewList'] = {};
state['failedURLz']=[];
state['crawlStatusOrder']={continue:true};
state['crawlStatusChangerButton'] = {position:true}
state['freshCategories']={refreshDate:minutesNow, categoryList:[]};
state['firebaseConfig'] = {};
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

    //reportsButton
    document.querySelector('#reportsButton').addEventListener('click',()=>{
        document.querySelector('#reports').innerHTML = gimmeReport();
    })

    // getURL list
    document.querySelector('#getTheCategoryURLzButton').addEventListener('click',async ()=>{
        let fC = await getCategories();
        let divCreation = await urlDivCreator(fC);
    })


// total load sonu
}


function gimmeReport(){
    m2c({value:'Not tested because of quota problems.'});
    // fF.db.collection('gigs').get().then(function(snapshot) {
    //     //m2c({value:snapshot.doc.seller_name});
    // });
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


function urlDivCreator(urlList){
    document.querySelector('#urlList').innerHTML='';
    let orderNumber=0;
    for(let oUrl of urlList){
        let poURL = oUrl.split("/");
        let fontSize = 14;
        let attachInfo = '';
        if(poURL.length>2){
            attachInfo = ` <span title="Base category: ${poURL[0]}" style="cursor: pointer;"> ~ </span>`
            oUrl = poURL[1] + "/" + poURL[2];
            fontSize = 12;
        }//<a class="waves-effect waves-light btn red"
        let cumulDiv=`<div class="row cumulDiv" >
                        <div class="col s1 left-align">
                        ${orderNumber}
                        </div>
                        <div class="col s9" style="font-size: ${fontSize}px">  ${attachInfo} ${oUrl}</div>
                        <div class="col s2" id="processingURLPageNumber_${orderNumber}">pg:0</div>
                    </div>`;
        document.querySelector('#urlList').innerHTML+=cumulDiv;
        orderNumber++;
    }
    return new Promise((res)=>{res(true)});
}


const crawlIt = async function() {
    if(!checkFirebaseConnection()){return false;}
    state.crawlStatusOrder.continue=true;
    let fC = await getCategories();
    let divCreation = await urlDivCreator(fC); // urllerin divleri olusturuldu
    let orderNum = document.querySelector('#urlOrderNum').value;
    let divHeight = 25;

    for(let trackNumber = orderNum; trackNumber< fC.length; trackNumber++) {
        if(!checkFirebaseConnection()){return false}
        if(!state.crawlStatusOrder.continue){
            let quittingMessage =`Continuing process is about to complete, once done will quit!`;
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

    return new Promise(async (resolve)=>{
        //--------------------------------------------
        for(let page=1; page<500;page++){
            let donen = await returnMyJson(targetJSONurl, page, orderNum);
            //m2c({value:`Donen durum:${donen}`});
            if(!state.crawlStatusOrder.continue){break;}
               if(!donen){break}
        }


        window.setTimeout(()=>{
            resolve('tamamdir')
        },3500)

        //-------------------------------------------------------
    })
}

async function returnMyJson(targetJSONurl,page, orderNum){
    let response = await fetch(targetJSONurl+'.json?page='+page);
    let jsonData = await response.json();
    //m2c({value:jsonData});

        if (response.status !== 200) { state['failedURLz'].push(targetJSONurl); return new Promise(res=>{res(false)});}

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


