import { getMenu, getResource } from 'next-drupal'
import { sample } from 'lodash'
import { i18n } from '../../next-i18next.config'
import axios from 'axios'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import getConfig from 'next/config'

export const NODE_TYPES = {
  PAGE: 'node--page',
  LANDING_PAGE: 'node--landing_page',
  PVT_NODE: 'node--office_contact_info',
}
export const CONTENT_TYPES = {
  TEXT: 'paragraph--text',
  HEADING: 'paragraph--heading',
  PARAGRAPH_IMAGE: 'paragraph--image',
  ACCORDION: 'accordion',
  HERO: 'paragraph--hero',
  COLUMNS: 'columns',
  READMORE: 'paragraph--language_link_collection',
  READMORE_LINK_COLLECTION: 'node--link',
  READMORE_LINK: 'paragraph--language_link',
  LOCALINFO: 'local',
  FILE: 'file--file',
  PVT: 'paragraph--ptv_contact',
  PVT_NODE: 'node--office_contact_info',
  MEDIA_IMAGE: 'media--image',
}

//always use locale path for drupal api queries
const NO_DEFAULT_LOCALE = 'dont-use'
const LINK_TRANSLATION_MISSING = '--missing--'
const disableDefaultLocale = (locale) => ({
  locale,
  defaultLocale: NO_DEFAULT_LOCALE,
})

const API_URLS = {
  uriFromFile: (file) =>
    `${getConfig().serverRuntimeConfig.NEXT_PUBLIC_DRUPAL_BASE_URL}${
      file.uri.url
    }`,
  getPage: ({ locale, defaultLocale, id, queryString }) =>
    `${getConfig().serverRuntimeConfig.NEXT_PUBLIC_DRUPAL_BASE_URL}/${
      locale || defaultLocale
    }/jsonapi/node/page/${id}?${queryString || ''}`,
}

const menuErrorResponse = () => ({ items: [], tree: [], error: 'menu-error' })
const AXIOS_ERROR_RESPONSE = { data: null }

export const resolvePath = async ({ path, context }) => {
  const { serverRuntimeConfig } = getConfig()
  const { locale, defaultLocale } = context
  const URL = `${serverRuntimeConfig.NEXT_PUBLIC_DRUPAL_BASE_URL}/${
    locale || defaultLocale
  }/router/translate-path`
  return axios.get(URL, {
    params: { path, _format: 'json' },
  })
}

export const getPageById = async (id, { locale, defaultLocale }) => {
  const queryString = new DrupalJsonApiParams()
    // //published pages only
    // .addFilter("status", "1")
    //Relations
    .addInclude([
      // Image
      'field_content.field_image.field_media_image',
      // Link Collectin
      'field_content.field_link_collection.field_links',
      // Hero
      'field_hero.field_hero_image.field_media_image',
      // PVT contact
      'field_content.field_contact_data',
    ])
    .addFields(NODE_TYPES.PAGE, [
      'id',
      'title',
      'revision_timestamp',
      'langcode',
      'field_content',
      'field_hero',
      'field_description',
      'field_has_hero',
      'field_metatags',
    ])
    // .addFields('node--page', ['id', 'title', 'revision_timestamp','langcode'])
    .addFields(CONTENT_TYPES.TEXT, ['field_text'])
    .addFields(CONTENT_TYPES.HEADING, ['field_title'])
    .addFields(CONTENT_TYPES.MEDIA_IMAGE, ['field_media_image'])
    .addFields(CONTENT_TYPES.HERO, ['field_hero_title', 'field_hero_image'])
    .addFields(CONTENT_TYPES.FILE, ['uri', 'url'])
    .addFields(CONTENT_TYPES.PVT, ['field_contact_data'])
    .addFields(CONTENT_TYPES.PVT_NODE, [
      'field_email_address',
      'field_office_id',
      'field_phonenumber',
      'field_postal_address',
      'field_postal_address_additional',
      'field_service_hours',
      'field_visiting_address',
      'field_visiting_address_additional',
      'title',
    ])
    //Link  relations
    .addFields(CONTENT_TYPES.READMORE, ['field_link_collection'])
    .addFields(CONTENT_TYPES.READMORE_LINK_COLLECTION, [
      'field_link_target_site',
      'title',
      'field_links',
    ])
    .addFields(CONTENT_TYPES.READMORE_LINK, [
      'field_language_link',
      'field_language',
    ])
    //DO not encode! Axios will do that
    // .getQueryObject()
    .getQueryString({ encode: false })
  // return getResource(NODE_TYPES.PAGE, id, {
  //   locale,
  //   defaultLocale: NO_DEFAULT_LOCALE,
  //   // params,
  //  })
  return axios.get(API_URLS.getPage({ locale, defaultLocale, id, queryString }))
}

