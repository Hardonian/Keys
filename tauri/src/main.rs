// Tauri v2 main.rs
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize app
            let window = app.get_window("main").unwrap();
            window.set_title("Cursor Venture Companion").unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_platform,
            detect_local_llms
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
async fn detect_local_llms() -> Result<serde_json::Value, String> {
    // Detect Ollama, LM Studio, etc.
    let mut results = serde_json::json!({});
    
    // Try Ollama
    match reqwest::Client::new()
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(resp) => {
            if resp.status().is_success() {
                if let Ok(data) = resp.json::<serde_json::Value>().await {
                    results["ollama"] = serde_json::json!({
                        "available": true,
                        "models": data["models"]
                    });
                }
            }
        }
        Err(_) => {
            results["ollama"] = serde_json::json!({ "available": false });
        }
    }
    
    Ok(results)
}
