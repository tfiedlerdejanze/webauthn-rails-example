class RegistrationsController < ApplicationController
  def prepare
    user = User.new(registration_params)

    unless user.valid?
      return render json: {error: "Username invalid"}, status: :bad_request
    end

    options = WebAuthn::Credential.options_for_create(
      user: {
        id: WebAuthn.generate_user_id,
        name: registration_params[:username]
      }
    )

    session[:registration_challenge] = options.challenge
    session[:registration_user] = user.attributes

    render json: options
  end

  def create
    c = WebAuthn::Credential.from_create(params[:registration])
    c.verify(session[:registration_challenge])

    create_params = session[:registration_user].merge({
      user_id: c.id,
      public_key: c.public_key,
      sign_count: c.sign_count,
    })

    user = User.create(create_params)

    render json: {message: "Welcome #{user.username}, your registration was successful!"}
  end

  def new
  end

  protected

  def registration_params
    params.require(:registration).permit(:username)
  end
end
