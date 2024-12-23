export type AnimeMetaData = {
  anilistId?: number
  episode: number
  title: string
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