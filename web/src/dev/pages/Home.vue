<script setup lang="ts">
import { onMounted } from 'vue';
</script>

<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Unraid Web Components Development Environment
      </h1>
      
      <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Purpose
        </h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          This development environment allows you to test and develop Unraid web components 
          outside of the full Nuxt framework. Components are built as custom elements and 
          can be used anywhere.
        </p>
        
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Available Test Pages:
        </h3>
        <ul class="space-y-2 text-gray-600 dark:text-gray-300">
          <li>• <strong>Web Components</strong> - Test all registered custom elements</li>
          <li>• <strong>Docker Card</strong> - Test the card layout view component</li>
          <li>• <strong>Docker Detail</strong> - Test the detail layout view component</li>
        </ul>
      </div>

      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
          🚀 Getting Started
        </h2>
        <div class="text-blue-800 dark:text-blue-200">
          <p class="mb-3">
            1. Use the navigation above to switch between different component tests
          </p>
          <p class="mb-3">
            2. Web components are automatically registered when you visit the pages
          </p>
          <p class="mb-3">
            3. Check the browser console for component registration status
          </p>
          <p>
            4. Components use shadow DOM for style isolation
          </p>
        </div>
      </div>
    </div>
  </div>
</template>