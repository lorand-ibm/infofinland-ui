import cls from 'classnames'
import { useAtomValue } from 'jotai/utils'
import { feedbackPageAtom } from '@/src/store'

import ParseHtml from '../ParseHtml'

const InfoBlock = () => {
  const { field_content } = useAtomValue(feedbackPageAtom) || []
  return (
    <div className={cls('mt-8 xl:mt-0 text-body-small')}>
      {field_content?.map(({ field_text, id }) => {
        if (!field_text?.processed) {
          return null
        }
        return (
          <ParseHtml html={field_text?.processed} key={`feedback-info-${id}`} />
        )
      })}
    </div>
  )
}

export default InfoBlock
