export declare interface DockerInfo {
  ID: string;
  Containers: number;
  ContainersRunning: number;
  ContainersPaused: number;
  ContainersStopped: number;
  Images: number;
  Driver: string;
  DriverStatus: string[][];
  Plugins: Plugins;
  MemoryLimit: boolean;
  SwapLimit: boolean;
  CpuCfsPeriod: boolean;
  CpuCfsQuota: boolean;
  CPUShares: boolean;
  CPUSet: boolean;
  PidsLimit: boolean;
  IPv4Forwarding: boolean;
  Debug: boolean;
  NFd: number;
  OomKillDisable: boolean;
  NGoroutines: number;
  SystemTime: string;
  LoggingDriver: string;
  CgroupDriver: string;
  CgroupVersion: string;
  NEventsListener: number;
  KernelVersion: string;
  OperatingSystem: string;
  OSVersion: string;
  OSType: string;
  Architecture: string;
  IndexServerAddress: string;
  RegistryConfig: RegistryConfig;
  NCPU: number;
  MemTotal: number;
  GenericResources: any;
  DockerRootDir: string;
  HttpProxy: string;
  HttpsProxy: string;
  NoProxy: string;
  Name: string;
  Labels: string[];
  ExperimentalBuild: boolean;
  ServerVersion: string;
  Runtimes: Runtimes;
  DefaultRuntime: string;
  Swarm: Swarm;
  LiveRestoreEnabled: boolean;
  Isolation: string;
  InitBinary: string;
  ContainerdCommit: ContainerdCommit;
  RuncCommit: RuncCommit;
  InitCommit: InitCommit;
  SecurityOptions: string[];
  FirewallBackend: FirewallBackend;
  CDISpecDirs: string[];
  DiscoveredDevices: DiscoveredDevice[];
  Containerd: Containerd;
  Warnings: any;
}

export declare interface Plugins {
  Volume: string[];
  Network: string[];
  Authorization: any;
  Log: string[];
}

export declare interface RegistryConfig {
  IndexConfigs: IndexConfigs;
  InsecureRegistryCIDRs: string[];
  Mirrors: any;
}

export declare interface IndexConfigs extends Record<string, IndexConfig> {}

export declare interface IndexConfig {
  Mirrors: any[];
  Name: string;
  Official: boolean;
  Secure: boolean;
}

export declare interface Runtimes {
  "io.containerd.runc.v2": IoContainerdRuncV2;
  runc: Runc;
}

export declare interface IoContainerdRuncV2 {
  path: string;
  status: IoContainerdRuncV2Status;
}

export declare interface IoContainerdRuncV2Status {
  "org.opencontainers.runtime-spec.features": string;
}

export declare interface Runc {
  path: string;
  status: RunStatus;
}

export declare interface RunStatus {
  "org.opencontainers.runtime-spec.features": string;
}

export declare interface Swarm {
  NodeID: string;
  NodeAddr: string;
  LocalNodeState: string;
  ControlAvailable: boolean;
  Error: string;
  RemoteManagers: any;
}

export declare interface ContainerdCommit {
  ID: string;
}

export declare interface RuncCommit {
  ID: string;
}

export declare interface InitCommit {
  ID: string;
}

export declare interface FirewallBackend {
  Driver: string;
}

export declare interface DiscoveredDevice {
  Source: string;
  ID: string;
}

export declare interface Containerd {
  Address: string;
  Namespaces: Namespaces;
}

export declare interface Namespaces {
  Containers: string;
  Plugins: string;
}
