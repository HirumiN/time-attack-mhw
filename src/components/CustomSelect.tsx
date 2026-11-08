import { useEffect, useRef, useState } from 'react'

export function CustomSelect({ value, options, onChange, disabled }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div className={`cselect ${disabled ? 'disabled' : ''}`} ref={ref}>
      <button type="button" className="cselect-trigger" onClick={() => !disabled && setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span>{selected?.label ?? value}</span>
        <span className="cselect-chevron">▾</span>
      </button>
      {open && (
        <div className="cselect-menu" role="listbox">
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`cselect-option ${o.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
