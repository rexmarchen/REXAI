// vite.config.js
import { defineConfig } from "file:///C:/Users/anshupal/OneDrive/Desktop/rexionAI/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/anshupal/OneDrive/Desktop/rexionAI/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const warningSource = warning.id || warning.importer || "";
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" && /node_modules[\\/](framer-motion|lucide-react)/.test(warningSource)) {
          return;
        }
        warn(warning);
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    open: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnNodXBhbFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHJleGlvbkFJXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnNodXBhbFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHJleGlvbkFJXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hbnNodXBhbC9PbmVEcml2ZS9EZXNrdG9wL3JleGlvbkFJL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgIGNvbnN0IHdhcm5pbmdTb3VyY2UgPSB3YXJuaW5nLmlkIHx8IHdhcm5pbmcuaW1wb3J0ZXIgfHwgJydcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgd2FybmluZy5jb2RlID09PSAnTU9EVUxFX0xFVkVMX0RJUkVDVElWRScgJiZcbiAgICAgICAgICAvbm9kZV9tb2R1bGVzW1xcXFwvXShmcmFtZXItbW90aW9ufGx1Y2lkZS1yZWFjdCkvLnRlc3Qod2FybmluZ1NvdXJjZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB3YXJuKHdhcm5pbmcpXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBvcGVuOiBmYWxzZVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VixTQUFTLG9CQUFvQjtBQUN6WCxPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU8sU0FBUyxNQUFNO0FBQ3BCLGNBQU0sZ0JBQWdCLFFBQVEsTUFBTSxRQUFRLFlBQVk7QUFFeEQsWUFDRSxRQUFRLFNBQVMsNEJBQ2pCLGdEQUFnRCxLQUFLLGFBQWEsR0FDbEU7QUFDQTtBQUFBLFFBQ0Y7QUFFQSxhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
