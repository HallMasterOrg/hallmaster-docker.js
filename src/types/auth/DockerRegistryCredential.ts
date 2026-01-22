export interface DockerRegistryCredential {
  serveraddress: string; // https://index.docker.io/v1/, ghcr.io, localhost:5000, ...
  username: string;
  password: string;
}
