use tauri::State;

use crate::db::Db;
use crate::models::{ProviderConfig, ProviderConfigInput, ProviderModel, ProviderModelInput};

#[tauri::command]
pub fn list_provider_configs(db: State<'_, Db>) -> Result<Vec<ProviderConfig>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::list_provider_configs(&conn)
}

#[tauri::command]
pub fn get_provider_config(id: String, db: State<'_, Db>) -> Result<ProviderConfig, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::get_provider_config(&conn, &id)
}

#[tauri::command]
pub fn upsert_provider_config(input: ProviderConfigInput, db: State<'_, Db>) -> Result<ProviderConfig, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::upsert_provider_config(&conn, &input)
}

#[tauri::command]
pub fn delete_provider_config(id: String, db: State<'_, Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::delete_provider_config(&conn, &id)
}

#[tauri::command]
pub fn seed_preset_providers(db: State<'_, Db>) -> Result<Vec<ProviderConfig>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::seed_preset_providers(&conn)
}

#[tauri::command]
pub fn list_provider_models(provider_config_id: String, db: State<'_, Db>) -> Result<Vec<ProviderModel>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::list_provider_models(&conn, &provider_config_id)
}

#[tauri::command]
pub fn upsert_provider_model(input: ProviderModelInput, db: State<'_, Db>) -> Result<ProviderModel, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::upsert_provider_model(&conn, &input)
}

#[tauri::command]
pub fn delete_provider_model(id: String, db: State<'_, Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::delete_provider_model(&conn, &id)
}

#[tauri::command]
pub fn set_default_model(provider_config_id: String, model_id: String, db: State<'_, Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::set_default_model(&conn, &provider_config_id, &model_id)
}
