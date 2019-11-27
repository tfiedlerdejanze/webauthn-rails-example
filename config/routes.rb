Rails.application.routes.draw do
  get '/register/new', to: 'registrations#new'
  get '/login/new', to: 'logins#new'

  post '/register/prepare', to: 'registrations#prepare'
  post '/register', to: 'registrations#create'

  post '/login/prepare', to: 'logins#prepare'
  post '/login', to: 'logins#create'

  root 'registrations#new'
end
