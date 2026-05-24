# System Design Jury

A desktop app for practicing system design — draw architecture diagrams on a canvas and get instant AI feedback from a local LLM, no cloud API keys needed.

## The Problem

System design interviews are hard to practice alone. You can read about distributed systems all day, but without someone reviewing your diagrams and pointing out gaps, it's tough to improve. Existing tools either require expensive API subscriptions or don't give structured feedback on architecture decisions.

**System Design Jury** solves this by running everything locally via [Ollama](https://ollama.com). You sketch your design, hit "get feedback," and an LLM scores your architecture, highlights strengths, identifies gaps, and suggests missing components — all offline, all free.

## Features

- **Interactive Canvas** — Drag-and-drop system components (load balancers, databases, caches, queues, etc.) and connect them with edges
- **AI Feedback** — Three modes: gentle suggestions, balanced critique, or brutally honest review
- **Practice Mode** — Built-in system design questions with expected components and evaluation criteria
- **Project Mode** — Free-form design with custom project descriptions
- **Database Schema Wizard** — Design entity relationships and get schema-specific feedback
- **API Design Wizard** — Define REST endpoints and get API design feedback
- **Component-Level Feedback** — Click on feedback items to highlight the relevant node on canvas
- **Local & Private** — Everything runs on your machine via Ollama, nothing leaves your network

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.com) installed and running
- A pulled model (e.g. `ollama pull gemma3`)

## Setup

```bash
# Clone the repo
git clone https://github.com/Curiositysavesthecat/systemdesignjury.git
cd systemdesignjury

# Install dependencies
npm install

# Start in development mode
npm run dev
```

The app will launch an Electron window. If Ollama isn't running, you'll see a setup guide in the feedback panel.

## Building

```bash
# macOS (arm64)
npm run package

# Windows (x64)
npm run package:win

# Linux (x64)
npm run package:linux

# All platforms
npm run package:all
```

Built artifacts appear in the `release/` folder.


https://github.com/user-attachments/assets/2fbdb430-8baa-46c5-81e7-2f580ec07c82

<img width="1728" height="1083" alt="Screenshot 2026-05-25 at 1 45 24 AM" src="https://github.com/user-attachments/assets/5d548114-e489-41ad-8263-d8b6c41441fe" />
<img width="1728" height="1091" alt="Screenshot 2026-05-25 at 1 46 37 AM" src="https://github.com/user-attachments/assets/1b55d6a5-b8c8-4c05-828a-9c6bffa8d34c" />


## Tech Stack

- **Electron** — Cross-platform desktop shell
- **React + TypeScript** — UI layer
- **React Flow** — Canvas and node graph rendering
- **Zustand** — State management
- **Ollama** — Local LLM inference
- **Webpack** — Bundling

## Usage

1. Launch the app and select a practice question or create a new project
2. Drag components from the left panel onto the canvas
3. Connect them by dragging between handles
4. Click "get feedback" in the right panel
5. Review scores, strengths, gaps, and suggested components
6. Iterate on your design

## License

ISC

