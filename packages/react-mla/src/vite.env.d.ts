/// <reference types="vite/client" />

// This tells TypeScript how to handle imports ending in '?worker'
declare module '*?worker' {
    const WorkerFactory: {
      new (): Worker;
    };
    export default WorkerFactory;
  }