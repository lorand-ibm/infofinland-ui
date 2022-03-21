import * as Elastic from '@/lib/elasticsearch'

export default async function handler(req, res) {
  const size = 10
  const { q, from, locale } = Elastic.getSearchParamsFromQuery(req)
  let search = { results: {}, error: 'no search params given' }
  const elastic = Elastic.getSearchClient()

  if (q) {
    let index = Elastic.getIndexName(locale)
    const indexExists = await elastic.indices.exists({ index })

    if (!indexExists) {
      console.warn(Elastic.getIndexWarning({index,q}))
      index = undefined
    }

    search = await elastic.search({ q, size, from, index }).catch((e) => {
      console.error(
        Elastic.ERROR,
        e?.meta?.body?.error?.root_cause || e?.name || e
      )
      throw e
    })
  }

  res.status(200).json({
    q,
    size,
    from,
    ...search,
  })
}
