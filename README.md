# Nova - Premium AI Chat Application

A modern, polished AI chat interface inspired by high-end clients like ChatGPT, Feather, and Lunar. Built with React + Vite for performance and clean aesthetics.

## Features

### Core Chat Features
- **Smooth Streaming Responses** - Character-by-character streaming with natural delays  
- **Multiple Conversations** - Manage multiple chat histories
- **Auto-Generated Titles** - Intelligent title generation from first message
- **Message History** - Full message persistence in state (database-ready)
- **User & Assistant Separation** - Clear visual distinction between message types

### UI/UX Excellence
- **Dark Premium Theme** - Soft gradients, glow effects, and subtle animations
- **Icon Sidebar** - Collapsible sidebar with 6 main sections (Chat, Search, Memory, Images, Tools, Settings)
- **Smart Tooltips** - Positioned outside sidebar, never clipped
- **Hover Animations** - Smooth lift, glow, and transition effects
- **Responsive Design** - Works on desktop and tablets

### Main Chat Area
- **Hero Section** - Greeting with suggestion chips for quick starts
- **Clean Messages** - Minimal style without bubbles
- **Perfect Avatar Centering** - 36px rounded avatars, properly aligned
- **Smooth Scrolling** - Auto-scroll to latest message
- **Status Badge** - "Smart • Fast • Clean" indicator

### Input Controls
- **Adaptive Textarea** - Expands for multi-line input
- **Rich Controls** - Plus button, send button, mic icon
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for newline
- **Disabled States** - Graceful handling when loading

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── Sidebar.tsx      # Icon rail with tooltips
│   ├── ChatArea.tsx     # Main chat display
│   ├── InputArea.tsx    # Message input dock
│   ├── Message.tsx      # Individual message component
│   └── ChatHistory.tsx  # Chat list sidebar
├── styles/              # Component-specific CSS
├── App.tsx              # Main app component
├── types.ts             # TypeScript interfaces
├── utils.ts             # Utilities & streaming logic
└── main.tsx             # React entry point
```

## Technical Stack
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Pure CSS with variables
- **State**: React Hooks

## Customization

To integrate with a real API, modify `simulateStreamingResponse()` in `src/utils.ts` to fetch from your backend and implement SSE or WebSocket streaming.

The architecture is already prepared for these integrations - no major refactoring required!

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
