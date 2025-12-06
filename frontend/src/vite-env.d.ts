/// <reference types="vite/client" />

declare module '*.jpg' {
  const src: string
  export default src
}

declare module 'maath/random/dist/maath-random.esm' {
  export interface InSphereOptions {
    radius: number
  }
  
  export function inSphere(
    array: Float32Array,
    options: InSphereOptions
  ): Float32Array
}


