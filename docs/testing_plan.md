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

# Past Issues

## Suggestions for Resolving Vitest "Heap Out of Memory" Errors

You're encountering memory issues with Vitest, especially when testing functions that create massive arrays (even with small input sizes). Below are actionable steps and recommendations to resolve this problem:

---

## 1. Increase Node.js Heap Size

** THIS IS A BAD IDEA! but keep it in mind**

By default, Node.js allocates up to 2GB of memory. You can increase this limit using the `--max-old-space-size` flag:

```bash
node --max-old-space-size=8192 node_modules/vitest/bin/vitest
```

- `8192` means 8GB; adjust this value based on your system's available memory.

**To make this permanent**, add it to your `package.json` scripts:

```json
"scripts": {
  "test": "node --max-old-space-size=8192 node_modules/vitest/bin/vitest"
}
```

Run your tests with:

```bash
npm run test
```

---

## 2. Optimize the Test Data

- **Minimize Data Size:** Use the smallest arrays possible that still cover edge cases. If possible, test with arrays like `16` or `32` instead of `256`.
- **Mock or Stub Data:** Where possible, mock large data structures or use programmatic patterns to simulate size, rather than creating huge arrays.
- **Test in Isolation:** Break down tests so each one only uses as much data as necessary.
- **Cleanup:** Ensure large arrays and objects are cleaned up after each test to allow garbage collection.

---

## 3. Profile and Debug Memory Usage

- **V8 Inspector:**
  Run with `--inspect` or `--inspect-brk` to analyze heap usage:
  ```bash
  node --inspect node_modules/vitest/bin/vitest
  ```
  Open `chrome://inspect` in Chrome for heap snapshots.

- **Trace Garbage Collection:**
  ```bash
  node --max-old-space-size=8192 --trace_gc node_modules/vitest/bin/vitest
  ```

---

## 4. Optimize Vitest Worker Configuration

- **Run Tests Sequentially**
  In your `vitest.config.ts` or `vite.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'

  export default defineConfig({
    test: {
      threads: false, // disables parallelism
      isolate: true,  // ensures clean state between tests
    },
  })
  ```

- **Reduce Number of Workers:**
  If you want to keep threading but use less memory, set `maxThreads`:
  ```ts
  export default defineConfig({
    test: {
      maxThreads: 2,
    },
  })
  ```

---

## 5. Consider Function Refactoring

- If memory usage is inherent to the function under test, consider if it can be refactored to use streams or process data in smaller chunks.

---

## 6. Alternative Test Strategies

- **Divide and Conquer:**
  Split larger tests into smaller, targeted cases.

- **Parameterized Tests:**
  Use different input sizes to understand performance and memory usage at scale.


---

### **Deliverables**

- Playwright E2E tests in `tests/e2e/`
- Vitest unit/integration tests in `tests/unit/`
- Testing Library DOM tests in `tests/dom/`
- Test scripts in `package.json`
- README with test instructions
