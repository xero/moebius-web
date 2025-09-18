## Task  Triple-Headed Testing: Playwright, Vitest, and Testing Library

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
