<script setup lang="ts">
// Simple redirect to test pages
// The Vue app is primarily used for component development
// All testing happens in HTML-based test pages at /test-pages/
</script>

<template>
  <div id="app">
    <div class="redirect-container">
      <h1>Unraid Components</h1>
      <p>Redirecting to test pages...</p>
      <a href="/test-pages/">Go to Test Pages →</a>
    </div>
  </div>
</template>

<style scoped>
.redirect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  background: #f3f4f6;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

p {
  color: #6b7280;
  margin-bottom: 2rem;
}

a {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background 0.2s;
}

a:hover {
  background: #2563eb;
}
</style>
