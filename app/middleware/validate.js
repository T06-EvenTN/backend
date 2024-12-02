//import {validationResult } from "express-validator";
const {validationResult} = require('express-validator');
function Validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let error = {};
        errors.array().map((err) => (error[err.param] = err.msg));
        return res.status(422).json({ error });
    }
    next();
};
module.exports= Validate;