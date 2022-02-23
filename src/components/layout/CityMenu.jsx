import Drawer from './Drawer'
import { useAtom } from 'jotai'
import {
  selectedCityAtom,
  cityMenuVisibilityAtom,
  municipalitiesAtom,
} from '@/src/store'
import { IconCheck } from '@/components/Icons'
import cls from 'classnames'
import { useAtomValue } from 'jotai/utils'

const CityMenu = () => {
  const [open, setOpen] = useAtom(cityMenuVisibilityAtom)
  const [city, setCity] = useAtom(selectedCityAtom)
  const municipalities = useAtomValue(municipalitiesAtom)
  const close = () => setOpen(false)
  const chooseCity = ({ target: { value } }) => {
    value && value !== city && setCity(value)
    close()
  }
  return (
    <Drawer close={close} isOpen={open} left>
      <ul className="mb-16">
        <li className="px-14 mb-4 text-body-large font-bold">Choose city</li>
        {municipalities?.map(({ name: cityName, id }) => (
          <li
            key={`municipality-${id}`}
            className={cls('block', {
              // 'bg-gray-lighter-teal': city === cityName,
            })}
          >
            <button
              value={cityName}
              aria-current={city === cityName}
              onClick={chooseCity}
              className="
            py-2 px-14 block  text-body-small text-bodytext-color w-full text-left"
            >
              {cityName}
              {city === cityName && <IconCheck className="ms-4" />}
            </button>
          </li>
        ))}
      </ul>
    </Drawer>
  )
}

export default CityMenu
