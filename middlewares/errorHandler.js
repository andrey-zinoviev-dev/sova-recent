const errorHandler = (err, req, res, next) => {
  // console.log(err);
  const {codeStatus, message} = err;
  // console.log(codeStatus, message);
  res.status(codeStatus ? codeStatus : 500).send({message: message ? message : "Что-то пошло не так"});
  // console.log(err);
  // next();
}

module.exports = {
  errorHandler,
}