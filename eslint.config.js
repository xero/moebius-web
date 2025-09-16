import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module", // Default to ES6 modules for modern files
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
				setTimeout: "readonly",
				clearTimeout: "readonly",
				Notification: "readonly",
				Blob: "readonly",
				MouseEvent: "readonly",
				URL: "readonly",
				atob: "readonly",
				navigator: "readonly",

        // Browser APIs that might not be recognized
        CustomEvent: "readonly",
        FileReader: "readonly",
        Uint8Array: "readonly",
        Uint16Array: "readonly",
        Uint32Array: "readonly",
        btoa: "readonly",
        TextEncoder: "readonly", // Add TextEncoder to the globals

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

        // Utility globals
        $: "readonly"
      }
    },
    rules: {
      // Modernization Rules
      "prefer-const": "warn",
      "no-var": "warn",
			"prefer-arrow-callback": ["error"],

      // Code Quality
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
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "script", // Legacy scripts
      globals: {
        require: "readonly",
        module: "readonly",
        Buffer: "readonly"
      }
    },
    rules: {
      "no-console": "off",
      "no-undef": "off" // Suppress undefined errors for Node.js globals
    }
  },
  {
    files: ["dist/**/*.js"],
    rules: {
      // Skip linting entirely for dist files
      "no-console": "off",
      "no-unused-vars": "off",
      "no-undef": "off"
    }
  }
];
