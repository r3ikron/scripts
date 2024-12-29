const { Router } = require('express');
const router = module.exports = Router();
const { UserController } = require("./controllers/user-controller");
const { UserValidator } = require("./validators/user-validator");

router.get('/signup/', async (req, res) => res.render('users/signup'))
router.post('/signup/', UserValidator.create, UserController.create)
router.get('/signin', async (req, res) => res.render('users/signin'))
router.post('/signin', UserValidator.authenticate, UserController.authenticate)
router.get('/logout/', UserController.destroySession)
