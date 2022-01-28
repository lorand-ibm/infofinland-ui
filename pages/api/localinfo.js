import { getResource } from 'next-drupal'
import { NODE_TYPES } from '@/lib/DRUPAL_API_TYPES'
import { getLocalInfoParams } from '@/lib/query-params'

export default async function handler(req, res) {
  const { query } = req
  const { uuid, name: city } = query
  // Mocking empty results for page testing
  // Change test implementation when we have real search API
  let status = 200
  const node = await getResource(NODE_TYPES.PAGE, uuid, {
    params: getLocalInfoParams(),
  }).catch((e) => {
    if (e.message === 'Not Found') {
      return null
    }
    throw e
  })

  if (node === null) {
    status = 404
  }

  res.status(status).json({
    node,
    city,
  })
}