export const getPageWithContentByPath = async ({ path, context }) => {
  // console.log('ENV VALUE IN BUILD & RUNTIME', {
  //   siteid: process.env.DRUPAL_SITE_ID,
  //   test: process.env.TEST,
  // })
  const { data: pathNode } = await resolvePath({ path, context }).catch((e) => {
    console.error(
      'Router error for',
      ['', context.locale, path].join('/'),
      e.response?.data?.message || e.response?.data,
      e.response?.data?.details
    )
    return AXIOS_ERROR_RESPONSE
  })
  // Error in resolving path. returns 404 in getStaticProps
  if (!pathNode) {
    return null
  }
  const {
    entity: { uuid: id },
  } = pathNode

  const { data: page } = await getPageById(id, context).catch((e) => {
    console.error('Error while resolving page node')
    const { data, status, statusText } = e.response
    // Error in resolving page node. returns 500 in getStaticProps
    throw new Error({ data, status, statusText })
  })

  const included = page.included || []
  let content = []

  if (page.included) {
    content = await resolveContent(
      page.included.map((item) => {
        const { type, id, attributes, ...rest } = item
        return { type, id, ...attributes, ...rest }
      }),
      context
    )
  }

  const hero = content.find(({ type }) => type === CONTENT_TYPES.HERO) || null
  const { attributes, ...restOfNode } = page.data
  const node = { content, included, ...attributes, ...restOfNode, hero }
  let fiNode = { title: node?.title || '' }

  //Get Finnish title for non-finnish pages
  if (context.locale !== i18n.fallbackLocale) {
    fiNode = await getDefaultLocaleNode(id).catch(() => {
      // error in retriving finnish title.
      // Ignore and return current language title.
      console.error('Error retrieving finnish title')
      return {
        title: node.title,
      }
    })
  }
  return { ...node, fiTitle: fiNode.title }
}

export const getMainMenu = async (context) =>
  getMenu(getConfig().serverRuntimeConfig.DRUPAL_MENUS.MAIN, context)

export const getContent = ({ field_content }, { locale }) =>
  Promise.all(
    field_content.map(({ type, id }) =>
      getResource(type, id, disableDefaultLocale(locale))
    )
  )

export const getFooterAboutMenu = async ({ locale }) =>
  getMenu(
    getConfig().serverRuntimeConfig.DRUPAL_MENUS.FOOTER,
    disableDefaultLocale(locale)
  )

export const getAboutMenu = async ({ locale }) =>
  getMenu(getConfig().serverRuntimeConfig.DRUPAL_MENUS.ABOUT, {
    locale,
    defaultLocale: NO_DEFAULT_LOCALE,
  })

export const getCommonApiContent = async (
  { locale },
  main = getConfig().serverRuntimeConfig.DRUPAL_MENUS.MAIN,
  footer = getConfig().serverRuntimeConfig.DRUPAL_MENUS.FOOTER
) => {
  const context = { locale, defaultLocale: NO_DEFAULT_LOCALE }
  const [menu, footerMenu, translations] = await Promise.all([
    //Main menu or whatever is called
    getMenu(main, context).catch((e) => {
      console.error('menu error', e)
      return menuErrorResponse(e)
    }),
    //Footer Menu
    getMenu(footer, context).catch((e) => {
      console.error('footerMenu error', e)
      return menuErrorResponse(e)
    }),
  ]).catch((e) => {
    throw e
  })

  return {
    menu,
    footerMenu,
    color: sample(getConfig().serverRuntimeConfig.HERO_COLORS),
    ...translations,
  }
}

export const getDefaultLocaleNode = async (id) =>
  getResource(NODE_TYPES.PAGE, id, {
    locale: i18n.defaultLocale,
    defaultLocale: NO_DEFAULT_LOCALE,

    // TODO make this work with params.fields to reduce unused payload
  })

