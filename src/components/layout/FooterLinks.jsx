import { IconFacebook, IconInstagram, IconTwitter, IconYoutube } from '../Icons'
import { HERO_MARGIN, ABOUT_MARGIN } from '@/components/layout/Block'
import Link from 'next/link'
import cls from 'classnames'

import { useTranslation } from 'next-i18next'

/**
 * SOME Urls are defined in next.config.js
 * */
const FooterLinks = ({ footerMenu, secondary }) => {
  const { t, language } = useTranslation('common')
  const margin = secondary ? ABOUT_MARGIN : HERO_MARGIN
  return (
    <div className={cls(margin, 'mt-16 mb-16')}>
      <div className="py-10 border-t border-b border-gray ifu-footer__brand">
        <div
          className="mx-auto sm:mx-0 mb-5 ifu-footer__hki-logo"
          lang={language}
        />

        <p className=" mx-8 md:mx-0 text-tiny text-center sm:text-left text-gray">
          {t('footer.helsinkiDisclaimer')}
        </p>
      </div>
      <div className="flex justify-center sm:justify-start items-center py-11 sm:py-7 mb-5 space-s-4">
        <a
          href={process.env.FB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <IconFacebook title="Facebook" />
        </a>

        <a
          href={process.env.TWITTER_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <IconTwitter title="Twitter" />
        </a>

        <a
          href={process.env.INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <IconInstagram title="Instagram" />
        </a>

        <a
          href={process.env.YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block"
        >
          <IconYoutube title="Youtube" />
        </a>
      </div>

      <div className="mb-4 text-center sm:text-left divide-black divide-s">
        {footerMenu.tree.map(({ title, url }, i) => {
          return (
            <Link href={url} passHref key={`footer-link-${i}`} prefetch={false}>
              <a className="ifu-footer__link">{title}</a>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
export default FooterLinks
