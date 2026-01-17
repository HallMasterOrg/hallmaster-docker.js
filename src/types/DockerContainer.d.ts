export interface DockerContainer {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  State: State;
  Image: string;
  ResolvConfPath: string;
  HostnamePath: string;
  HostsPath: string;
  LogPath: string;
  Name: string;
  RestartCount: number;
  Driver: string;
  Platform: string;
  ImageManifestDescriptor: ImageManifestDescriptor;
  MountLabel: string;
  ProcessLabel: string;
  AppArmorProfile: string;
  ExecIDs: string[];
  HostConfig: HostConfig;
  GraphDriver: GraphDriver;
  SizeRw: number;
  SizeRootFs: number;
  Mounts: HostConfigMount[];
  Config: Config;
  NetworkSettings: NetworkSettings;
}

export interface State {
  Status: string;
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid: number;
  ExitCode: number;
  Error: string;
  StartedAt: string;
  FinishedAt: string;
  Health: Health;
}

export interface Health {
  Status: string;
  FailingStreak: number;
  Log: Log[];
}

export interface Log {
  Start: string;
  End: string;
  ExitCode: number;
  Output: string;
}

export interface ImageManifestDescriptor {
  mediaType: string;
  digest: string;
  size: number;
  urls: string[];
  annotations: Annotations;
  data: any;
  platform: Platform;
  artifactType: any;
}

export interface Annotations extends Record<string, string> {
  "com.docker.official-images.bashbrew.arch": string;
  "org.opencontainers.image.base.digest": string;
  "org.opencontainers.image.base.name": string;
  "org.opencontainers.image.created": string;
  "org.opencontainers.image.revision": string;
  "org.opencontainers.image.source": string;
  "org.opencontainers.image.url": string;
  "org.opencontainers.image.version": string;
}

export interface Platform {
  architecture: string;
  os: string;
  "os.version": string;
  "os.features": string[];
  variant: string;
}

export interface HostConfig {
  CpuShares: number;
  Memory: number;
  CgroupParent: string;
  BlkioWeight: number;
  BlkioWeightDevice: BlkioWeightDevice[];
  BlkioDeviceReadBps: BlkioDeviceReadBp[];
  BlkioDeviceWriteBps: BlkioDeviceWriteBp[];
  BlkioDeviceReadIOps: BlkioDeviceReadIop[];
  BlkioDeviceWriteIOps: BlkioDeviceWriteIop[];
  CpuPeriod: number;
  CpuQuota: number;
  CpuRealtimePeriod: number;
  CpuRealtimeRuntime: number;
  CpusetCpus: string;
  CpusetMems: string;
  Devices: Device[];
  DeviceCgroupRules: string[];
  DeviceRequests: DeviceRequest[];
  KernelMemoryTCP: number;
  MemoryReservation: number;
  MemorySwap: number;
  MemorySwappiness: number;
  NanoCpus: number;
  OomKillDisable: boolean;
  Init: boolean;
  PidsLimit: number;
  Ulimits: Ulimit[];
  CpuCount: number;
  CpuPercent: number;
  IOMaximumIOps: number;
  IOMaximumBandwidth: number;
  Binds: string[];
  ContainerIDFile: string;
  LogConfig: LogConfig;
  NetworkMode: string;
  PortBindings: PortBindings;
  RestartPolicy: RestartPolicy;
  AutoRemove: boolean;
  VolumeDriver: string;
  VolumesFrom: string[];
  Mounts: HostConfigMount[];
  ConsoleSize: number[];
  Annotations: HostAnnotations;
  CapAdd: string[];
  CapDrop: string[];
  CgroupnsMode: string;
  Dns: string[];
  DnsOptions: string[];
  DnsSearch: string[];
  ExtraHosts: string[];
  GroupAdd: string[];
  IpcMode: string;
  Cgroup: string;
  Links: string[];
  OomScoreAdj: number;
  PidMode: string;
  Privileged: boolean;
  PublishAllPorts: boolean;
  ReadonlyRootfs: boolean;
  SecurityOpt: string[];
  StorageOpt: StorageOptions;
  Tmpfs: Tmpfs;
  UTSMode: string;
  UsernsMode: string;
  ShmSize: number;
  Sysctls: Sysctls;
  Runtime: string;
  Isolation: string;
  MaskedPaths: string[];
  ReadonlyPaths: string[];
}

export interface BlkioWeightDevice {
  Path: string;
  Weight: number;
}

export interface BlkioDeviceReadBp {
  Path: string;
  Rate: number;
}

export interface BlkioDeviceWriteBp {
  Path: string;
  Rate: number;
}

export interface BlkioDeviceReadIop {
  Path: string;
  Rate: number;
}

export interface BlkioDeviceWriteIop {
  Path: string;
  Rate: number;
}

