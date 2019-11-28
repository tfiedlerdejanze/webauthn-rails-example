WebAuthn.configure do |config|
  config.origin = ENV['WEBAUTHN_ORIGIN'] || "http://localhost:3000"
  config.rp_name = "Webauthn Example SE"
end
