export interface DockerContainerPrune {
  ContainersDeleted: string[];
  SpaceReclaimed: number; // in bytes
}