const getReadMoreLinks = async ({
  item: { relationships },
  linkCollections,
  links,
  locale: reqLang,
}) => {
  let content = []
  const linksIds = relationships.field_link_collection.data.map(({ id }) => id)
  const linkCollection = linkCollections.filter(({ id }) =>
    linksIds.includes(id)
  )

  content = await Promise.all(
    linkCollection.map(
      async ({ relationships, title, field_link_target_site: siteName }) => {
        const relatedLinksIds = relationships.field_links.data.map(
          ({ id }) => id
        )

        const relatedLinks = links.filter(({ id }) =>
          relatedLinksIds.includes(id)
        )

        const languages = await Promise.all(
          relatedLinks.map(
            async ({ field_language_link: url, relationships }) => {
              const queryString = new DrupalJsonApiParams()
                .addFields('taxonomy_term--language', ['name', 'field_locale'])
                .getQueryString({ encode: false })

              const { data: translation } = await axios.get(
                `${relationships.field_language.links.related.href}?${queryString}`
              )
              if (!translation) {
                return { url, text: LINK_TRANSLATION_MISSING, locale: reqLang }
              }
              return {
                url,
                text: translation?.data.attributes.name,
                locale: translation?.data.attributes.field_locale,
              }
            }
          )
        )

        let mainTranslation
        if (languages.length === 1) {
          mainTranslation = languages.at(0)
        } else {
          // Prefer link with current language
          mainTranslation = languages.find(({ locale }) => locale === reqLang)
          // if not, use default locale (en)
          if (!mainTranslation) {
            mainTranslation = languages.find(
              ({ locale }) => locale === i18n.defaultLocale
            )
          }
          // if not, use fallback locale (fi)
          if (!mainTranslation) {
            mainTranslation = languages.find(
              ({ locale }) => locale === i18n.fallbackLocale
            )
          }
        }
        // Sort language links to the same order as site languages are configured
        const sorted = languages
          .slice()
          .sort(
            (a, b) =>
              i18n.locales.indexOf(a.locale) - i18n.locales.indexOf(b.locale)
          )

        return {
          pageName: title,
          siteName,
          mainTranslation,
          languages: sorted,
        }
      }
    )
  )
  return content
}

export const addPrerenderLocalesToPaths = (paths) =>
  getConfig()
    .serverRuntimeConfig.PRERENDER_LOCALES.map((locale) =>
      paths.map((path) => ({ ...path, locale }))
    )
    .flat()

const getImageForParagraphImage = ({
  item: { relationships },
  media,
  files,
}) => {
  const mediaId = relationships?.field_image?.data?.id
  const mediaItem = media.find(({ id }) => id === mediaId).relationships
    ?.field_media_image?.data
  const file = files.find(({ id }) => id === mediaItem.id)
  const src = API_URLS.uriFromFile(file)

  return { ...mediaItem.meta, src }
}

const getHeroUrl = ({ item: { relationships }, media, files }) => {
  const mediaId = relationships.field_hero_image.data.id
  const mediaItem = media.find(({ id }) => id === mediaId)
  if (!mediaItem) {
    return null
  }
  const fileId = mediaItem.relationships.field_media_image.data.id
  const file = files.find(({ id }) => id === fileId)
  return API_URLS.uriFromFile(file)
}

const getPVTNode = ({ item: { relationships }, pvtNodes }) =>
  pvtNodes.find(
    ({ id }) => id === relationships?.field_contact_data.data.at(0).id
  )

export const resolveContent = async (content, { locale }) => {
  if (content?.length === 0) {
    return null
  }

  const media = content.filter(({ type }) => type == CONTENT_TYPES.MEDIA_IMAGE)
  const files = content.filter(({ type }) => type === CONTENT_TYPES.FILE)
  const linkCollections = content.filter(
    ({ type }) => type === CONTENT_TYPES.READMORE_LINK_COLLECTION
  )
  const links = content.filter(
    ({ type }) => type === CONTENT_TYPES.READMORE_LINK
  )

  const pvtNodes = content.filter(({ type }) => type == CONTENT_TYPES.PVT_NODE)

  const paragraphs = content.filter(({ type }) =>
    [
      CONTENT_TYPES.READMORE,
      CONTENT_TYPES.PARAGRAPH_IMAGE,
      CONTENT_TYPES.TEXT,
      CONTENT_TYPES.HEADING,
      CONTENT_TYPES.HERO,
      CONTENT_TYPES.PVT,
    ].includes(type)
  )

  return await Promise.all(
    paragraphs.map(async (item) => {
      const { type } = item
      switch (type) {
        case CONTENT_TYPES.PARAGRAPH_IMAGE:
          return {
            ...item,
            ...getImageForParagraphImage({ item, media, files }),
          }
        case CONTENT_TYPES.READMORE:
          return {
            ...item,
            content: await getReadMoreLinks({
              item,
              linkCollections,
              links,
              locale,
            }),
          }

        case CONTENT_TYPES.HERO:
          return {
            type: item.type,
            url: getHeroUrl({ item, media, files }),
          }
        case CONTENT_TYPES.PVT:
          return getPVTNode({ item, pvtNodes })

        default:
          return item
      }
    })
  )
}