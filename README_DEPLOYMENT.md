# Deployment Guide: Desktop & PWA

## Desktop App (Electron)

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Build Backend**
```bash
cd backend
npm run build
```

3. **Install Electron Dependencies**
```bash
cd electron
npm install
```

4. **Run Desktop App**
```bash
npm start
```

5. **Build Distributables**
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Desktop App (Tauri)

### Prerequisites
- Rust (install via [rustup.rs](https://rustup.rs/))
- System dependencies:
  - macOS: Xcode Command Line Tools
  - Linux: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
  - Windows: Microsoft C++ Build Tools

### Setup

1. **Install Tauri CLI**
```bash
cargo install tauri-cli
```

2. **Build**
```bash
cd tauri
cargo tauri build
```

3. **Development**
```bash
cargo tauri dev
```

## PWA (Progressive Web App)

### Setup

1. **Generate Icons**
Create these icon files in `frontend/public/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

2. **Register Service Worker**
Add to `frontend/src/app/layout.tsx`:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

3. **Install PWA**
Users can install via browser:
- Chrome/Edge: Click install icon in address bar
- Safari (iOS): Share → Add to Home Screen
- Firefox: Menu → Install

## Local LLM Setup

### Ollama

1. **Install Ollama**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

2. **Start Ollama**
```bash
ollama serve
```

3. **Pull Models**
```bash
ollama pull llama3
ollama pull mistral
ollama pull codellama
```

4. **Configure**
Set in `.env`:
```
LOCAL_LLM_BASE_URL=http://localhost:11434
```

### LM Studio

1. **Download** from [lmstudio.ai](https://lmstudio.ai)
2. **Start Server** (default port: 1234)
3. **Load Model** in LM Studio
4. **Configure**:
```
LOCAL_LLM_BASE_URL=http://localhost:1234
```

### vLLM

1. **Install**
```bash
pip install vllm
```

2. **Start Server**
```bash
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3-8b-chat-hf \
  --port 8000
```

3. **Configure**
```
VLLM_BASE_URL=http://localhost:8000
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

```bash
# Required for cloud providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Optional extended providers
TOGETHER_API_KEY=...
GROQ_API_KEY=...
MISTRAL_API_KEY=...

# Local LLM (optional)
LOCAL_LLM_BASE_URL=http://localhost:11434
VLLM_BASE_URL=http://localhost:8000
```

## Running Locally

### Development Mode

1. **Start Backend**
```bash
cd backend
npm run dev
```

2. **Start Frontend**
```bash
cd frontend
npm run dev
```

3. **Access**
- Web: http://localhost:3000
- Desktop: Use Electron/Tauri dev mode

### Production Mode

1. **Build Everything**
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

2. **Start**
```bash
# Backend
cd backend && npm start

# Frontend (served via Electron/Tauri or static server)
```

## Platform-Specific Notes

### macOS
- Electron: Creates `.app` bundle
- Tauri: Creates `.app` bundle
- Code signing required for distribution

### Windows
- Electron: Creates `.exe` installer
- Tauri: Creates `.msi` installer
- Code signing recommended

### Linux
- Electron: Creates AppImage, deb, rpm
- Tauri: Creates AppImage, deb
- AppImage works on most distributions

## Troubleshooting

### Local LLM Not Detected
- Check if service is running: `curl http://localhost:11434/api/tags`
- Verify `LOCAL_LLM_BASE_URL` in `.env`
- Check firewall settings

### PWA Not Installing
- Ensure HTTPS (or localhost)
- Check `manifest.json` is accessible
- Verify service worker registration

### Desktop App Won't Start
- Check Node.js version (18+)
- Verify all dependencies installed
- Check backend is running (for Electron)
