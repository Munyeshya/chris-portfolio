import { useEffect, useState } from 'react'
import { clients as fallbackPartners, portfolioAlbums as fallbackWork, team as fallbackTeam } from './content.js'
import { supabase } from './lib/supabase.js'

export function useWebsiteContent() {
  const [content, setContent] = useState({ team: fallbackTeam, partners: fallbackPartners, work: fallbackWork })

  useEffect(() => {
    if (!supabase) return
    let active = true
    Promise.all([
      supabase.from('website_team').select('*').eq('active', true).order('sort_order'),
      supabase.from('website_partners').select('*').eq('active', true).order('sort_order'),
      supabase.from('website_work').select('*').eq('active', true).order('sort_order'),
    ]).then(([team, partners, work]) => {
      if (!active) return
      setContent({
        team: team.data?.length ? team.data.map(item => ({ name: item.name, role: item.role, photo: item.photo_url })) : fallbackTeam,
        partners: partners.data?.length ? partners.data.map(item => ({ name: item.name, logo: item.logo_url, knockout: item.knockout })) : fallbackPartners,
        work: work.data?.length ? work.data.map(item => ({ title: item.title, url: item.external_url, image: item.image_url, categories: item.categories, width: item.width, height: item.height })) : fallbackWork,
      })
    })
    return () => { active = false }
  }, [])

  return content
}
