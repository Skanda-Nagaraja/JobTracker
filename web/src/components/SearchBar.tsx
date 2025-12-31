import { useEffect, useState } from 'react'

export default function SearchBar({
  onChange,
}: {
  onChange: (q: string, company: string) => void
}) {
  const [q, setQ] = useState('')
  const [company, setCompany] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onChange(q, company), 350)
    return () => clearTimeout(t)
  }, [q, company, onChange])

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title/company (e.g. backend, python)"
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none"
      />
      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setQ('')
            setCompany('')
            onChange('', '')
          }}
          className="h-10 rounded-md border border-neutral-300 px-3 text-sm hover:bg-neutral-100"
        >
          Clear
        </button>
      </div>
    </div>
  )
}


