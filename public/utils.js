const loginButton = document.querySelector('.header__button_login');
const registerButton = document.querySelector('.header__button_register');
const popups = Array.from(document.querySelectorAll('.popup'));
const loginPopup = document.querySelector('.popup_login');
const registerPopup = document.querySelector('.popup_register');
const loggedInHeadline = document.querySelector('.headline');
const logoutButton = document.querySelector('.content__button-logout');
const coursesDiv = document.querySelector('.content__courses');
const courseContentDiv = document.querySelector('.lesson__div');
const lessonPopup = document.querySelector('.popup_course-overview');
const lessonAnchorsList = document.querySelector('.popup__list-lessons'); 
const lessonOutput = document.querySelector('.lesson__output');
const lessonDataButton = document.querySelector('.lesson__button_data');
const lessonChatButton = document.querySelector('.lesson__button_chat');
const lessonChatDiv = document.querySelector('.lesson__div_chat');
const lessonDataDiv = document.querySelector('.lesson__div_data');
const lessonButtonNext = document.querySelector('.lesson__button-next');
const lessonAnchorNext = document.querySelector('.lesson__button-next-anchor');
const lessonChatList = document.querySelector('.lesson__div-ul_chat');
const chatForm = document.querySelector('.lesson__div-form');
const chatInput = document.querySelector('.lesson__div-form-input');
const chatMessageSubmitButton = document.querySelector('.lesson__div-form-button');

//templates
const courseTemplate = document.querySelector('#article');
const lessonStepTemplate = document.querySelector('#lesson__step');
const lessonAnchorTemplate = document.querySelector('#lesson-anchor');
const messageTemplate = document.querySelector('#chat-message');

//functions
function sendToSever(object, route) {
    return fetch(`/${route}`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
        },
        body: JSON.stringify(object),
    })
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        //later process errors during login if any
        if(route === 'login') {
            localStorage.setItem('loggedIn', true);
            return redirectToLoggedInPage();
        }
    })
}

function getCurrentUser() {
    return fetch('/currentUser')
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        console.log(data);
    })
}

function logout() {
    return fetch('/byebye')
}

function checkIfLoggedIn() {
    const loggedIn = localStorage.getItem('loggedIn');
    if(!loggedIn) {
        return window.location.replace('/')
    }
    // redirectToLoggedInPage();
}

function redirectToLoggedInPage() {
    return window.location.replace('/courses');
}

function getCourses() {
    return fetch('/coursesList')
    .then((res) => {
        return res.json();
    })
}

function sendMessage(message) {
    return fetch('/messages', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    })
    .then((data) => {
        return data.json();
    })
};

function generateFromTemplate(template, selector) {
    return template.content.cloneNode(true).querySelector(selector);
}

function clickCourseButton(course) {
    // console.log(course);
    course.modules.forEach((courseModule) => {
        const anchorGenerated = generateFromTemplate(lessonAnchorTemplate, '.popup__list-lessons-element');
        anchorGenerated.querySelector('a').href = `${window.location.href}/${course._id}/modules/${courseModule._id}`;
        anchorGenerated.querySelector('.popup__list-lessons-element-button').textContent = courseModule.name;
        lessonAnchorsList.append(anchorGenerated);
        lessonPopup.classList.add('popup_opened');
    });
    // console.log(course);
    // modules.forEach((element) => {
    //     // console.log(element);
    //     const anchorGenerated = generateFromTemplate(lessonAnchorTemplate, '.popup__list-lessons-element');
    //     // console.log(`window.location`);
    //     // anchorGenerated.querySelector('a').href = `${window.location.href}/${course._id}/modules/${index}`;
    //     // anchorGenerated.querySelector('.popup__list-lessons-element-button').textContent = element.description;
    //     lessonAnchorsList.append(anchorGenerated);
    //     lessonPopup.classList.add('popup_opened');
    // })
    // return window.location.href = `${window.location.origin}/courses/${parameter}`
}