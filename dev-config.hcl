
auto_auth {

  method {
    type = "token_file"

    config {
      token_file_path = "/home/peter/.vault-token"
    }
  }
}

template_config {
  static_secret_render_interval = "5m"
  exit_on_retry_failure         = true
}

vault {
  address = "http://192.168.1.254:8200"
}

env_template "SUPABASE_ANON_KEY" {
  contents             = "{{ with secret \"kv/data/bobby\" }}{{ .Data.data.SUPABASE_ANON_KEY }}{{ end }}"
  error_on_missing_key = true
}
env_template "SUPABASE_URL" {
  contents             = "{{ with secret \"kv/data/bobby\" }}{{ .Data.data.SUPABASE_URL }}{{ end }}"
  error_on_missing_key = true
}

exec {
  command                   = ["remix dev --manual"]
  restart_on_secret_changes = "always"
  restart_stop_signal       = "SIGTERM"
}
