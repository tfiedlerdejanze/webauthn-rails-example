import { get } from "@github/webauthn-json";

const loginSuccessMsg = "You successfully logged in, ";
const loginErrorMsg = "Oh no, something went terribly wrong.";

const LoginForm = form => {
  const headers = getJsonHeaders();
  const infoContainer = document.getElementById("information");

  const login = async () => {
    const username = document.getElementById("username-field");

    const preparePayload = { login: { username: username.value } };

    const prepareRequest = await fetch("/login/prepare", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(preparePayload),
      headers
    });

    if (!prepareRequest.ok) {
      const result = await prepareRequest.json();
      infoContainer.innerHTML = result.error;
      return;
    }

    const webauthnPayload = await get({
      publicKey: await prepareRequest.json()
    });

    const loginRequest = await fetch("/login", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(webauthnPayload),
      headers
    });

    if (loginRequest.ok) {
      const result = await loginRequest.json();
      infoContainer.innerHTML = result.message;
      username.value = "";
    } else {
      const result = await loginRequest.json();
      infoContainer.innerHTML = result.error;
    }
  };

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    login();
  });
};

// helper methods

const getCsrfToken = () => {
  const csrfTag = document.querySelector('meta[name="csrf-token"]');
  if (!csrfTag) return null;

  return csrfTag.getAttribute("content");
};

const getJsonHeaders = () => ({
  "x-csrf-token": getCsrfToken(),
  "content-type": "application/json",
  accept: "application/json"
});

export { LoginForm };
