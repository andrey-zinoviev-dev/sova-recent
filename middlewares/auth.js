const jwt = require('jsonwebtoken');

const secureRoutes = (req, res, next) => {
  const { token } = req.cookies;
  if(!token) {
    //redirect subject ot change
    return res.status(401).redirect('/');
  }
  let payload = jwt.verify(token, 'Alekska_nityk');
  if(!payload) {
    return res.status(401).send({
      message: "Необходима авторизация",
    });
  }
  req.user = payload;
  next();
};

module.exports = {
  secureRoutes,
}