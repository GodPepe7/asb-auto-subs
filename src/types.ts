export type SiteSpecifics = {
  titleQuery: string
  epQuery: string
  epPlayerRegEx: RegExp
  syncData?: string
}

export type TitleAndEp = {
  animeTitle: string
  episode: number
}

export type AnilistIdAndEp = {
  anilistId: number
  episode: number
}

export type Subs = {
  url: string
  name: string
  size: number
  lastModified: string
}

export type JimakuEntry = {
  id: number
}

export type AnilistObject = {
  data: {
    Media: {
      id: number
    }
  }
}