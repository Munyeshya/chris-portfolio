import { useEffect, useState } from 'react'
import { clients as fallbackPartners, portfolioAlbums as fallbackWork, team as fallbackTeam } from './content.js'
import { api } from './lib/api.js'

export function useWebsiteContent() {
  const [content, setContent] = useState({ team: fallbackTeam, partners: fallbackPartners, work: fallbackWork })

  useEffect(() => {
    let active = true
    api('/content').then(({ team, partners, work }) => {
      if (!active) return
      setContent({
        team: team?.length ? team.map(item => ({ name: item.name, role: item.role, photo: item.photo_url })) : fallbackTeam,
        partners: partners?.length ? partners.map(item => ({ name: item.name, logo: item.logo_url, knockout: item.knockout })) : fallbackPartners,
        work: work?.length ? work.map(item => ({ title: item.title, url: item.external_url, image: item.image_url, video: item.video_url, categories: item.categories, width: item.width, height: item.height })) : fallbackWork,
      })
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  return content
}
