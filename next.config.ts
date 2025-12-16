
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'https://6000-firebase-studio-1750130770515.cluster-bg6uurscprhn6qxr6xwtrhvkf6.cloudworkstations.dev',
    'http://6000-firebase-studio-1750130770515.cluster-bg6uurscprhn6qxr6xwtrhvkf6.cloudworkstations.dev'
  ],
};

export default nextConfig;
