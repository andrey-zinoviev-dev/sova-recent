// getCourse()
// .then((data) => {
// //   data.modules.forEach((module) => {
// //     const generatedLesson = generateFromTemplate(lessonStepTemplate, '.lesson__article');
// //     generatedLesson.querySelector('.lesson__step-headline').textContent = module.name;
// //     generatedLesson.querySelector('.lesson__step-para').textContent = module.description;
// //     courseContentDiv.append(generatedLesson);
// //   });


  
// })

//socket io initialization
const socket = io();

//connecting to socket from the page load
const sessionFromStorage = window.sessionStorage.getItem('session');
if(sessionFromStorage) {
    
    socket.auth = { sessionID: sessionFromStorage };
    socket.connect();
}


const courseKeyStartIndex = window.location.href.indexOf('courses/');
const courseKeyEndIndex = window.location.href.indexOf('/modules');
const courseKey = window.location.href.substring(courseKeyStartIndex, courseKeyEndIndex).replace('courses/', '');
// console.log(courseKey);
const moduleKeyIndex = window.location.href.lastIndexOf('/') + 1;
const moduleKey = window.location.href.substring(moduleKeyIndex, window.location.href.length);

//get current user
// getCurrentUser()
// .then((doc) => {
//     socket.auth = {doc: doc};
//     socket.connect();

    // return socket.on('users', (currentUsers) => {
    //     const filteredUsers = currentUsers.filter((user) => {
    //         return user.user._id !== doc._id;
    //     });

    //     filteredUsers.forEach((user) => {
    //         const generatedLiElem = generateFromTemplate(listElementTemplate, '.lesson__div-ul-li');
    //         if(doc.admin) {
    //             const generatedChat = generateFromTemplate(chatTemplate, '.lesson__div-ul-li-chat');
    //             generatedChat.querySelector('span').textContent = `Чат с ${user.user.name}`;
    //             generatedChat.querySelector('.lesson__div-form-button').addEventListener('click', (evt) => {
    //                 evt.preventDefault();
    //                 const objToSend = {};
    //                 const formInputs = Array.from(generatedChat.querySelectorAll('.lesson__div-form-input'));
    //                 formInputs.forEach((input) => {
    //                     objToSend[input.name] = input.value;
    //                 });
    //                 socket.emit('chat message', {objToSend, to: user.id});
                    
    //             }); 
    //             generatedLiElem.append(generatedChat);
    //             lessonChatsList.append(generatedLiElem);
    //             return;
    //         }
    //     });
    // })

    //emit socket event on connecting to course page
    // return socket.emit('connected to course', doc);
// });

//socket on session event from server
socket.on('session',  ({ sessionID, userID }) => {
    socket.auth = { sessionID };
    window.sessionStorage.setItem('session', sessionID);
    socket.user = userID;
});

//receive users event from server(socket.io)
socket.on('chat message', ({ content, from }) => {
    console.log('yes');
    console.log(content, from);
});

lessonDataButton.addEventListener('click', (evt) => {
    // console.log(evt.target);
    lessonDataDiv.classList.add('lesson__div_shown');
    lessonChatDiv.classList.remove('lesson__div_shown');
});

lessonChatButton.addEventListener('click', (evt) => {
    // console.log(evt.target);
    lessonDataDiv.classList.remove('lesson__div_shown');
    lessonChatDiv.classList.add('lesson__div_shown');
});

// chatMessageSubmitButton.addEventListener('click', (evt) => {
//     evt.preventDefault();
//     const objToSend = {};
//     objToSend.courseId = courseKey;
//     // console.log(window.location);
//     objToSend.moduleId = moduleKey; 
//     const formInputs = Array.from(chatForm.querySelectorAll('.lesson__div-form-input'));
//     formInputs.forEach((input) => {
//         objToSend[input.name] = input.value;
//     });
//     socket.emit('chat message', objToSend);
//     // console.log(objToSend);
//     // sendMessage(objToSend)
//     // .then((data) => {
//     //     const messageToRender = generateFromTemplate(messageTemplate, '.lesson__div-ul-li');
//     //     messageToRender.querySelector('p').textContent = data.text;
//     //     lessonChatList.append(messageToRender);
//     //     // lessonChatUl.
//     // });
// });
// chatInput.addEventListener('input', (evt) => {
//     return evt.target.value
// });

// lessonButtonNext.addEventListener('click', (evt) => {
//     console.log(evt.target);
// });

// let moduleNumber = +window.location.href[window.location.href.length - 1];
// // moduleNumber += 1;
// let moduleToLoad = moduleNumber;
// moduleToLoad += 1;

// let finalAnchor = window.location.href[window.location.href.length - 1] = moduleToLoad.toString();
// lessonAnchorNext.href = window.location.href.replace(`/${moduleNumber}`, `/${moduleToLoad}`);