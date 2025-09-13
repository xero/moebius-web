import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["public/js/**/*.js"],
    ignores: ["public/js/worker.js"],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "module",
      globals: {
        // Browser environment
        window: "readonly",
        document: "readonly", 
        console: "readonly",
        alert: "readonly",
        confirm: "readonly",
        localStorage: "readonly",
        Worker: "readonly",
        WebSocket: "readonly",
        Image: "readonly",
        
        // Browser APIs that might not be recognized
        CustomEvent: "readonly",
        FileReader: "readonly",
        Uint8Array: "readonly",
        Uint16Array: "readonly", 
        Uint32Array: "readonly",
        btoa: "readonly",
        
        // Application globals (to be eliminated during modernization)
        worker: "writable",
        title: "writable", 
        palette: "writable",
        font: "writable",
        textArtCanvas: "writable",
        cursor: "writable",
        selectionCursor: "writable",
        positionInfo: "writable",
        toolPreview: "writable",
        pasteTool: "writable",
        chat: "writable",
        sampleTool: "writable",
        
        // Module globals (IIFE exports)
        Load: "readonly",
        Save: "readonly", 
        Toolbar: "readonly",
        ElementHelper: "readonly",
        Loaders: "readonly",
        Savers: "readonly",
        
        // Utility globals
        $: "readonly"
      }
    },
    rules: {
      // ES6+ Modernization Rules (as warnings for gradual adoption)
      "prefer-const": "warn",
      "no-var": "warn",
      
      // Code Quality Rules
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unreachable": "error",
      
      // Best Practices
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error"
    }
  },
  {
    files: ["public/js/worker.js"],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "script",
      globals: {
        self: "readonly",
        postMessage: "readonly",
        WebSocket: "readonly",
        console: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-undef": "error"
    }
  }
];