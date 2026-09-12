import { FaArrowUpRightFromSquare, FaArrowLeft, FaArrowRight, FaXmark, FaPlus } from 'react-icons/fa6'
import { useEffect, useRef, useState } from 'react'
import { company, portfolioAlbums, portfolioUrl, workCategories } from './content'

export default function Portfolio({ albums = portfolioAlbums }) {
  const [category, setCategory] = useState('All Work')
  const [limit, setLimit] = useState(6)
  const [selected, setSelected] = useState(null)
  const dialogRef = useRef(null)
  const filtered = category === 'All Work' ? albums : albums.filter(album => album.categories.includes(category))
  const selectedIndex = selected ? filtered.findIndex(album => album.url === selected.url) : -1
  const videoCategory = category === 'AV Production & Livestreaming' || category === 'Videography & Documentaries'

  useEffect(() => {
    if (selected) dialogRef.current?.showModal()
  }, [selected])

  function movePhoto(direction) {
    if (filtered.length > 1) setSelected(filtered[(selectedIndex + direction + filtered.length) % filtered.length])
  }

  function returnToWork() {
    setSelected(null)
    requestAnimationFrame(() => document.getElementById('portfolio')?.scrollIntoView({ block: 'start' }))
  }

  return <>
    <div className="portfolio-filters" aria-label="Portfolio categories">
      {['All Work', ...workCategories.map(item => item.title)].map(label => <button key={label} type="button" aria-pressed={category === label} onClick={() => { setCategory(label); setLimit(6) }}>{label}</button>)}
    </div>
    <p className="gallery-count" role="status">{filtered.length ? `${filtered.length} albums · ${category}` : category}</p>
    {filtered.length ? <div className="album-grid">{filtered.slice(0, limit).map(album => <article className="album-card" key={album.url}>
      <button className="album-preview" type="button" onClick={() => setSelected(album)} aria-label={`Preview ${album.title}`}>
        <img src={album.image} alt={album.title} width={album.width} height={album.height} loading="lazy" decoding="async" />
        <span className="preview-hint">VIEW PHOTO <FaArrowUpRightFromSquare className="ui-icon" aria-hidden="true" /></span>
      </button>
      <div className="album-caption"><span className="album-type">EVENT PHOTOGRAPHY</span><h3><a href={album.url} target="_blank" rel="noreferrer">{album.title} <FaArrowUpRightFromSquare className="ui-icon" aria-hidden="true" /></a></h3><a className="album-link" href={album.url} target="_blank" rel="noreferrer">View full album on Flickr</a></div>
    </article>)}</div> : <div className="portfolio-empty"><h3>{videoCategory ? 'Visit our YouTube channel.' : 'More projects to come.'}</h3><p>{videoCategory ? 'Explore our channel on YouTube for video content.' : 'Project details for this category have not been added yet. Explore our photography albums in the meantime.'}</p>{videoCategory ? <a className="button red" href={company.socials.YouTube} target="_blank" rel="noreferrer">Visit YouTube <FaArrowUpRightFromSquare className="ui-icon" aria-hidden="true" /></a> : <button type="button" className="button outline" onClick={() => { setCategory('Photography'); setLimit(6) }}>Explore Photography</button>}</div>}
    <div className="portfolio-actions">{filtered.length > limit && <button type="button" className="button outline" onClick={() => setLimit(filtered.length)}>Show more albums <FaPlus className="ui-icon" aria-hidden="true" /></button>}<a className="button outline" href={portfolioUrl} target="_blank" rel="noreferrer">Full Flickr Portfolio <FaArrowUpRightFromSquare className="ui-icon" aria-hidden="true" /></a><a className="video-channel-link" href={company.socials.YouTube} target="_blank" rel="noreferrer">Find us on YouTube <FaArrowUpRightFromSquare className="ui-icon" aria-hidden="true" /></a></div>
    <dialog ref={dialogRef} className="gallery-dialog" aria-labelledby="gallery-title" onClose={returnToWork} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); movePhoto(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(-1) }
    }} onClick={event => {
      if (event.target === dialogRef.current) {
        const bounds = dialogRef.current.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialogRef.current.close()
      }
    }}>
      <button type="button" className="gallery-close" aria-label="Close photo preview" onClick={() => dialogRef.current?.close()}><FaXmark aria-hidden="true" /></button>
      {selected && <><div className="gallery-image-wrap"><img src={selected.image} width={selected.width} height={selected.height} alt={selected.title} /></div><div className="gallery-caption"><div><p className="gallery-position" aria-live="polite">{selectedIndex + 1} / {filtered.length}</p><h3 id="gallery-title">{selected.title}</h3><a href={selected.url} target="_blank" rel="noreferrer">View full album on Flickr <FaArrowUpRightFromSquare className="ui-icon" aria-hidden="true" /></a></div><div className="gallery-controls"><button type="button" aria-label="Previous album photo" onClick={() => movePhoto(-1)}><FaArrowLeft aria-hidden="true" /></button><button type="button" aria-label="Next album photo" onClick={() => movePhoto(1)}><FaArrowRight aria-hidden="true" /></button></div></div></>}
    </dialog>
  </>
}
