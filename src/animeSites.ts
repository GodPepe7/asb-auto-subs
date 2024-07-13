import { SiteSpecifics } from "./types"

export const animeSites = new Map<string, SiteSpecifics>([
  ["hianime.to",
    {
      titleQuery: "h2.film-name > a",
      epQuery: ".ssl-item.ep-item.active",
      epPlayerRegEx: /https:\/\/hianime\.to\/watch\/.+\?ep=.+/
    }
  ],
  ["animesuge.to",
    {
      titleQuery: "h1.title",
      epQuery: "div.range a.active",
      epPlayerRegEx: /https:\/\/animesuge\.to\/anime\/.+\/ep-.+/
    }
  ]
])