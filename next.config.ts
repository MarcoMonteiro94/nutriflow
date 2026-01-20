import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Use webpack for builds to support Serwist
  // Turbopack is used for dev, webpack for production build
  turbopack: {},
};

export default withSerwist(nextConfig);
