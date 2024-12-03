const jwt = require('jsonwebtoken');

function tokenVerifier(req, res, next){
  try{
    const jwToken = req.cookies.token;
    if(!jwToken){
      res.status(401).send({message: "invalid or absent token"});
    } else {
      jwt.verify(jwToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){
          res.status(403).send({message: "authentication failed"});
        } else{
          req.user = user;
          next();
        }
      });
    }
  } catch(error){
    res.clearCookie("token");
  }
}

module.exports = tokenVerifier;