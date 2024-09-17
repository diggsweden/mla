// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import ItemResultList from '../result/ItemResultList'
import useSearchStore from '../../store/search-state'
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';

function ImportTool () {
  const { t } = useTranslation();
  const selectedTool = useSearchStore((state) => state.importTool)
  const loading = useSearchStore((state) => state.loading)
  const result = useSearchStore((state) => state.result)

  const importFile = useSearchStore((state) => state.import)

  const [fileContents, setContents] = useState('')

  function setSelectedFile (list: FileList | null) {
    if (list && list.length === 1) {
      const file = list[0]
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target?.result == null) {
          throw new Error('Failed to read file')
        }

        const text = (e.target.result)
        setContents(text as string)
      }
      reader.readAsText(file)
    }
  }

  function search () {
    void importFile(fileContents)
  }

  if (selectedTool == null) {
    return null
  }

  return (
    <div className="m-animate-in m-slide-in-from-left">
      <div className="m-search-tools m-animate-in m-slide-in-from-left">
        <p className="m-text-sm m-p-1">{selectedTool.Description}</p>
        <div className="m-pt-2">
          <input className="m-w-full" type="file" onChange={(e) => { setSelectedFile(e.target.files) }}></input>
          <Button className="m-right-0 m-top-0" disabled={fileContents === ''} onClick={search}>{t('import')}</Button>
        </div>
      </div>
      <div className="m-mt-2">
        {loading &&
          <div className="m-animate-in m-fade-in m-duration-500 m-flex m-space-x-4 m-mt-4">
            <div className="m-animate-pulse m-rounded-full m-bg-slate-200 m-h-10 m-w-10"></div>
            <div className="m-flex-1 m-space-y-6 m-py-1">
              <div className="m-h-2 m-bg-slate-200 m-rounded"></div>
              <div className="m-space-y-3">
                <div className="m-grid m-grid-cols-3 m-gap-4">
                  <div className="m-h-2 m-bg-slate-200 m-rounded m-col-span-2"></div>
                  <div className="m-h-2 m-bg-slate-200 m-rounded m-col-span-1"></div>
                </div>
                <div className="m-h-2 m-bg-slate-200 m-rounded"></div>
              </div>
            </div>
          </div>
        }
        {!loading && result &&
          <ItemResultList className="m-animate-in m-slide-in-from-bottom m-border-t m-border-gray-400 m-pt-2" result={result} />
        }
      </div>
    </div>
  )
}

export default ImportTool
