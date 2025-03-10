const { i18n } = require('./next-i18next.config')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const env = {
  COOKIE_PAGE_PATH: '/cookie-settings',
  FEEDBACK_PAGE_PATH: '/feedback',
  SITEMAP_PAGE_PATH: '/sitemap',
  CITIES_PAGE_PATH: '/cities',
  SEARCH_PAGE_PATH: '/search',
  PRERENDER_LOCALES: i18n.locales,
  // PRERENDER_LOCALES: ['fi', 'en', 'sv', 'ar', 'ru','so','et','zh'],
  DRUPAL_MENUS: {
    MAIN: 'main',
    FOOTER: 'footer-about',
    ABOUT: 'about',
    CITIES: 'cities',
    CITIES_LANDING: 'cities-landing',
  },

  REVALIDATE_TIME: 30, //seconds ,
  FB_URL: 'https://www.facebook.com/infofinland.fi',
  INSTAGRAM_URL: 'https://www.instagram.com/infofinland.fi/',
  YOUTUBE_URL: 'https://www.youtube.com/c/infofinland',
  TWITTER_URL: 'https://twitter.com/InfoFinlandfi',
}

const publicRuntimeConfig = {
  NEXT_PUBLIC_DRUPAL_BASE_URL: process.env.NEXT_PUBLIC_DRUPAL_BASE_URL,
  MATOMO_URL: process.env.MATOMO_URL,
  MATOMO_SITE_ID: process.env.MATOMO_SITE_ID,
  MATOMO_DOMAINS: process.env.MATOMO_DOMAINS,
  SITE_HOST: process.env.SITE_HOST || 'https://www.infofinland.fi',
  ...env,
}

const serverRuntimeConfig = {
  // Will only be available onprocess.env. the server side
  CACHE_REPOPULATE: process.env.CACHE_REPOPULATE || false,
  BUILD_ALL: process.env.BUILD_ALL || false,
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
  elasticsearch_password: process.env.elasticsearch_password,
  elasticsearch_certificate: process.env.elasticsearch_certificate,
  NEXT_IMAGE_DOMAIN: process.env.NEXT_IMAGE_DOMAIN,
  DRUPAL_FRONT_PAGE: process.env.DRUPAL_FRONT_PAGE,
  DRUPAL_SITE_ID: process.env.DRUPAL_SITE_ID,
  DRUPAL_CLIENT_ID: process.env.DRUPAL_CLIENT_ID,
  DRUPAL_PREVIEW_SECRET: process.env.DRUPAL_PREVIEW_SECRET,
  DRUPAL_CLIENT_SECRET: process.env.DRUPAL_CLIENT_SECRET,
  SEARCH_INDEX_PREFIX: process.env.SEARCH_INDEX_PREFIX,
  ...publicRuntimeConfig,
  ...env,
}
/**
 *
 * Export next.config.js values
 */

const config = {
  i18n,
  reactStrictMode: true,
  poweredByHeader: false,
  // Try this if weird caching issues still persist
  // generateEtags: false,
  env,
  publicRuntimeConfig,
  serverRuntimeConfig,
  images: {
    // populate static common image domains envs here manually
    // or via ENV variables
    domains: [process.env.NEXT_IMAGE_DOMAIN],
  },
  // async redirects() {
  //   return [
  //     {
  //       source: '/sitemap.xml',
  //       destination: '/api/sitemap.xml',
  //       permanent: false,
  //     },
  //   ]
  // },
  webpack: (config) => {
    config.module.rules.push({ test: /\.xml$/, loader: 'xml-loader' })
    return config
  },
}

module.exports = withBundleAnalyzer(config)
