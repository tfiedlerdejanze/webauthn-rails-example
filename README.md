# webauthn-rails-example

This is a minimal example demoing the WebAuthn API with ruby-on-rails. While the client-side part takes minimal advantage of rails default webpack configuration, it is by intention not bound to any framework and tries to be easily understandable for everyone.
We will not find clean nor DRY code in this repository :)

#### prerequisites

* rails 5 or 6 installed
* up to date chrome or firefox browser
* basic knowledge of javascript
* basic knowledge of ruby
* authenticator (fido2 key or fingerprint scanner)

## Workshop Chapters

* [Create a new rails application](#create-app)
* [Add and configure dependencies](#create-app)
* [Add a User model](#user-model)
* [Add a Registration controller](#registration-controller)
* [Add a Registration view](#registration-view)
* [Handle the form submission](#registration-submit)
* [Configure routes and load assets](#routes-and-assets)

<a name="create-app"></a>
##### 1) Create a rails app & install dependencies. [view commit](https://github.com/ucwaldo/webauthn-rails-example/commit/58631982d8108eff5297ff526a19247f20e07183)

```
$ rails new webauthn-rails-example
$ cd webauthn-rails-example
$ bundle add webauthn
$ yarn add @github/webauthn-json
```

Create `config/initializers/webauthn.rb` with following required configuration:

```
WebAuthn.configure do |config|
  config.origin = ENV["WEBAUTHN_ORIGIN"] || "http://localhost:3000"
  config.rp_name = "WebAuthn Example"
end
```

<a name="user-model"></a>
##### 2) Add a User model and add simple validation. [view commit](https://github.com/ucwaldo/webauthn-rails-example/commit/1c4f046aa8d3d806c0c6eb1e7042aff63dcfa788)

```
$ rails g model User username user_id:binary public_key:binary sign_count:integer
```

Edit `app/models/user.rb` so it looks similar to:

```
class User < ApplicationRecord
  validates :username, uniqueness: true, presence: true
end
```

<a name="registration-controller"></a>
##### 3) Create a controller for the user registration. [view commit](https://github.com/ucwaldo/webauthn-rails-example/commit/888f1755c687cc36cd7f2016e3adee1582ecf14d#diff-416195ddccbd18a6ce41d5306501765a)

```
$ rails g controller RegistrationsController new
```

Edit  `app/controllers/registrations_controller.rb` and add the two endpoints we'll need for the registration. One prepares the WebAuthn credential challenge and options, the other one validates the authenticity of the request with the public key that is stored on the authenticator and creates the user record. Here is a minimal version of the controller, for a more detailed one, see the commit above or check the [demo file](https://github.com/ucwaldo/webauthn-rails-example/blob/master/app/controllers/registrations_controller.rb).

```
class RegistrationsController < ApplicationController
  def prepare
    options = WebAuthn::Credential.options_for_create(
      user: {
        id: WebAuthn.generate_user_id,
        name: params[:username]
      }
    )

    session[:registration_challenge] = options.challenge

    render json: options
  end

  def create
    c = WebAuthn::Credential.from_create(params[:registration])
    c.verify(session[:registration_challenge])

    User.create({
      username: params[:username],
      user_id: c.id,
      public_key: c.public_key,
      sign_count: c.sign_count,
    })
    
    render json: {message: "Registration success"}
  end
end

```

<a name="registration-view"></a>
##### 4) Create a form for the user registration. [view commit](https://github.com/ucwaldo/webauthn-rails-example/commit/888f1755c687cc36cd7f2016e3adee1582ecf14d#diff-912bd5d5dfc6399d7f01f86777fae54c)

Edit  `app/views/registrations/new.html.erb`. As we dont ask for much typed input from the user, this one is short. Feel free to throw in some divs or css to make it look bearable or use the [stylesheets](https://github.com/ucwaldo/webauthn-rails-example/tree/master/app/assets/stylesheets) from the demo.

```
<h1>Register</h1>

<%= form_with scope: :registration, id: "registration-form" do |form| %>
  <%= form.label :username, "Enter a username:" %>
  <%= form.text_field :username, required: true, id: "username-field", autocomplete: 'off' %>
  <%= form.submit "Register" %>
<% end %>
```

<a name="registration-submit"></a>
##### 5) Handle the form submit. [view commit](https://github.com/ucwaldo/webauthn-rails-example/commit/888f1755c687cc36cd7f2016e3adee1582ecf14d#diff-412764e518970a051276c4f1a2355997)

It's time to consume our previously created endpoints, so we'll create a file `app/javascripts/packs/registration.js` in which we'll handle the form submission.  We first need to request the credential options and challenge providing only a username and sign those with an [authenticatior](https://www.w3.org/TR/webauthn/#authenticator) connected via the `navigator` browser api. The result of this process is sent back to the registration endpoint, verified by the initial challenge and a user record gets created. In JavaScript words this is quite a lot, so we try to keep it minimal again and you can check out the commit above or view the [demo file](https://github.com/ucwaldo/webauthn-rails-example/blob/master/app/javascript/packs/registration.js). Now is also time to note that the npm package [@github/webauthn-json](https://github.com/github/webauthn-json) we use here, is a *WebAuthn API wrapper that translates to/from pure JSON using base64url* which essentially wraps the `navigator.credentials.{get, create}` api for us and saves us from manually encoding the credential parameters.

<small>We added some comments in places where you might want to check the result of a request or give the user some feedback on what is happening.</small>

```
import { create } from "@github/webauthn-json";

const getHeaders = () => {
  "accept": "application/json",
  "content-type": "application/json",
  "x-csrf-token": document.querySelector('meta[name="csrf-token"]')
                          .getAttribute('content'),
}

const RegistrationForm = form => {
  const register = async () => {
    const headers = getJsonHeaders();
    const username = document.getElementById("username-field");

    const preparePayload = { registration: { username: username.value } };

    const prepareRequest = await fetch("/register/prepare", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(preparePayload),
      headers
    });
	
    // here
	
    const webauthnPayload = await create({
      publicKey: await prepareRequest.json()
    });
    
    const payload = Object.assign({}, webauthnPayload, {username: username.value})

    const registerRequest = await fetch("/register", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(payload),
      headers
    });

    // here
  };

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    register();
  });
};

window.onload = function() {
  const form = document.getElementById("registration-form");
  if (form) {
    RegistrationForm(form);
  }
};
```

<a name="routes-and-assets"></a>
##### 6) Configure routes and load assets. [view commit](https://github.com/ucwaldo/webauthn-rails-example/blob/master/config/routes.rb)

To make this hopefully understandable mess from the previous step work, we must do a couple of things, like mapping our controller actions to actual routes, load the javascript file we added and remove turbolinks which are a bit in the way of our straight forward client side implementation.

Edit [`config/routes.rb`](https://github.com/ucwaldo/webauthn-rails-example/blob/master/config/routes.rb) so it looks like this:

```
Rails.application.routes.draw do
  get '/register/new', to: 'registrations#new'

  post '/register/prepare', to: 'registrations#prepare'
  post '/register', to: 'registrations#create'
  
  root 'registrations#new'
end
```

Edit [`app/javascript/packs/application.js`](https://github.com/ucwaldo/webauthn-rails-example/blob/master/app/javascript/packs/application.js), remove the imports that are there and load our javascript pack:

```
require('packs/registration');
```

Now is definitely the time to start the rails server and test out the form.

```
$ rails s
```

Feel free to make some improvements where you feel it's necessary or copy some details from the demo. For example validate the incoming user input, return eventual errors and handle them on the client side.

##### 7) Adding the login form. [view commit](https://github.com/ucwaldo/webauthn-rails-example/commit/fcab32e6feeac2f01b7a9407e850b5e2fb78f635)

The functionality and requirements of the login form are quite similar to the one we just added for the registration. The big difference now, is that instead of doing a **create** and verifying WebAuthn credentials in the browser and server side of our app, we now want to **get** and verify our previously created credentials from information that the user provides: first only the username, then the information that is stored on the authenticator.
