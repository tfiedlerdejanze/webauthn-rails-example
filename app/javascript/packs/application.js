window.onload = function() {
  const regFormEl = document.getElementById("registration-form");
  const logFormEl = document.getElementById("login-form");

  if (Boolean(regFormEl)) {
    const { RegistrationForm } = require("packs/registration");
    RegistrationForm(regFormEl);
  }

  if (Boolean(logFormEl)) {
    const { LoginForm } = require("packs/login");
    LoginForm(logFormEl);
  }
};
