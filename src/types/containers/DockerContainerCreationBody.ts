export interface DockerContainerCreationBody {
  Hostname: string;
  Domainname: string;
  User: string;
  AttachStdin: boolean;
  AttachStdout: boolean;
  AttachStderr: boolean;
  Tty: boolean;
  OpenStdin: boolean;
  StdinOnce: boolean;
  Env: string[];
  Cmd: string[];
  Entrypoint: string;
  Image: string;
  Labels: Labels;
  Volumes: Volumes;
  WorkingDir: string;
  NetworkDisabled: boolean;
  MacAddress: string;
  ExposedPorts: ExposedPorts;
  StopSignal: string;
  StopTimeout: number;
  HostConfig: HostConfig;
  NetworkingConfig: NetworkingConfig;
}

export interface ExposedPorts extends Record<string, ExposedPort> {}

export interface ExposedPort {}

export interface HostConfig {
  Binds: string[];
  Links: string[];
  Memory: number;
  MemorySwap: number;
  MemoryReservation: number;
  NanoCpus: number;
  CpuPercent: number;
  CpuShares: number;
  CpuPeriod: number;
  CpuRealtimePeriod: number;
  CpuRealtimeRuntime: number;
  CpuQuota: number;
  CpusetCpus: string;
  CpusetMems: string;
  MaximumIOps: number;
  MaximumIOBps: number;
  BlkioWeight: number;
  BlkioWeightDevice: ExposedPort[];
  BlkioDeviceReadBps: ExposedPort[];
  BlkioDeviceReadIOps: ExposedPort[];
  BlkioDeviceWriteBps: ExposedPort[];
  BlkioDeviceWriteIOps: ExposedPort[];
  DeviceRequests: DeviceRequest[];
  MemorySwappiness: number;
  OomKillDisable: boolean;
  OomScoreAdj: number;
  PidMode: string;
  PidsLimit: number;
  PortBindings: PortBindings;
  PublishAllPorts: boolean;
  Privileged: boolean;
  ReadonlyRootfs: boolean;
  Dns: string[];
  DnsOptions: string[];
  DnsSearch: string[];
  VolumesFrom: string[];
  CapAdd: string[];
  CapDrop: string[];
  GroupAdd: string[];
  RestartPolicy: RestartPolicy;
  AutoRemove: boolean;
  NetworkMode: string;
  Devices: any[];
  Ulimits: ExposedPort[];
  LogConfig: LogConfig;
  SecurityOpt: any[];
  StorageOpt: ExposedPort;
  CgroupParent: string;
  VolumeDriver: string;
  ShmSize: number;
}

export interface DeviceRequest {
  Driver: string;
  Count: number;
  'DeviceIDs"': string[];
  Capabilities: Array<string[]>;
  Options: Options;
}

export interface Options {
  property1: string;
  property2: string;
}

export interface LogConfig {
  Type: string;
  Config: ExposedPort;
}

export interface PortBindings extends Record<string, PortBinding[]> {}

export interface PortBinding {
  HostPort: string;
}

export interface RestartPolicy {
  Name: string;
  MaximumRetryCount: number;
}

export interface Labels extends Record<string, string> {}

export interface NetworkingConfig {
  EndpointsConfig: EndpointsConfig;
}

export interface EndpointsConfig {
  isolated_nw: IsolatedNw;
  database_nw: ExposedPort;
}

export interface IsolatedNw {
  IPAMConfig: IPAMConfig;
  Links: string[];
  Aliases: string[];
}

export interface IPAMConfig {
  IPv4Address: string;
  IPv6Address: string;
  LinkLocalIPs: string[];
}

export interface Volumes extends Record<string, Volume> {}

export interface Volume {}
