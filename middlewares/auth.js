const jwt = require('jsonwebtoken');

const secureRoutes = (req, res, next) => {
  //TEST PURPOSES AUTH THROGH LOCALSTORAGE
  const token = req.headers.authorization;
  // console.log(token);
  if(!token) {
    return res.status(401).send({
      message: 'Необходима авторизация'
    });
  }
  const payload = jwt.verify(token, 'Alekska_nityk');
  if(!payload) {
    return res.status(401).send({
      message: 'Необходима авторизация'
    });
  }
  req.user = payload;
  next();

  //UNCOMMENT HERE FURTHER FOR COOKIE AUTH
  // const { token } = req.cookies;

  // if(!token) {
  //   //redirect subject ot change
  //   return res.status(401).redirect('/');
  // }
  // let payload = jwt.verify(token, 'Alekska_nityk');
  // if(!payload) {
  //   return res.status(401).send({
  //     message: "Необходима авторизация",
  //   });
  // }
  // req.user = payload;
  // next();
};

module.exports = {
  secureRoutes,
}