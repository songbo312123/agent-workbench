use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProviderConfig {
    pub id: String,
    pub provider_key: String,
    pub display_name: String,
    pub base_url: String,
    pub api_key: String,
    pub is_preset: bool,
    pub enabled: bool,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct ProviderConfigInput {
    pub id: Option<String>,
    pub provider_key: String,
    pub display_name: String,
    pub base_url: String,
    pub api_key: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProviderModel {
    pub id: String,
    pub provider_config_id: String,
    pub model_id: String,
    pub display_name: String,
    pub is_default: bool,
    pub enabled: bool,
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct ProviderModelInput {
    pub id: Option<String>,
    pub provider_config_id: String,
    pub model_id: String,
    pub display_name: String,
    pub is_default: Option<bool>,
    pub enabled: Option<bool>,
}
