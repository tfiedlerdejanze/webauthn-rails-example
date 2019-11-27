class LoginsController < ApplicationController
  def prepare
    user = User.find_by(username: login_params[:username])

    if user.nil?
      return render json: {error: "Username not known"}, status: :not_found
    end

    options = WebAuthn::Credential.options_for_get(allow: [user.user_id])

    session[:login_challenge] = options.challenge
    session[:login_username] = login_params[:username]

    render json: options
  end

  def create
    user = User.find_by(username: session[:login_username])

    c = WebAuthn::Credential.from_get(params[:login])
    c.verify(
      session[:login_challenge],
      public_key: user.public_key,
      sign_count: user.sign_count,
    )

    user.update(sign_count: c.sign_count)

    render json: {message: "Hey #{user.username}, welcome back!"}
  end

  def new
  end

  protected

  def login_params
    params.require(:login).permit(:username)
  end
end
