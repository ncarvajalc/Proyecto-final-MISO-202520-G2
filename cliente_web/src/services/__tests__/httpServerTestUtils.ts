import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

type HttpHandler = Parameters<typeof createServer>[0];

type TestServer = {
  url: string;
  close: () => Promise<void>;
};

export const startHttpServer = async (handler: HttpHandler): Promise<TestServer> => {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};
