use crate::models::ProviderConfig;

pub fn get_preset_providers() -> Vec<ProviderConfig> {
    let now = chrono_now();
    vec![
        mk("anthropic", "Anthropic", "https://api.anthropic.com", true, 0),
        mk("openai_compatible", "OpenAI Compatible", "https://api.openai.com/v1", true, 1),
        mk("deepseek", "DeepSeek", "https://api.deepseek.com/v1", true, 2),
        mk("kimi", "Kimi (月之暗面)", "https://api.moonshot.cn/v1", true, 3),
        mk("qwen", "Qwen (通义千问)", "https://dashscope.aliyuncs.com/compatible-mode/v1", true, 4),
        mk("zhipu", "Zhipu (智谱)", "https://open.bigmodel.cn/api/paas/v4", true, 5),
        mk("baichuan", "Baichuan (百川)", "https://api.baichuan-ai.com/v1", true, 6),
        mk("doubao", "Doubao (豆包)", "https://ark.cn-beijing.volces.com/api/v3", true, 7),
        mk("gemini", "Gemini (Google)", "https://generativelanguage.googleapis.com/v1beta/openai", true, 8),
    ]
}

fn mk(provider_key: &str, display_name: &str, base_url: &str, is_preset: bool, sort_order: i32) -> ProviderConfig {
    let now = chrono_now();
    ProviderConfig {
        id: format!("preset_{}", provider_key),
        provider_key: provider_key.to_string(),
        display_name: display_name.to_string(),
        base_url: base_url.to_string(),
        api_key: String::new(),
        is_preset,
        enabled: true,
        sort_order,
        created_at: now.clone(),
        updated_at: now,
    }
}

fn chrono_now() -> String {
    "2026-01-01T00:00:00Z".to_string()
}
