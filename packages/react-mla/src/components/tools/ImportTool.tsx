// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DragEvent, useRef, useState } from 'react'
import ItemResultList from '../result/ItemResultList'
import useSearchStore from '../../store/search-state'
import { useTranslation } from 'react-i18next'
import { LoadingResults, primaryButton } from './ToolParts'

// An import of a file, which the function of the import in the configuration reads: the file is dropped or chosen, and what it held is shown as results
function ImportTool () {
  const { t } = useTranslation()
  const selectedTool = useSearchStore((state) => state.importTool)
  const loading = useSearchStore((state) => state.loading)
  const result = useSearchStore((state) => state.result)
  const importFile = useSearchStore((state) => state.import)

  const [file, setFile] = useState<{ name: string, size: number, contents: string }>()
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  function read (list: FileList | null | undefined) {
    const chosen = list?.[0]
    if (chosen == null) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text === 'string') {
        setFile({ name: chosen.name, size: chosen.size, contents: text })
      }
    }
    reader.readAsText(chosen)
  }

  function onDrop (e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setOver(false)
    read(e.dataTransfer.files)
  }

  const size = (bytes: number) => (bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? Math.round(bytes / 1024) + ' kB' : (bytes / 1024 / 1024).toFixed(1) + ' MB')

  if (selectedTool == null) {
    return null
  }

  return (
    <div>
      <div className="m:flex m:flex-col m:gap-3 m:px-3 m:py-3 m:border-b m:border-gray-200">
        <input ref={input} type="file" className="m:hidden" aria-label={t('choose file')} onChange={(e) => { read(e.target.files) }} />
        {file == null
          ? <div onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => { setOver(false) }} onDrop={onDrop}
            className={'m:flex m:flex-col m:items-center m:gap-2 m:text-center m:px-3 m:py-5 m:rounded-lg m:border-2 m:border-dashed ' + (over ? 'm:border-primary m:bg-blue-50' : 'm:border-blue-200 m:bg-slate-50')}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="m:text-primary"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M12 12v6M9 15l3-3 3 3" /></svg>
            <span className="m:text-[13px] m:font-semibold">{t('drop file here')}</span>
            <span className="m:text-[12px] m:text-gray-600">{t('or')} <button type="button" onClick={() => { input.current?.click() }} className="m:text-blue-700 m:hover:underline m:cursor-pointer">{t('choose a file')}</button></span>
          </div>
          : <div className="m:flex m:items-center m:gap-2 m:rounded-md m:border m:border-gray-200 m:px-2.5 m:py-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f6b2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="m:shrink-0"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 14l2 2 4-4" /></svg>
            <span className="m:flex m:flex-col m:min-w-0 m:flex-1">
              <span className="m:text-[13px] m:font-semibold m:truncate">{file.name}</span>
              <span className="m:text-[11px] m:text-gray-600">{size(file.size)}</span>
            </span>
            <button type="button" onClick={() => { input.current?.click() }} className="m:text-[12px] m:text-blue-700 m:hover:underline m:cursor-pointer">{t('change file')}</button>
          </div>}
        <button type="button" disabled={file == null} onClick={() => { if (file) void importFile(file.contents) }} className={primaryButton}>{t('import')}</button>
      </div>
      {loading && <LoadingResults />}
      {!loading && result &&
        <ItemResultList result={result} onRetry={file ? () => { void importFile(file.contents) } : undefined} />
      }
    </div>
  )
}

export default ImportTool
