//import {validationResult } from "express-validator";
const {validationResult} = require('express-validator');
function Validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = {};
        errors.array().forEach(err => {  
            if (!error[err.param]) {
                error[err.param] = []; // Inizializza un array se non esiste
            }
            error[err.param].push(err.msg);
        });
        console.log(error);
        return res.status(422).json({ error });
    }
    next();
};
module.exports= Validate;