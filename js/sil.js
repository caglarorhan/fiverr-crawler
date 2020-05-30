let x=1;
while(x<10){
    let st=setTimeout(()=>{
        console.log(x)
        x++;
    },2000)
}
