// getCourse()
// .then((data) => {
//   data.modules.forEach((module) => {
//     const generatedLesson = generateFromTemplate(lessonStepTemplate, '.lesson__article');
//     generatedLesson.querySelector('.lesson__step-headline').textContent = module.name;
//     generatedLesson.querySelector('.lesson__step-para').textContent = module.description;
//     courseContentDiv.append(generatedLesson);
//   });
  
// })

//socket io initialization

const courseKeyStartIndex = window.location.href.indexOf('courses/');
const courseKeyEndIndex = window.location.href.indexOf('/modules');
const courseKey = window.location.href.substring(courseKeyStartIndex, courseKeyEndIndex).replace('courses/', '');
// console.log(courseKey);
const moduleKeyIndex = window.location.href.lastIndexOf('/') + 1;
const moduleKey = window.location.href.substring(moduleKeyIndex, window.location.href.length);

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

chatMessageSubmitButton.addEventListener('click', (evt) => {
    evt.preventDefault();
    const objToSend = {};
    objToSend.courseId = courseKey;
    // console.log(window.location);
    objToSend.moduleId = moduleKey; 
    const formInputs = Array.from(chatForm.querySelectorAll('.lesson__div-form-input'));
    formInputs.forEach((input) => {
        objToSend[input.name] = input.value;
    });
    // console.log(objToSend);
    sendMessage(objToSend)
    .then((data) => {
        const messageToRender = generateFromTemplate(messageTemplate, '.lesson__div-ul-li');
        messageToRender.querySelector('p').textContent = data.text;
        lessonChatList.append(messageToRender);
        // lessonChatUl.
    });
});
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