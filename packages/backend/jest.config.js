export default {
  testEnvironment: "node",
  testMatch: ["**/testing/**/*.test.js"],
  // Antes de cada archivo de tests: el secreto del JWT (decisión 42)
  setupFiles: ["<rootDir>/testing/ayudas/entorno.js"],
};
