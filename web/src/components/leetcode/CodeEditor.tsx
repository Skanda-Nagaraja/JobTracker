import { useCallback } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'python' | 'javascript'
}

// Clean, minimal code editor component
// Uses a styled textarea with syntax-aware styling
// For a more advanced editor, install @uiw/react-codemirror
export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const spaces = '    ' // 4 spaces for indentation
      
      const newValue = value.substring(0, start) + spaces + value.substring(end)
      onChange(newValue)
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + spaces.length
      }, 0)
    }
  }, [value, onChange])

  return (
    <div className="relative h-full rounded-lg overflow-hidden border bg-[#1e1e2e]">
      {/* Language indicator */}
      <div className="absolute top-0 right-0 px-3 py-1.5 text-xs font-medium text-slate-400 bg-[#1e1e2e]/80 backdrop-blur rounded-bl-lg z-10">
        {language === 'python' ? '🐍 Python' : '📜 JavaScript'}
      </div>
      
      {/* Line numbers gutter */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#181825] border-r border-[#313244] flex flex-col pt-4 text-right pr-2 text-xs text-slate-500 font-mono select-none overflow-hidden">
        {value.split('\n').map((_, i) => (
          <div key={i} className="leading-6 h-6">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor area */}
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="
          w-full h-full
          pl-14 pr-4 py-4
          bg-transparent
          text-[#cdd6f4]
          font-mono text-sm leading-6
          resize-none
          outline-none
          caret-[#89b4fa]
          selection:bg-[#45475a]
        "
        style={{
          tabSize: 4,
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
        }}
      />

      {/* Bottom bar with shortcuts */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-[#181825] border-t border-[#313244] flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Tab: Indent</span>
          <span>Lines: {value.split('\n').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">●</span>
          <span>Ready</span>
        </div>
      </div>
    </div>
  )
}

