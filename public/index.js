loginButton.addEventListener('click', () => {
    loginPopup.classList.add('popup_opened');
});

registerButton.addEventListener('click', () => {
    registerPopup.classList.add('popup_opened');
});

popups.forEach((popup) => {
    const objToSendToSever = {};
    popup.querySelector('.popup__close').addEventListener('click', () => {
        popup.classList.remove('popup_opened');
    });
    const popupInputs = Array.from(popup.querySelectorAll('.popup__form-input'));
    const formButton = popup.querySelector('.popup__form-button');

    if(popupInputs) {
        popupInputs.forEach((input) => {
            input.addEventListener('input', () => {
                objToSendToSever[input.name] = input.value;
            });
        });
    }

    if(formButton) {
        formButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            sendToSever(objToSendToSever, formButton.dataset.type);
        });
    }

});

// checkIfLoggedIn();
