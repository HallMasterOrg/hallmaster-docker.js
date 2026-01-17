import DockerContainer from "./DockerContainer";
import DockerSocket from "./DockerSocket";

(async function () {
  const socket = new DockerSocket();

  await socket.init();

  // await socket.authenticate(
  //   "ghcr.io",
  //   "github_username",
  //   "github_pat",
  // );
  // console.log(socket.token);

  // console.log(await socket.info());

  const containersApi = new DockerContainer(socket);
  const containersSummary = await containersApi.stats("XXX", {
    stream: false,
    oneShot: true,
  });
  console.log(containersSummary);
})();
