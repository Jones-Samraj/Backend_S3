const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.createUser = (user, callback) => {
  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) return callback(err);

    db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [user.email, hash],
      callback
    );
  });
};
