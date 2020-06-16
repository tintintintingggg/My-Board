// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAfuyziA7vt2MLLP7DCntAek_GosLmoVk",
    authDomain: "my-board-43140.firebaseapp.com",
    databaseURL: "https://my-board-43140.firebaseio.com",
    projectId: "my-board-43140",
    storageBucket: "my-board-43140.appspot.com",
    messagingSenderId: "753765735397",
    appId: "1:753765735397:web:fe7a47075438d404bb6d0c",
    measurementId: "G-27V9T2MD22"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const db = firebase.firestore();
let userCredential = null;

// login & signup fumction

const logIn = document.getElementById('log-in');
const signUp = document.getElementById('sign-up');
const signUpBlock = document.getElementById('sign-up-block');
const logInBlock = document.getElementById('log-in-block');
const signUpSubmitButton = document.getElementById('sign-up-submit-button');
const logInSubmitButton = document.getElementById('log-in-submit-button');
const helloMeassage = document.getElementById('hello-message');
const personalComment = document.getElementById('personal');
const commentSubmitButton = document.getElementById('comment-submit-button');
const boardContainer = document.getElementById('container');
const logOutButton = document.getElementById('log-out');
let userData = {};

signUp.addEventListener('click', function(){
    if(signUpBlock.style.display === 'none'){
        signUpBlock.style.display = 'block';
        logInBlock.style.display = 'none';
    }else {
        signUpBlock.style.display = 'none';
        logInBlock.style.display = 'none';
    } 
})
logIn.addEventListener('click', function(){
    if(logInBlock.style.display === 'none'){
        logInBlock.style.display = 'block';
        signUpBlock.style.display = 'none';
    }else {
        logInBlock.style.display = 'none';
        signUpBlock.style.display = 'none';
    }
})

// 建立會員系統：
// 使用者輸入 Email、密碼、暱稱，註冊帳號。
let member = {};
signUpSubmitButton.addEventListener('click', function(){
    member = {
        username: document.getElementById('signup-username').value,
        email: document.getElementById('signup-email').value,
        passwords: document.getElementById('signup-passwords').value
    };
    firebase.auth().createUserWithEmailAndPassword(member.email, member.passwords)
    .then((cred) => {
        console.log(cred);
        userCredential = cred;
    }).catch(function(err){
        // 註冊失敗時顯示錯誤訊息
        console.log(err.message);
    });
})

// 使用者輸入 Email、密碼，登入系統。

logInSubmitButton.addEventListener('click', function(){
    member = {
        email: document.getElementById('login-email').value,
        passwords: document.getElementById('login-passwords').value
    }
    firebase.auth().signInWithEmailAndPassword(member.email, member.passwords)
    .then((cred) => {
        console.log(cred);
        userCredential = cred;
        let currentUser = firebase.auth().currentUser;
        // user is logged in
        if(currentUser){
            console.log('You are logged in!');
        }
    })
    .catch((error) => {
      console.log(error.message);
    });
})

// 登出
logOutButton.addEventListener('click', function(){
    firebase.auth().signOut().then((cred) => {
        console.log(cred);
        userCredential = cred;
        alert('已登出');
        window.location.reload();
      })
})


