export interface DockerContainerSummary {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  ImageManifestDescriptor: ImageManifestDescriptor;
  Command: string;
  Created: number;
  Ports: Port[];
  Labels: Labels;
  State: string;
  Status: string;
  HostConfig: HostConfig;
  Health: Health;
  NetworkSettings: NetworkSettings;
  Mounts: Mount[];
}

export interface ImageManifestDescriptor {
  mediaType: string;
  digest: string;
  size: number;
  platform: Platform;
  annotations?: Annotations;
}

export interface Platform {
  architecture: string;
  os: string;
  variant?: string;
}

export interface Annotations extends Record<string, string> {}

export interface Port {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
}

export interface Labels extends Record<string, string> {}

export interface HostConfig {
  NetworkMode: string;
}

export interface Health {
  Status: string;
  FailingStreak: number;
}

export interface NetworkSettings {
  Networks: Networks;
}

export interface Networks extends Record<string, Network>{
}

export interface Network {
  IPAMConfig: any;
  Links: any;
  Aliases: any;
  DriverOpts: any;
  GwPriority: number;
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  MacAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  DNSNames: any;
}

export interface Mount {
  Type: string;
  Source: string;
  Destination: string;
  Mode: string;
  RW: boolean;
  Propagation: string;
  Name?: string;
  Driver?: string;
}
