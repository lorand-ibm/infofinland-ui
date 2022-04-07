import getConfig from 'next/config'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import {
  getMenu,
  getResourceFromContext,
  getResourceTypeFromContext,
} from 'next-drupal'
import ArticlePage from '@/src/page-templates/ArticlePage'
import AboutPage from '@/src/page-templates/AboutPage'
import { i18n } from '@/next-i18next.config'
import { NODE_TYPES } from '@/lib/DRUPAL_API_TYPES'
import {
  getMenus,
  NOT_FOUND,
  getQueryParamsFor,
  getDefaultLocaleNode,
  menuErrorResponse,
  getThemeHeroImages,
} from '@/lib/ssr-api'
import { addPrerenderLocalesToPaths } from '@/lib/ssr-helpers'
import { LAYOUT_SMALL } from '@/components/layout/Layout'
import { NO_DEFAULT_LOCALE } from '@/lib/ssr-api'
import HomePage from '@/src/page-templates/HomePage'
import { DateTime } from 'luxon'

export async function getStaticPaths() {
  const { DRUPAL_MENUS } = getConfig().serverRuntimeConfig
  // prerender all theme pages from main menu and cities menu
  const menus = (
    await Promise.all([
      getMenu(DRUPAL_MENUS.MAIN, {
        locale: 'en',
        defaultLocale: NO_DEFAULT_LOCALE,
      }),
      getMenu(DRUPAL_MENUS.CITIES, {
        locale: 'en',
        defaultLocale: NO_DEFAULT_LOCALE,
      }),
    ])
  )
    .map(({ tree }) =>
      tree.map(({ url }) => {
        //remove root slash and language code
        const [, , ...slug] = url.split('/')
        return {
          params: {
            slug,
          },
        }
      })
    )
    .flat()
  // add predefined prerender locales to urls from mainmenu.
  // any language should do. english should do the most.
  const paths = addPrerenderLocalesToPaths([
    {
      //prerender frontpage
      params: { slug: [''] },
    },
    ...menus,
  ])

  return {
    paths,
    fallback: 'blocking',
  }
}

export async function getStaticProps(context) {
  const { serverRuntimeConfig } = getConfig()
  const { params, locale } = context
  params.slug = params.slug || ['/']

  const localePath = ['', locale, ...params.slug].join('/')
  const isNodePath = /node/.test(params.slug[0])

  const type = await getResourceTypeFromContext({
    locale,
    defaultLocale: NO_DEFAULT_LOCALE,
    params,
  })

  //Allow only pages and landing pages to be queried
  if (![NODE_TYPES.PAGE, NODE_TYPES.LANDING_PAGE].includes(type)) {
    console.error(
      `Error resolving page ${localePath} Node type not allowed:`,
      type
    )
    return NOT_FOUND
  }

  const node = await getResourceFromContext(
    type,
    {
      locale,
      ...context,

      //Dont use default locale. Drupal and UI have different default locales.
      //Always explicitly set the locale for drupal queries
      defaultLocale: NO_DEFAULT_LOCALE,
    },
    {
      params: getQueryParamsFor(type),
    }
  ).catch((e) => {
    console.error(`Error requesting node ${localePath}`, type, e)
    // throw e
  })

  // Return 404 if node was null
  if (!node) {
    console.warn(`Warning: no valid node for ${localePath}`)
    return NOT_FOUND
  }

  if (isNodePath) {
    if (node.path?.alias) {
      return {
        redirect: {
          permanent: false,
          destination: `/${locale}/${node.path.alias}`,
        },
      }
    } else {
      console.warn(
        `Warning: request to direct node ${localePath} blocked. 404 returned `
      )
    }
  }

  let fiNode = null // Must be JSON compatible

  if (type === NODE_TYPES.PAGE) {
    // Get finnish title if page is not in finnish
    if (context.locale !== i18n.fallbackLocale) {
      fiNode = await getDefaultLocaleNode(node.id).catch((e) => {
        console.error('Error while getting Finnish title', localePath, e)
        return null
      })
    }
  }

  let menus = {}
  if (node.field_layout === 'small') {
    let menuName = serverRuntimeConfig.DRUPAL_MENUS.ABOUT
    let menu = await getMenu(menuName, {
      locale,
      defaultLocale: NO_DEFAULT_LOCALE,
    })
    menus = { [menuName]: menu }
  } else {
    menus = await getMenus({ ...context, id: node.id })
  }

  let themeMenu = menuErrorResponse()
  let themes = null
  const { field_theme_menu_machine_name } = node
  if (field_theme_menu_machine_name) {
    themeMenu = menus[node.field_theme_menu_machine_name]
    if (!themeMenu) {
      themeMenu = await getMenu(field_theme_menu_machine_name, {
        locale,
        defaultLocale: NO_DEFAULT_LOCALE,
      })
    }
  }

  if (type === NODE_TYPES.LANDING_PAGE) {
    const themeImages = await getThemeHeroImages({
      tree: menus.main.tree,
      context,
    })

    themes = menus.main.tree.map(({ url, title, id }, i) => {
      const image = themeImages[i]
      return { url, title, id, image: image?.src || null }
    })
  }

  const lastUpdated = DateTime.fromISO(node.revision_timestamp).toFormat(
    'dd.MM.yyyy'
  )

  return {
    props: {
      key: node.id,
      type,
      themes,
      menus,
      node: { ...node, lastUpdated },
      themeMenu,
      fiNode,
      ...(await serverSideTranslations(context.locale, ['common'])),
    },
    revalidate: serverRuntimeConfig.REVALIDATE_TIME,
  }
}

/***
 * Layout selector:
 */
const Page = (props) => {
  if (props?.type === NODE_TYPES.LANDING_PAGE) {
    return <HomePage {...props} />
  }
  if (props?.node?.field_layout === LAYOUT_SMALL) {
    return <AboutPage {...props} />
  }
  return <ArticlePage {...props} />
}

export default Page
