use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Mutex;

use crate::models::{ProviderConfig, ProviderConfigInput, ProviderModel, ProviderModelInput};

pub struct Db(pub Mutex<Connection>);

impl Db {
    pub fn new(app_data_dir: &Path) -> Result<Self, String> {
        std::fs::create_dir_all(app_data_dir).map_err(|e| e.to_string())?;
        let db_path = app_data_dir.join("workbench.db");
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(|e| e.to_string())?;

        run_migrations(&conn)?;
        Ok(Self(Mutex::new(conn)))
    }
}

fn run_migrations(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(include_str!("../../backend/src/db/migrations/001_initial_schema.sql"))
        .map_err(|e| format!("migration 001: {}", e))?;
    conn.execute_batch(include_str!("../../backend/src/db/migrations/002_provider_configs.sql"))
        .map_err(|e| format!("migration 002: {}", e))?;
    Ok(())
}

// ── Provider Config CRUD ──

pub fn list_provider_configs(conn: &Connection) -> Result<Vec<ProviderConfig>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at FROM provider_configs ORDER BY sort_order"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(ProviderConfig {
            id: row.get(0)?,
            provider_key: row.get(1)?,
            display_name: row.get(2)?,
            base_url: row.get(3)?,
            api_key: mask_key(&row.get::<_, String>(4)?),
            is_preset: row.get::<_, i32>(5)? != 0,
            enabled: row.get::<_, i32>(6)? != 0,
            sort_order: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn get_provider_config(conn: &Connection, id: &str) -> Result<ProviderConfig, String> {
    let mut stmt = conn.prepare(
        "SELECT id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at FROM provider_configs WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    stmt.query_row(params![id], |row| {
        Ok(ProviderConfig {
            id: row.get(0)?,
            provider_key: row.get(1)?,
            display_name: row.get(2)?,
            base_url: row.get(3)?,
            api_key: mask_key(&row.get::<_, String>(4)?),
            is_preset: row.get::<_, i32>(5)? != 0,
            enabled: row.get::<_, i32>(6)? != 0,
            sort_order: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    }).map_err(|e| e.to_string())
}

pub fn upsert_provider_config(conn: &Connection, input: &ProviderConfigInput) -> Result<ProviderConfig, String> {
    let id = input.id.clone().unwrap_or_else(|| format!("custom_{}", uuid_short()));
    let now = now_iso();

    if input.id.is_some() {
        // Update
        let api_key_clause = match &input.api_key {
            Some(k) => format!(", api_key = '{}'", k.replace('\'', "''")),
            None => String::new(),
        };
        conn.execute(&format!(
            "UPDATE provider_configs SET display_name = ?1, base_url = ?2, enabled = ?3, updated_at = ?4{} WHERE id = ?5",
            api_key_clause
        ), params![input.display_name, input.base_url, input.enabled.unwrap_or(true) as i32, now, id]
        ).map_err(|e| e.to_string())?;
    } else {
        // Insert
        conn.execute(
            "INSERT INTO provider_configs (id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, 99, ?7, ?7)",
            params![id, input.provider_key, input.display_name, input.base_url, input.api_key.as_deref().unwrap_or(""), input.enabled.unwrap_or(true) as i32, now]
        ).map_err(|e| e.to_string())?;
    }

    get_provider_config(conn, &id)
}

pub fn delete_provider_config(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM provider_models WHERE provider_config_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM provider_configs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn seed_preset_providers(conn: &Connection) -> Result<Vec<ProviderConfig>, String> {
    let presets = crate::presets::get_preset_providers();
    for p in &presets {
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) FROM provider_configs WHERE id = ?1",
            params![p.id],
            |row| Ok(row.get::<_, i32>(0)? > 0),
        ).map_err(|e| e.to_string())?;

        if !exists {
            conn.execute(
                "INSERT OR IGNORE INTO provider_configs (id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
                params![p.id, p.provider_key, p.display_name, p.base_url, p.api_key, p.is_preset as i32, p.enabled as i32, p.sort_order, p.created_at],
            ).map_err(|e| e.to_string())?;
        }
    }
    list_provider_configs(conn)
}

// ── Provider Model CRUD ──

pub fn list_provider_models(conn: &Connection, provider_config_id: &str) -> Result<Vec<ProviderModel>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, provider_config_id, model_id, display_name, is_default, enabled, sort_order FROM provider_models WHERE provider_config_id = ?1 ORDER BY sort_order"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![provider_config_id], |row| {
        Ok(ProviderModel {
            id: row.get(0)?,
            provider_config_id: row.get(1)?,
            model_id: row.get(2)?,
            display_name: row.get(3)?,
            is_default: row.get::<_, i32>(4)? != 0,
            enabled: row.get::<_, i32>(5)? != 0,
            sort_order: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn upsert_provider_model(conn: &Connection, input: &ProviderModelInput) -> Result<ProviderModel, String> {
    let id = input.id.clone().unwrap_or_else(|| format!("model_{}", uuid_short()));

    if input.id.is_some() {
        conn.execute(
            "UPDATE provider_models SET model_id = ?1, display_name = ?2, is_default = ?3, enabled = ?4 WHERE id = ?5",
            params![input.model_id, input.display_name, input.is_default.unwrap_or(false) as i32, input.enabled.unwrap_or(true) as i32, id]
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO provider_models (id, provider_config_id, model_id, display_name, is_default, enabled, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 99)",
            params![id, input.provider_config_id, input.model_id, input.display_name, input.is_default.unwrap_or(false) as i32, input.enabled.unwrap_or(true) as i32]
        ).map_err(|e| e.to_string())?;
    }

    let mut stmt = conn.prepare(
        "SELECT id, provider_config_id, model_id, display_name, is_default, enabled, sort_order FROM provider_models WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    stmt.query_row(params![id], |row| {
        Ok(ProviderModel {
            id: row.get(0)?,
            provider_config_id: row.get(1)?,
            model_id: row.get(2)?,
            display_name: row.get(3)?,
            is_default: row.get::<_, i32>(4)? != 0,
            enabled: row.get::<_, i32>(5)? != 0,
            sort_order: row.get(6)?,
        })
    }).map_err(|e| e.to_string())
}

pub fn delete_provider_model(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM provider_models WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())
}

pub fn set_default_model(conn: &Connection, provider_config_id: &str, model_id: &str) -> Result<(), String> {
    conn.execute("UPDATE provider_models SET is_default = 0 WHERE provider_config_id = ?1", params![provider_config_id])
        .map_err(|e| e.to_string())?;
    conn.execute("UPDATE provider_models SET is_default = 1 WHERE provider_config_id = ?1 AND model_id = ?2", params![provider_config_id, model_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Helpers ──

fn mask_key(key: &str) -> String {
    if key.is_empty() {
        return String::new();
    }
    if key.len() <= 8 {
        return "***".to_string();
    }
    format!("{}...{}", &key[..4], &key[key.len()-4..])
}

fn uuid_short() -> String {
    format!("{:08x}", std::time::SystemTime::now().elapsed().unwrap_or_default().as_millis())
}

fn now_iso() -> String {
    "2026-01-01T00:00:00Z".to_string()
}
