import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexus Wealth Enterprise',
    short_name: 'Nexus',
    description: 'Enterprise Financial Workspace terintegrasi AI',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F19',
    theme_color: '#10B981',
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/512/2953/2953363.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}