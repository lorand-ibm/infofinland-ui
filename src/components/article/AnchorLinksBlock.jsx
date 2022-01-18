import { CONTENT_TYPES } from '@/lib/DRUPAL_API_TYPES'
import { headingHash } from './ContentMapper'
import Block from '../layout/Block'

const HEADING_TYPES = [CONTENT_TYPES.HEADING, CONTENT_TYPES.ACCORDION]
const AnchorLinksBlock = ({ field_content }) => {
  const headings = field_content
    .filter(({ type }) => HEADING_TYPES.includes(type))
    .map(({ field_title, field_accordion_items, id }) => {
      if (field_title) {
        return { title: field_title, id }
      }
      return field_accordion_items.map(
        ({ field_accordion_item_heading: title, id }) => ({ id, title })
      )
    })
    .flat()

  return (
    <Block>
      <ul className="py-4 mb-4 list-disc list-outside ms-4 ps-4">
        {headings.map(({ id, title }) => {
          return (
            <li className="ps-2" key={`heading-anchor-${id}`}>
              <a href={headingHash(id)} className="font-bold text-link">
                {title}
              </a>
            </li>
          )
        })}
      </ul>
    </Block>
  )
}

export default AnchorLinksBlock
