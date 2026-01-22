export declare interface DockerVersion {
  Platform: Platform;
  Components: Component[];
  Version: string;
  ApiVersion: string;
  MinAPIVersion: string;
  GitCommit: string;
  GoVersion: string;
  Os: string;
  Arch: string;
  KernelVersion: string;
  BuildTime: string;
}

export declare interface Platform {
  Name: string;
}

export declare interface Component {
  Name: string;
  Version: string;
  Details: Details;
}

export declare interface Details {
  ApiVersion?: string;
  Arch?: string;
  BuildTime?: string;
  Experimental?: string;
  GitCommit: string;
  GoVersion?: string;
  KernelVersion?: string;
  MinAPIVersion?: string;
  Os?: string;
}
