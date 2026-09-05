import { useEffect, useState } from 'react'

export function useScrollHeader(headerRef, menuOpen) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let previousY = Math.max(0, window.scrollY)
    let travel = 0
    let previousDirection = 0
    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      const delta = y - previousY
      const direction = Math.sign(delta)
      if (direction && direction !== previousDirection) travel = 0
      travel += delta
      previousY = y
      if (direction) previousDirection = direction
      if (y < 120 || menuOpen || headerRef.current?.contains(document.activeElement)) {
        setHidden(false)
        travel = 0
      } else if (Math.abs(travel) > 12) {
        setHidden(travel > 0)
        travel = 0
      }
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const onFocus = () => setHidden(false)
    const header = headerRef.current
    window.addEventListener('scroll', onScroll, { passive: true })
    header?.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      header?.removeEventListener('focusin', onFocus)
      cancelAnimationFrame(frame)
    }
  }, [headerRef, menuOpen])
  return hidden && !menuOpen
}

export function useSectionReveals() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const main = document.querySelector('main')
    if (!main || !('IntersectionObserver' in window)) return
    let disconnect = () => {}
    const configure = () => {
      disconnect()
      if (preference.matches) return
      const seen = new WeakSet()
      const nodes = new Set()
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' })
      const selector = '.hero-kicker, .hero h1, .hero-copy, .hero-actions, .about-heading, .about-copy, .section-heading, .service-card, .events-heading, .events-content, .portfolio-filters, .album-card, .clients-heading, .client-cell, .team-heading, .team-card, .contact-heading, .contact-content'
      const observeNewNodes = () => {
        main.querySelectorAll(selector).forEach(node => {
          if (seen.has(node)) return
          seen.add(node)
          nodes.add(node)
          const siblings = [...node.parentElement.children].filter(child => child.matches(selector))
          const index = siblings.indexOf(node)
          node.style.setProperty('--reveal-delay', `${Math.min(Math.max(index, 0) % 4, 3) * 75}ms`)
          node.classList.add('reveal-ready')
          observer.observe(node)
        })
      }
      const revealFocused = event => {
        const node = event.target.closest('.reveal-ready')
        if (node) { node.classList.add('is-revealed'); observer.unobserve(node) }
      }
      observeNewNodes()
      const mutation = new MutationObserver(observeNewNodes)
      mutation.observe(main, { childList: true, subtree: true })
      main.addEventListener('focusin', revealFocused)
      disconnect = () => {
        observer.disconnect()
        mutation.disconnect()
        main.removeEventListener('focusin', revealFocused)
        for (const node of nodes) {
          node.classList.remove('reveal-ready', 'is-revealed')
          node.style.removeProperty('--reveal-delay')
        }
      }
    }
    configure()
    preference.addEventListener('change', configure)
    return () => { disconnect(); preference.removeEventListener('change', configure) }
  }, [])
}
