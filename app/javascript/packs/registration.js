import { create } from "@github/webauthn-json";

const RegistrationForm = form => {
  const headers = getJsonHeaders();
  const infoContainer = document.getElementById("information");

  const register = async () => {
    const username = document.getElementById("username-field");

    const preparePayload = { registration: { username: username.value } };

    const prepareRequest = await fetch("/register/prepare", {
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

    const webauthnPayload = await create({
      publicKey: await prepareRequest.json()
    });

    const registerRequest = await fetch("/register", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(webauthnPayload),
      headers
    });

    if (registerRequest.ok) {
      const result = await registerRequest.json();
      infoContainer.innerHTML = result.message;
      username.value = "";
    } else {
      const result = await registerRequest.json();
      infoContainer.innerHTML = result.error;
    }
  };

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    register();
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

export { RegistrationForm };
