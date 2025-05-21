const express = require('express');
const APIRouter = express.Router();
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tokenVerifier = require('./middleware/tokenVerifier');
const Validate = require('./middleware/validate.js');
const { check } = require('express-validator');

//create a new user
APIRouter.post('/registration', check("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
    // check("first_name")
    //   .not()
    //   .isEmpty()
    //   .withMessage("You first name is required")
    //   .trim()
    //   .escape(),
    // check("last_name")
    //   .not()
    //   .isEmpty()
    //   .withMessage("You last name is required")
    //   .trim()
    //   .escape(),
    check("password", 'the password must contain 6 characters, 1 lower case letter, 1 upper case letter, 1 number and 1 symbol')
        .notEmpty()
        .isStrongPassword(),
    check("username")
        .notEmpty()
        .withMessage("username is empty")
        .isLength({ min: 3 })
        .withMessage("username must be at least 3 characters long")
        .isAlphanumeric()
        .withMessage("username must contain only letters and numbers"),
    check("phone")
        .notEmpty()
        .withMessage("Phone number is mandatory.")
        .isMobilePhone()
        .withMessage("supplied phone number isn't valid"),
    Validate,
    async (req, res) => {
        try { //forse sarebbe da fare delle custom validation per username e email
            const existingUser = await User.findOne({ username: req.body.username });
            if (existingUser) {
                return res.status(400).send({ message: "username is already taken" });
            }
            const existingEmail = await User.findOne({ email: req.body.email });
            if (existingEmail) {
                return res.status(400).send({ message: "email is already taken" });
            }
            const hashedPswd = await bcrypt.hash(req.body.password, 10);
            let user = new User({
                "username": req.body.username,
                "name": req.body.name,
                "surname": req.body.surname,
                "email": req.body.email,
                "phone": req.body.phone,
                "password": hashedPswd,
                friends: [],
                events: []
            })
            user = await user.save();
            let userid = user.id;
            res.status(201).send(`created user ${userid}`);
        } catch (error) {
            res.status(500).send({ message: error });
        }
    });

// login with email or username and password
APIRouter.post('/login',
    check("usernameOrEmail")
        .notEmpty()
        .withMessage("username or email is empty")
        .bail()
        .custom(value => {
            if (!/\S+@\S+\.\S+/.test(value) && !/^[a-zA-Z0-9]+$/.test(value)) {
                throw new Error('username or email must be a valid email or alphanumeric');
            }
            return true;
        }),
    check("password")
        .notEmpty()
        .withMessage("password is empty"),
    Validate,
    async (req, res) => {
        try {

            const { usernameOrEmail, password } = req.body;

            // Cerca utente da email o username
            const user = await User.findOne({
                $or: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            });

            if (!user) {
                return res.status(404).send({ message: `No user found with username or email ${usernameOrEmail}` });
            } else {
                // check per il match della password
                if (await bcrypt.compare(password, user.password)) {
                    const accessToken = jwt.sign(user.toJSON(), process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
                    res.cookie('token', accessToken);
                    res.status(200).send({ message: `Logged in as ${user.username}`, id: user._id });
                } else {
                    res.status(401).send({ message: "Password is incorrect." });
                }
            }
        } catch (error) {
            res.status(500).send({ message: error.toString() });
        }
    }
);

//delete a user from the db given its id
APIRouter.delete('', tokenVerifier, async (req, res) => {
    try {
        const { _id } = req.user;
        if (mongoose.isValidObjectId(_id)) {
            const user = await User.findById(_id);
            if (user) {
                await User.findByIdAndDelete(_id);
                res.status(200).send(`deleted user ${_id}`);
            } else res.status(404).send({ message: "user not found" });
        } else res.status(400).send({ message: "invalid ID" });
    } catch (error) {
        res.status(500).send({ message: `internal error: ${error}` });
    }
});

//replace user info
APIRouter.put('', tokenVerifier,
    check("username")
        .optional()
        .notEmpty()
        .withMessage("username is empty")
        .bail()
        .isLength({ min: 3 })
        .withMessage("username must be at least 3 characters long")
        .isAlphanumeric()
        .withMessage("username must contain only letters and numbers"),
    check("email")
        .optional()
        .notEmpty()
        .withMessage("email is empty")
        .bail()
        .isEmail()
        .withMessage("Enter a valid email address")
        .normalizeEmail(),
    Validate,
    async (req, res) => {
        try {
            const { _id } = req.user;
            if (mongoose.isValidObjectId(_id)) {
                const user = await User.findById(_id);
                if (user) { 
                    const newUser = req.body.username ?? user.username;
                    const newName = req.body.name ?? user.name;
                    const newSurname = req.body.surname ?? user.surname;
                    const newEmail = req.body.email ?? user.email;
                    await User.findByIdAndUpdate(_id, {
                        "username": newUser,
                        "email": newEmail,
                        "name": newName,
                        "surname": newSurname
                    });
                    res.status(200).send(`updated  user ${_id}`);
                } else res.status(404).send({ message: "user not found" });
            } else res.status(400).send({ message: "invalid ID" });
        } catch (error) {
            res.status(500).send({ message: `internal error: ${error}` });
        }
    });

//replace user password
APIRouter.put('/password', tokenVerifier,
    check("oldPassword")
        .notEmpty()
        .withMessage("old password is empty"),
    check("password", 'the password must contain 6 characters, 1 lower case letter, 1 upper case letter, 1 number and 1 symbol')
        .notEmpty()
        .withMessage("password is empty")
        .bail()
        .isStrongPassword(),
    check("passwordConfirmation")
        .notEmpty()
        .withMessage("password confirmation is empty")
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("new passwords do not match");
            }
            return true;
        }),
    Validate,
    async (req, res) => {
        try {
            const { _id } = req.user;
            if (mongoose.isValidObjectId(_id)) {
                const user = await User.findById(_id);
                if (user) {
                    if (await bcrypt.compare(req.body.oldPassword, user.password)) {
                        if (!req.body.oldPassword === req.body.password) {
                            const hashedPswd = await bcrypt.hash(req.body.password, 10);
                            await User.findByIdAndUpdate(_id, {
                                "password": hashedPswd,
                            });
                        } else res.status(400).send({ message: "new password is the same as the old one" });
                        res.status(200).send(`password updated for user ${_id}`);
                    } else res.status(401).send({ message: "old password is incorrect" });
                } else res.status(404).send({ message: "user not found" });
            } else res.status(400).send({ message: "invalid ID" });
        } catch (error) {
            res.status(500).send({ message: `internal error: ${error}` });
        }
    });

module.exports = APIRouter;