export interface DockerImageSummary {
  Id: string;
  ParentId: string;
  RepoTags: string[];
  RepoDigests: string[];
  Created: number;
  Size: number;
  SharedSize: number;
  Labels: Labels;
  Containers: number;
  Manifests: Manifest[];
  Descriptor: Descriptor;
}

export interface Descriptor {
  mediaType: string;
  digest: string;
  size: number;
  urls: string[];
  annotations: Annotations;
  data: null;
  platform: Platform;
  artifactType: null;
}

export interface Annotations extends Record<string, string> {}

export interface Platform {
  architecture: string;
  os: string;
  "os.version": string;
  "os.features": string[];
  variant: string;
}

export interface Labels extends Record<string, string> {}

export interface Manifest {
  ID: string;
  Descriptor: Descriptor;
  Available: boolean;
  Size: ManifestSize;
  Kind: string;
  ImageData: ImageData;
  AttestationData: AttestationData;
}

export interface AttestationData {
  For: string;
}

export interface ImageData {
  Platform: Platform;
  Containers: string[];
  Size: ImageDataSize;
}

export interface ImageDataSize {
  Unpacked: number;
}

export interface ManifestSize {
  Total: number;
  Content: number;
}