commentSubmitButton.addEventListener('click', () => {
    db.collection('members').doc(userData.id).get()
    .then((doc) => {
        if (doc.exists) {
            userData.username = doc.data().username;
            userData.email = doc.data().email;
            let inputTitle = document.getElementById('my-title');
            let inputText = document.getElementById('my-text');
            let date = new Date();
            let now = (date.getMonth()+1)+'/'+date.getDate()+' '+date.getHours()+':'+date.getMinutes();
            let millisecond = date.getTime();
            let newComment = {
                username: userData.username,
                time: now,
                title: inputTitle.value,
                text: inputText.value,
                userId: userData.id,
                millisecond: millisecond
            }
            db.collection('comments').doc(millisecond.toString()).set(newComment)
            .then(() => console.log('comment is set'))
            .catch(() => console.log('uploading comment is fail'))
        }else {
            // doc.data() will be undefined in this case
            console.log("No document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
})

function checkAuthStatus(){
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            personalComment.style.display = 'block';
            userData.id = user.uid;
            helloMeassage.innerText = (`Hello! ${user.email}`);
            if(userCredential !== null){
                if(userCredential.additionalUserInfo.isNewUser){
                    db.collection('members').doc(user.uid).set(member)
                    .then(function(){
                        console.log('User created successfully');
                    })
                    .catch(function(e){
                        console.log("error", e);
                    });
                }
            }
        } else{
          helloMeassage.innerText = ('Log In to Comment Below!');
        }
    });
}

function createComments(createUsername, createTime, createTitle, createText, userId){
    let comment = appendElement('div', 'comment', boardContainer);
    let profile = appendElement('div', 'profile', comment);
    let profileImg = appendElement('img', 'img', profile);
    profileImg.src = "user.png";
    let username = appendElement('div', 'name', comment);
    username.innerText = createUsername;
    username.setAttribute("data-key", userId)
    let title = appendElement('div', 'title', comment);
    title.innerText = createTitle;
    let text = appendElement('div', 'text', comment);
    text.innerText = createText;
    let time = appendElement('div', 'time', comment);
    time.innerText = createTime;
    let addFriendBlock = appendElement('div', 'add-friend-block', comment);
    addFriendBlock.innerText = 'Add Friend!';
    addFriends(username, addFriendBlock);
}

function appendElement(e, name, parentElement){
    let newElement = document.createElement(e);
    newElement.className = name;
    parentElement.appendChild(newElement);
    return newElement;
}

db.collection("comments")
.onSnapshot(function(docs) {
    docs.docChanges().forEach(function(change) {
        if (change.type === "added") {
            // console.log("new comment", change.doc.data());
            // console.log("new comment", change.doc.data().userId);
            createComments(change.doc.data().username, change.doc.data().time, change.doc.data().title, change.doc.data().text, change.doc.data().userId);
        
        }
    })
});


let friendsArr = [];
let currentUserId;
let clickedUserId;
function addFriends(name, addFriendBlock){
    name.addEventListener('mouseover', function(){
        addFriendBlock.style.display = 'block';
    })
    name.addEventListener('mouseout', function(){
        addFriendBlock.style.display = 'none';
    })

    name.addEventListener('click', function(){
        currentUserId = firebase.auth().currentUser.uid;
        clickedUserId = name.getAttribute('data-key');
        // console.log(currentUserId, clickedUserId);
        db.collection('members').doc(currentUserId).get().then(function(doc) {
            if (doc.exists) {
                if(doc.data().friends !== undefined){
                    console.log('不是undefined')
                    friendsArr = doc.data().friends;
                    console.log(friendsArr);
                    let isOldFriend = false;
                    for(var i = 0; i<friendsArr.length; i++){
                        console.log(friendsArr[i]);
                        console.log(clickedUserId);
                        if(friendsArr[i] === clickedUserId){
                            isOldFriend = true;
                            break;
                        }
                    }
                    if(isOldFriend === false){
                        friendsArr.push(clickedUserId);
                        db.collection('members').doc(currentUserId).set({
                            friends: friendsArr
                        },
                        { merge: true }).then(() => {console.log('friend is add.')}).catch(() => {console.log('fail to add friend')})
                    }
                }else {
                    console.log('undefined')
                    friendsArr = [];
                    friendsArr.push(clickedUserId);
                    db.collection('members').doc(currentUserId).set({
                        friends: friendsArr
                    },
                    { merge: true }).then(() => {console.log('friend is add.')}).catch(() => {console.log('fail to add friend')})
                }
                console.log('done')
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
            let myFriendArr;
            db.collection('members').doc(currentUserId).get().then(() => {
                if(doc.exists){
                    // console.log(doc.data().friends);
                    myFriendArr = doc.data().friends;
                }
                for(var i = 0; i<myFriendArr.length; i++){
                    let nowFriend = '';
                    nowFriend = myFriendArr[i];
                    db.collection('members').doc(nowFriend).get()
                    .then((fri) => {
                        // console.log(nowFriend);
                        // console.log(fri.data().username);
                        alert('你有朋友：'+fri.data().username);
                    }).catch(() => {
                        console.log('no friend data');
                    })
                }
            }).catch((error) => {
                console.log("Error getting friends' document:", error);
            })  
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    })
}


window.onload = function(){
    console.log('window is loading');
    checkAuthStatus();
}