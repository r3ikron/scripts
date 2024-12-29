const { ValidatorException } = require("../../lib/validator-exception");
const validator = require("validator");
const db = require("../db");

class UserValidator {

  static async create(req, res, next) {
    let { name, email, password } = req.body;
    let row;
    let e = new ValidatorException();

    if (typeof name == "undefined" || validator.isEmpty(name.trim()))
      e.addMessage("name", "Name is required");
    else {
      name = name.trim();
      row = await db.select("id").from("users").where("username", name).first();
      if (row)
        e.addMessage("name", "Name already taken");
    }

    if (typeof email == "undefined" || validator.isEmpty(email.trim()))
      e.addMessage("email", "Email is required");
    else {
      email = email.trim();
      row = await db.select("id").from("users").where("email", email).first();
      if (row)
        e.addMessage("email", "Email already connected to an account");
    }

    if (typeof password == "undefined" || validator.isEmpty(password.trim()))
      e.addMessage("password", "Password is required");

    if (e.hasErrors())
      return res.status(400).render("users/signup", { validation: e.getAllMessages() });

    next();
  }

  static async authenticate(req, res, next) {
    let { email, password } = req.body;
    let e = new ValidatorException();

    if (typeof email == "undefined" || validator.isEmpty(email.trim())) {
      e.addMessage("email", "Email is required");
    }

    if (typeof password == "undefined" || validator.isEmpty(password.trim()))
      e.addMessage("password", "Password is required");

    if (e.hasErrors())
      return res.status(400).render("users/signin", { validation: e.getAllMessages() });

    next();
  }
}

module.exports = { UserValidator };