export interface Device {
  PathOnHost: string;
  PathInContainer: string;
  CgroupPermissions: string;
}

export interface DeviceRequest {
  Driver: string;
  Count: number;
  DeviceIDs: string[];
  Capabilities: string[][];
  Options: Options;
}

export interface Options extends Record<string, string> {}

export interface Ulimit {
  Name: string;
  Soft: number;
  Hard: number;
}

export interface LogConfig {
  Type: string;
  Config: LogConfigInternal;
}

export interface LogConfigInternal {
  "max-file": string;
  "max-size": string;
}

export interface PortBindings extends Record<string, string> {}

export interface PortBinding {
  HostIp: string;
  HostPort: string;
}

export interface RestartPolicy {
  Name: string;
  MaximumRetryCount: number;
}

export interface HostConfigMount {
  Target: string;
  Source: string;
  Type: string;
  ReadOnly: boolean;
  Consistency: string;
  BindOptions: BindOptions;
  VolumeOptions: VolumeOptions;
  ImageOptions: ImageOptions;
  TmpfsOptions: TmpfsOptions;
}

export interface BindOptions {
  Propagation: string;
  NonRecursive: boolean;
  CreateMountpoint: boolean;
  ReadOnlyNonRecursive: boolean;
  ReadOnlyForceRecursive: boolean;
}

export interface VolumeOptions {
  NoCopy: boolean;
  Labels: VolumeOptionsLabels;
  DriverConfig: DriverConfig;
  Subpath: string;
}

export interface VolumeOptionsLabels extends Record<string, string> {}

export interface DriverConfig {
  Name: string;
  Options: DriverConfigOptions;
}

export interface DriverConfigOptions extends Record<string, string> {}

export interface ImageOptions {
  Subpath: string;
}

export interface TmpfsOptions {
  SizeBytes: number;
  Mode: number;
  Options: string[][];
}

export interface HostAnnotations extends Record<string, string> {}

export interface StorageOptions extends Record<string, string> {}

export interface Tmpfs extends Record<string, string> {}

export interface Sysctls extends Record<string, string> {}

export interface GraphDriver {
  Name: string;
  Data: Data;
}

export interface Data {
  MergedDir: string;
  UpperDir: string;
  WorkDir: string;
}

export interface HostConfigMount {
  Type: string;
  Name: string;
  Source: string;
  Destination: string;
  Driver: string;
  Mode: string;
  RW: boolean;
  Propagation: string;
}

export interface Config {
  Hostname: string;
  Domainname: string;
  User: string;
  AttachStdin: boolean;
  AttachStdout: boolean;
  AttachStderr: boolean;
  ExposedPorts: ExposedPorts;
  Tty: boolean;
  OpenStdin: boolean;
  StdinOnce: boolean;
  Env: string[];
  Cmd: string[];
  Healthcheck: Healthcheck;
  ArgsEscaped: boolean;
  Image: string;
  Volumes: Volumes;
  WorkingDir: string;
  Entrypoint: any[];
  NetworkDisabled: boolean;
  MacAddress: string;
  OnBuild: any[];
  Labels: ConfigLabels;
  StopSignal: string;
  StopTimeout: number;
  Shell: string[];
}

export interface ExposedPorts extends Record<string, ExposedPort> {}

export interface ExposedPort {}

export interface Healthcheck {
  Test: string[];
  Interval: number;
  Timeout: number;
  Retries: number;
  StartPeriod: number;
  StartInterval: number;
}

export interface Volumes extends Record<string, VolumeAdditionalProp> {}

export interface VolumeAdditionalProp {}

export interface ConfigLabels extends Record<string, string> {}

export interface NetworkSettings {
  Bridge: string;
  SandboxID: string;
  HairpinMode: boolean;
  LinkLocalIPv6Address: string;
  LinkLocalIPv6PrefixLen: string;
  Ports: Ports;
  SandboxKey: string;
  SecondaryIPAddresses: SecondaryIpaddress[];
  SecondaryIPv6Addresses: SecondaryIpv6Address[];
  EndpointID: string;
  Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  MacAddress: string;
  Networks: Networks;
}

export interface Ports extends Record<string, Port[]> {}

export interface Port {
  HostIp: string;
  HostPort: string;
}

export interface SecondaryIpaddress {
  Addr: string;
  PrefixLen: number;
}

export interface SecondaryIpv6Address {
  Addr: string;
  PrefixLen: number;
}

export interface Networks extends Record<string, Network> {}

export interface Network {
  IPAMConfig: Ipamconfig;
  Links: string[];
  MacAddress: string;
  Aliases: string[];
  DriverOpts: DriverOpts;
  GwPriority: number[];
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  DNSNames: string[];
}

export interface Ipamconfig {
  IPv4Address: string;
  IPv6Address: string;
  LinkLocalIPs: string[];
}

export interface DriverOpts extends Record<string, string> {}
