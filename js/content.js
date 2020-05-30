console.log('Fiverr-Crawler comes...');
const failedURLz = [];
const crawlStatusOrder = {continue:true};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'runRequest':
            console.log(request.value);
            window[request.value]();
            break;
        default:
            console.log(request.value);
            break;

    }
});

function m2p(outgoingMessage){
    chrome.runtime.sendMessage(outgoingMessage,(res)=>{
        console.log(res);
    });


}

function stopCrawling(){
    crawlStatusOrder.continue=false;
}


window.crawlIt = async function() {
    crawlStatusOrder.continue=true;
    let fC = await getCategories();
    console.log('Category list handled as an array properly.');
    //console.log(fC.toString())
    let cFL = fC.length;
    let fCi = 0;

    for (url2ndPart of fC) {
        if(!crawlStatusOrder.continue){
            let quittingMessage =`Continuing process is about to complete, once done will quit!`;
            console.log(quittingMessage);
            m2p({value:quittingMessage})
            break;
        }
        let jsonJob = await getJSON('https://www.fiverr.com/categories/' + url2ndPart);
        console.log(`${url2ndPart} json dosyasi ${jsonJob}`);
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
            console.log(`Looks like there was a problem. Status Code: ${response.status}`);
            failedURLz.push(targetJSONurl);
            return new Promise((res,rej)=>{
                res(false);
            });
        }
        let res = response.json();
        res.then((o)=>{
            //istenilen veriler o altinda yeraliyor
                console.log(`
                Bu categorideki teorik  sayfa sayisi: ${o.pagination.number_of_pages}
                -------------------------------------------------------------------
                `);
                o.gigs.forEach((title)=>{
                    let tit = {
                        seller_name: title.seller_name,
                        gig_id: title.gig_id,
                        gig_created: title.gig_created,
                        gig_updated: title.gig_updated,
                        price: title.price
                    };
                    m2p({action:'crawlData', value:tit})
                });
            //
            if(o.next_page===true){
                    return new Promise((res,rej)=>{
                        window.setTimeout(()=>{
                            res(true);
                        },2500)

                    });
            }else{
                return new Promise((res,rej)=>{
                    res(false);
                });
            }
        })
    });
    jsonRequest.catch((e)=>{console.log(e)});
}












function getCategories(){
    //https://www.fiverr.com/categories/graphics-design/product-design-services/concept-development
    let boxes = document.querySelectorAll('.sitemap-box');
    let fullCategories =[];
    boxes.forEach((box)=>{
        box.querySelectorAll('.mp-categories-columns.cf').forEach((subcat)=>{
            subcat.querySelectorAll('li > a').forEach((scl)=>{
                //console.log(scl.href)
                //
                let clearUrlPart = scl.href.replace('https://www.fiverr.com/categories/','');
                clearUrlPart = clearUrlPart.replace('https://www.fiverr.com/','');
                fullCategories.push(clearUrlPart)
                //
            })
        })
    });
    return fullCategories;
}
//
//burada o nesnesinde gigs ve onunda altinda titlelar var
// console.log(`Current source url is: ${targetJSONurl}`)
// console.log(`Total page count of this url ${o.pagination.number_of_pages}`);
// console.log(`Curren page is: ${o.pagination.current_page}`);
// console.log(`This pages's first title (seller) name is: ${o.gigs[0].seller_name}`);

// o.gigs.forEach((item)=>{
//
// });
/*
gig_id
gig_created
gig_updated
gig_url
seller_id
seller_name
seller_level
seller_country
seller_country_name
seller_img
rating_count
skills
category
category_id
sub_category
sub_category_id_i
impression_data.seller_country
impression_data.listings.url
impression_data.listings.page_ctx_id
impression_data
created_date
updated_date
price
* */
////////////////////////////////////////
////////////////////////////////////////
