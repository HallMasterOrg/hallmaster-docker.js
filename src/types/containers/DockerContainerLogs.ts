export interface DockerContainerLog {
  content: string;
  stream: "STDOUT" | "STDERR";
}
