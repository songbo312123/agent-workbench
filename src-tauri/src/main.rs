mod commands;
mod db;
mod models;
mod presets;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("failed to resolve app data dir");
            let db = db::Db::new(&data_dir).expect("failed to init database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_provider_configs,
            commands::get_provider_config,
            commands::upsert_provider_config,
            commands::delete_provider_config,
            commands::seed_preset_providers,
            commands::list_provider_models,
            commands::upsert_provider_model,
            commands::delete_provider_model,
            commands::set_default_model,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run()
}
