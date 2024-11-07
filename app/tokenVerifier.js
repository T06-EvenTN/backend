const jwt = require('jsonwebtoken');

function tokenVerifier(req, res, next){
  try{
    const jwtRequest = req.headers['authorization'];
    const jwToken = jwtRequest.split(' ')[1];
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
  } catch(error){}
}

module.exports = tokenVerifier;