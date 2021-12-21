import cls from 'classnames'
import { longTextClass } from '@/components/Typo'
import { IconCalendar } from '@/components/Icons'
import { DateTime } from 'luxon'

import { useRouter } from 'next/router'
import { BLOCK_MARGIN, HERO_MARGIN } from '@/components/layout/Block'

export default function ArticleHeading({
  heroImage,
  title,
  date,
  themeHero,
  fiTitle,
}) {
  const { locale } = useRouter()
  const titleMargin = themeHero ? HERO_MARGIN : BLOCK_MARGIN
  return (
    <div className={titleMargin}>
      <div className={cls({ 'absolute bottom-5 md:bottom-8': !heroImage })}>
        {/* article category */}
        <span
          lang="fi"
          className={cls('block text-action mb-3', {
            'text-gray-darker': heroImage,
            'text-bodytext-color mt-6': !heroImage,
            invisible: locale === 'fi',
          })}
        >
          {fiTitle}
        </span>
        {/* article title / hero text */}
        <h1
          className={cls(
            'mb-2 md:mb-6  max-w-article me-2 ifu-hero__title',
            longTextClass(title, {
              size: 40,
              classes: [
                ' text-h2 md:text-h1xl',
                'text-h3 md:text-h3 lg:text-h1',
              ],
            })
          )}
        >
          {title}
        </h1>
        {/* article date */}
        <div className="flex items-center mb-8 text-body-small text-bodytext-color">
          <IconCalendar className="md:w-4 md:h-4 transform translate-y-px" />
          <span className="px-2 transform translate-y-px">
            {DateTime.fromISO(date).toFormat('dd.MM.yyyy')}
          </span>
        </div>
      </div>
    </div>
  )
}