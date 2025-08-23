# DeckGL Mapping Application

A clean, modular geographic mapping application built with React, TypeScript, DeckGL, and MapLibre. Features a plugin-based architecture for scalable component development.

## Architecture Overview

This application uses a three-component architecture for maximum modularity and developer experience:

- **🏠 Home Button**: Central component launcher (top-right corner)
- **🔄 Universal Modal**: Unified display system (modal/sidebar/icon states)  
- **⚡ Components**: Self-contained modules with their own identity and logic

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

### Adding a New Component
1. Create your component content component
2. Define the component with icon, colors, and modal config
3. Register with the component registry
4. Done! Your component appears in the home button automatically

```typescript
// Example component
export const MyComponent: ComponentDefinition = {
  id: 'my-component',
  name: 'My Component',
  icon: <MyIcon />,
  primaryColor: '#3B82F6',
  onLaunch: () => ({
    content: <MyComponentContent />,
    size: 'md'
  })
};

componentRegistry.register(MyComponent);
```

## Documentation

- **[Architecture Overview](./ARCHITECTURE_OVERVIEW.md)** - System overview and benefits
- **[Home Button Guide](./HOME_BUTTON_INSTRUCTIONS.md)** - Component launcher system
- **[Universal Modal Guide](./UNIVERSAL_MODAL_INSTRUCTIONS.md)** - Modal system design
- **[Component Development Guide](./COMPONENT_INSTRUCTIONS.md)** - Building new components
- **[Cleanup Summary](./CLEANUP_SUMMARY.md)** - What was removed/archived

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **DeckGL** for WebGL-powered mapping
- **MapLibre** for base map rendering  
- **Tailwind CSS** for styling
- **Heroicons** for UI icons

      ## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **DeckGL** for WebGL-powered mapping
- **MapLibre** for base map rendering  
- **Tailwind CSS** for styling
- **Heroicons** for UI icons

## License

MIT
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

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

export default tseslint.config([
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
