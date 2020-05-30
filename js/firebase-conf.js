// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCDYlEUh8-fdRdGED3nnJA3Zul4UJFVY_Y",
    authDomain: "fiverr-13a32.firebaseapp.com",
    databaseURL: "https://fiverr-13a32.firebaseio.com",
    projectId: "fiverr-13a32",
    storageBucket: "fiverr-13a32.appspot.com",
    messagingSenderId: "1034920293329",
    appId: "1:1034920293329:web:ffab41d65722cf9ad2e6f0",
    measurementId: "G-1GW21X9JQ6"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// make auth and forestore references
const auth = firebase.auth();
const db = firebase.firestore();
