export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type MeshType = 'cube' | 'sphere' | 'torusKnot' | 'icosahedron';

export interface ModelConfig {
  meshType: MeshType;
  position: Vector3;
  rotation: Vector3;
  scale: number;
}

export interface ViewConfig {
  position: Vector3;
  target: Vector3;
  up: Vector3;
}

export type ProjectionType = 'perspective' | 'orthographic';

export interface ProjectionConfig {
  type: ProjectionType;
  fov: number;
  near: number;
  far: number;
  orthoSize: number; // Represents the vertical size/zoom for ortho
}

export interface AppState {
  model: ModelConfig;
  view: ViewConfig;
  projection: ProjectionConfig;
}