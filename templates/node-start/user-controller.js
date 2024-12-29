const bcrypt = require("bcrypt");
const db = require("../db");

class UserController {

  static async create(req, res, next) {
    let { name, email, password } = req.body;
    name = name.trim();
    let username = name;
    email = email.trim();

    password = await bcrypt.hash(password, (await bcrypt.genSalt(10)));
    let [id] = await db("users").insert({ fullname: name, username, email, password });
    req.session.cookie.maxAge = 2592000000;
    req.session.userId = id;
    await new Promise((resolve, reject) => {
      req.session.save(async (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });

    res.status(201).redirect("/app");
  }

  static async authenticate(req, res, next) {
    let { email, password } = req.body;
    email = email.trim();

    let row;
    row = await db("users").where("email", email).first();
    if (typeof row == "undefined" || !(await bcrypt.compare(password, row.password)))
      return res.status(400).render('status', { message: "Something went wrong" });
    req.session.cookie.maxAge = 2592000000;
    req.session.userId = row.id;
    await new Promise((resolve, reject) => {
      req.session.save(async (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });

    res.status(200).redirect("/app");
  }

  static async destroySession(req, res, next) {
    delete req.session.userId;
    req.session.destroy(async (err) => {
      if (err) next(err);
      res.clearCookie("sid");
      res.status(200).redirect("/");
    });
  }
}

module.exports = { UserController };