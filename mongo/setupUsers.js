print("* Adding 'system' mongo account with 'password' as password and root priviledges");

db.createUser({
  user: "system",
  pwd: "password",
  roles: [{
    role: "dbAdmin",
    db: "rcom"
  }, {
    role: "readWrite",
    db: "rcom"
  }]
});
