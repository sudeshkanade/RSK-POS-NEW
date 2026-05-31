import type { NextConfig } from "next";
import os from "os";

function getLocalIPs() {
  const ips = ["localhost", "127.0.0.1"];
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (!interfaces) continue;
      for (const iface of interfaces) {
        if (iface.family === "IPv4" && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
  } catch (e) {}
  return ips;
}

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  allowedDevOrigins: getLocalIPs(),
};

export default nextConfig;
