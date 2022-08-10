// getCourse()
// .then((data) => {
//   data.modules.forEach((module) => {
//     const generatedLesson = generateFromTemplate(lessonStepTemplate, '.lesson__article');
//     generatedLesson.querySelector('.lesson__step-headline').textContent = module.name;
//     generatedLesson.querySelector('.lesson__step-para').textContent = module.description;
//     courseContentDiv.append(generatedLesson);
//   });
  
// })
// console.log('yes');

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

// lessonButtonNext.addEventListener('click', (evt) => {
//     console.log(evt.target);
// });

let moduleNumber = +window.location.href[window.location.href.length - 1];
// moduleNumber += 1;
let moduleToLoad = moduleNumber;
moduleToLoad += 1;

// let finalAnchor = window.location.href[window.location.href.length - 1] = moduleToLoad.toString();
// lessonAnchorNext.href = window.location.href.replace(`/${moduleNumber}`, `/${moduleToLoad}`);