import Link from 'next/link'
import { IconCheck, IconGlobe } from '@/components/Icons'
import Drawer from '@/components/layout/Drawer'
import { useRouter } from 'next/router'
import cls from 'classnames'

import { useTranslation } from 'next-i18next'

import { i18n } from '@/next-i18next.config'

export const LanguageMenu = ({ closeMenu }) => {
  const { t } = useTranslation('common')
  const { asPath, locale } = useRouter()
  return (
    <div>
      <label className="block px-14 mb-8 text-body-large font-bold">
        {t('languageMenu.label')}
      </label>
      {i18n.languages.map((lang) => {
        const { text, code } = lang
        const isSelected = locale === code
        return (
          <div
            onClick={closeMenu}
            key={`lang-${code}`}
            className={cls({
              'font-bold': isSelected,
            })}
          >
            <Link
              passHref
              href={asPath}
              locale={code}
              scroll={false}
              prefetch={false}
            >
              <a
                className="flex items-center py-2 px-14 hover:bg-gray-white clear-start"
                title={text}
                lang={code}
                hrefLang={code}
              >
                <span className="inline-block w-16 text-body-small font-bold text-gray-medium uppercase text-bodytext-color-op5 pe-8 float-start">
                  {code}
                </span>
                <span className="inline-block text-body-small text-bodytext-color float-start">
                  {text}
                </span>
                {isSelected && <IconCheck className="ms-4" />}
              </a>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export const LangMenuDrawer = ({ closeMenu, isOpen }) => (
  <Drawer close={closeMenu} isOpen={isOpen}>
    <LanguageMenu closeMenu={closeMenu} />
  </Drawer>
)

export const LanguageMenuButton = ({ onClick }) => {
  const { t } = useTranslation('common')
  const { locale } = useRouter()
  const { text } = i18n.languages.find(({ code }) => code === locale)
  return (
    <button
      aria-haspopup="dialog"
      title={t('languageMenu.label')}
      className=" flex lg:hidden items-center h-10 md:me-2"
      onClick={onClick}
    >
      {/* <span className=" inline-block text-action uppercase">{locale}</span> */}
      <span className="text-action uppercase">{text}</span>
      <IconGlobe className="mx-2 xl:mx-0 w-4 md:w-5 md:h-5" />
    </button>
  )
}
