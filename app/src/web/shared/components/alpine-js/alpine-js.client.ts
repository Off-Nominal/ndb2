import Alpine from "alpinejs";

// Expose for devtools and ad-hoc experiments in the console; directives work without this.
Object.assign(window, { Alpine });
Alpine.start();
export {};
