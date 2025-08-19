# Web ANSI Editor Modernization Checklist

This document tracks the remaining major tasks for finalizing the ES6+ migration, bundling, cleanup, and setting up a robust modern test suite.

---

## Task 4: Bundling and Minification with Vite

### **Goal**
Bundle and minify all JavaScript modules in `public/js/` into a single optimized file for production using **Vite**. This will reduce HTTP requests, improve load performance, and provide a fast dev workflow with ES6 module support.

---

### **Steps**

1. **Add Vite as a Dev Dependency**
   - Install Vite and related dependencies:
     ```bash
     npm install --save-dev vite
     ```

2. **Configure Vite**
   - Create `vite.config.js` in the project root:
     ```js
     // vite.config.js
     import { defineConfig } from 'vite';

     export default defineConfig({
       root: 'public',
       build: {
         outDir: 'dist',
         emptyOutDir: true,
         rollupOptions: {
           input: 'js/document_onload.js', // adjust entry if needed
           output: {
             entryFileNames: 'bundle.js'
           }
         }
       },
       server: {
         open: true
       }
     });
     ```
   - Place your main entry JS in `public/js/document_onload.js` (or adjust as needed).

3. **Update `index.html` to Use Vite Output**
   - In `public/index.html`, replace all old `<script>` tags with:
     ```html
     <script type="module" src="/dist/bundle.js"></script>
     ```
   - Remove all other JS `<script>` tags (except the Vite bundle).

4. **Add Build Scripts to `package.json`**
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```

5. **Test Everything**
   - `npm run dev` for local development (hot reload, source maps).
   - `npm run build` for production build (minified, optimized).
   - Open `public/index.html` or use `npm run preview` to test the production bundle.
   - Test in all major browsers and on mobile.

6. **Document the Workflow**
   - Update `README.md` with:
     - Local dev usage (`npm run dev`)
     - Production build (`npm run build`)
     - Which script tag to use in `index.html`

---

### **Deliverables**

- All JS in `public/js/` bundled/minified to `public/dist/bundle.js`.
- `index.html` loads only the bundled/minified file.
- Build scripts in `package.json` for dev and prod.
- README updated with new build/run instructions.

---

## Task 5: Triple-Headed Testing: Playwright, Vitest, and Testing Library

### **Goal**
Implement a modern, comprehensive test suite leveraging **Playwright** (E2E/browser), **Vitest** (unit/integration), and **Testing Library** (DOM/component-level) for a robust, reliable editor.

---

### **Steps**

1. **Install Testing Stack**
   ```bash
   npm install --save-dev playwright vitest @testing-library/dom @testing-library/user-event @testing-library/jest-dom
   ```

2. **Set Up Vitest**
   - Create `vitest.config.js`:
     ```js
     import { defineConfig } from 'vitest/config';

     export default defineConfig({
       test: {
         environment: 'jsdom',
         setupFiles: ['./tests/setupTests.js'],
         globals: true
       }
     });
     ```
   - Add a `tests/setupTests.js` for Testing Library custom matchers:
     ```js
     import '@testing-library/jest-dom';
     ```

3. **Set Up Playwright**
   - Use `npx playwright install` to download browsers.
   - Add E2E tests under `tests/e2e/` (see earlier playwright example for XBin bug regression).
   - Add Playwright test scripts to `package.json`:
     ```json
     "test:e2e": "playwright test"
     ```

4. **Organize Test Structure**
   ```
   tests/
     e2e/          # Playwright E2E tests
     unit/         # Vitest unit tests
     dom/          # Testing Library DOM/component tests
     setupTests.js
   ```

5. **Sample Test Scripts**
   - Place Playwright E2E scripts (for visual regression, file loading, etc.) in `tests/e2e/`.
   - Place Vitest unit tests for utilities, palette logic, etc., in `tests/unit/`.
   - Place Testing Library tests for DOM behavior in `tests/dom/`.

6. **Document Test Usage**
   - Update `README.md` with:
     - How to run unit tests: `npx vitest` or `npm run test:unit`
     - How to run E2E tests: `npm run test:e2e`
     - How to add new tests and where to put them

---

### **Deliverables**

- Playwright E2E tests in `tests/e2e/`
- Vitest unit/integration tests in `tests/unit/`
- Testing Library DOM tests in `tests/dom/`
- Test scripts in `package.json`
- README with test instructions

---

## Task 6: Final Cleanup & Documentation Polish

### **Goal**
Finalize modernization: clean up codebase, ensure consistency, and update documentation for new ES6+, Vite bundling, and testing workflow.

---

### **Steps**

1. **Remove Legacy/Unused Code**
   - Delete unused scripts, variables, or polyfills.
   - Remove obsolete process managers/deps (e.g., pm2).
   - Clean up comments, TODOs, old workaround notes.

2. **Review and Refactor for Consistency**
   - Standardize ES6 conventions (import/export, let/const, arrow functions).
   - Ensure consistent naming, file structure, and run `npm run lint`/`npm run format`.
   - Confirm all dependencies are managed in `package.json` and up-to-date.

3. **Update Documentation**
   - Revise `README.md`:
     - New ES6+ structure
     - Build process (dev and prod via Vite)
     - Test instructions for Playwright, Vitest, Testing Library
     - Which script tag(s) to use
   - Remove/update old screenshots/snippets.
   - Optionally add migration notes for old contributors.

4. **Test Thoroughly**
   - Test in Chrome, Safari, Firefox, Edge, iOS, Android (dev and prod).
   - Validate all features, including collaboration and file operations.
   - Confirm hot reload works for dev.

5. **Optional: Tag the Release**
   - If a major rework, tag a release (e.g., `v2.0.0`) and summarize breaking changes.

---

### **Deliverables**

- Clean, ES6+ codebase with no legacy cruft.
- Updated, accurate documentation and usage instructions.
- Strong, multi-layered test suite.
- Verified functionality and consistent dev & artist experiences.

