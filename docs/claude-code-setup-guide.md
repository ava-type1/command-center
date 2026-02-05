# Claude Code Setup Guide for Kam's Mac

Complete configuration for iOS/SwiftUI development, ESP32 firmware, and Cloudflare deployments.

---

## 📦 Prerequisites

Make sure you have these installed first:

```bash
# Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js (required for MCP servers)
brew install node

# Python (for some MCP servers)
brew install python

# ESP-IDF (for ESP32 development) - optional, only if doing firmware work
# Follow: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/

# Claude Code CLI (if not already installed)
npm install -g @anthropic-ai/claude-code
```

---

## 🔧 Step 1: Create MCP Configuration

Create the MCP config directory and file:

```bash
mkdir -p ~/.config/claude-code
```

Create `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-context7"],
      "description": "Live documentation for any library"
    },
    "xcodebuild": {
      "command": "npx",
      "args": ["-y", "xcodebuildmcp@beta"],
      "tool_timeout_sec": 10000,
      "description": "Build and run iOS/macOS projects"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-filesystem", "/Users/YOUR_USERNAME/Developer"],
      "description": "File access for your projects folder"
    }
  }
}
```

**⚠️ Replace `YOUR_USERNAME` with your actual Mac username!**

---

## 🔧 Step 2: Add API Keys to Environment

Add these to your `~/.zshrc` (or `~/.bashrc`):

```bash
# Cloudflare (for deployments)
export CLOUDFLARE_API_TOKEN="your-cloudflare-token"

# Dexcom API (if using for AvaDrive)
export DEXCOM_CLIENT_ID="your-dexcom-client-id"
export DEXCOM_CLIENT_SECRET="your-dexcom-client-secret"

# Optional: GitHub token for private repos
export GITHUB_TOKEN="your-github-token"
```

Then reload:
```bash
source ~/.zshrc
```

---

## 🔧 Step 3: Install Skills & Plugins

Open Claude Code and run these commands:

```bash
# Add the official Anthropic skills marketplace
/plugin marketplace add anthropics/skills

# Install official skill packs
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills

# Install Ralph Wiggum (autonomous loop)
/plugin install ralph-wiggum@anthropic-agent-skills
```

---

## 🔧 Step 4: Create Your CLAUDE.md

In each project folder, create a `CLAUDE.md` file to give Claude context. Here's a template for AVA Type 1:

**For AVA Type 1 App** (`~/Developer/ava-type1/CLAUDE.md`):
```markdown
# AVA Type 1 - Project Context

## What This Is
iOS simulation game teaching Type 1 Diabetes management to kids ages 5-18.

## Tech Stack
- SwiftUI (iOS 17+)
- Swift 6 with strict concurrency
- @Observable macro for state management
- Core Data for persistence

## Code Style
- Use modern SwiftUI patterns
- Prefer async/await over completion handlers
- Use @Observable instead of @ObservableObject
- Keep views under 200 lines - extract subviews
- Document complex physiological calculations

## Project Structure
- `/Models` - Data models and physiological simulation
- `/Views` - SwiftUI views organized by feature
- `/ViewModels` - @Observable classes for business logic
- `/Services` - API clients, persistence, etc.

## Build & Run
- Xcode 15+ required
- Target: iPhone, iPad
- Use XcodeBuildMCP for builds when available
```

**For AvaDrive** (`~/Developer/avadrive/CLAUDE.md`):
```markdown
# AvaDrive - Project Context

## What This Is
Real-time CGM glucose display for driving safety. iOS app + ESP32 hardware.

## Tech Stack
### iOS App
- SwiftUI
- Dexcom Share API for CGM data
- BLE for ESP32 communication
- MQTT for DIY integrations

### ESP32 Firmware
- ESP-IDF framework
- Waveshare ESP32-C6-LCD-1.47 display
- BLE peripheral mode
- Philips Hue API integration

## Key Features
- Real-time glucose on external display
- Philips Hue light alerts for lows
- MQTT broadcast for DIY integrations
- Per-light customization

## Hardware
- Display: Waveshare ESP32-C6-LCD-1.47 (36.37 x 17.78mm)
- Battery: ONN 5000mAh pack
```

---

## 🚀 Step 5: Using Ralph Wiggum (Autonomous Mode)

For longer tasks, use Ralph Wiggum to let Claude work autonomously:

```bash
# Basic usage
/ralph-loop "Add Philips Hue integration to AvaDrive" --max-iterations 15 --completion-promise "HUE_DONE"

# With specific constraints
/ralph-loop "Refactor SimulationEngine to use async/await" --max-iterations 10 --completion-promise "REFACTORED"
```

**Tips:**
- Set `--max-iterations` conservatively (10-15) to avoid burning through usage
- Use descriptive `--completion-promise` strings Claude will output when done
- Monitor the first few iterations to make sure it's on track

---

## 🛠️ Step 6: Optional - ESP32 MCP Setup

If you want Claude to flash ESP32 firmware directly:

1. Install ESP-IDF following [official docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/)

2. Clone the ESP MCP server:
```bash
git clone https://github.com/nicholasgriffintn/esp-mcp.git
cd esp-mcp
pip install -r requirements.txt
```

3. Add to your `mcp.json`:
```json
{
  "mcpServers": {
    "esp-idf": {
      "command": "python",
      "args": ["/path/to/esp-mcp/main.py"],
      "env": {
        "IDF_PATH": "/path/to/esp-idf"
      }
    }
  }
}
```

---

## 📋 Quick Reference Commands

| Command | What it does |
|---------|--------------|
| `/plugin list` | See installed plugins |
| `/plugin install X` | Install a plugin |
| `/mcp` | Check MCP server status |
| `/ralph-loop "task"` | Start autonomous mode |
| `/config` | Open Claude Code settings |
| `/help` | Full command reference |

---

## 🔗 Useful Links

- **Awesome Agent Skills**: https://github.com/VoltAgent/awesome-agent-skills
- **Anthropic Official Skills**: https://github.com/anthropics/skills
- **XcodeBuildMCP**: https://github.com/cameroncooke/XcodeBuildMCP
- **Claude Code Docs**: https://docs.anthropic.com/en/docs/claude-code
- **MCP Market (Skills)**: https://mcpmarket.com/tools/skills

---

## 🎯 Recommended Workflow

1. **Start each project** by creating/updating `CLAUDE.md`
2. **For quick tasks**: Just chat with Claude normally
3. **For bigger features**: Use `/ralph-loop` with clear completion criteria
4. **For iOS builds**: Let XcodeBuildMCP handle builds so Claude sees errors directly
5. **Check Context7** for up-to-date API docs when working with external libraries

---

## 🆘 Troubleshooting

**MCP servers not connecting:**
```bash
# Check if node is in PATH
which node

# Manually test an MCP server
npx -y @anthropic-ai/mcp-context7
```

**XcodeBuildMCP not finding Xcode:**
```bash
# Make sure Xcode CLI tools are set
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

**Ralph Wiggum loops forever:**
- Make your completion promise more specific
- Add context in your initial prompt about when to stop
- Use `--max-iterations` as a safety limit

---

*Last updated: Feb 5, 2026*
