// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useState } from 'react'
import ItemResultList from '../result/ItemResultList'
import useSearchStore from '../../store/search-state'

function ImportTool () {
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
          throw new Error('Misslyckades med att läsa filen')
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
    <div className='animate-in slide-in-from-left'>
      <div className='search-tools animate-in slide-in-from-left'>
        <p className='text-sm p-1'>{selectedTool.Description}</p>
        <div className='pt-2'>
          <input className="w-full" type="file" onChange={(e) => { setSelectedFile(e.target.files) }}></input>
          <button disabled={fileContents === ''} onClick={search} className='w-full text-white bg-primary hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded px-2 py-1 mr-2 my-2'>Importera</button>
        </div>
      </div>
      <div className='mt-2'>
        {loading &&
          <div className="animate-in fade-in duration-500 flex space-x-4 mt-4">
            <div className="animate-pulse rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        }
        {!loading && result &&
          <ItemResultList className="animate-in slide-in-from-bottom border-t border-gray-400 pt-2" result={result} />
        }
      </div>
    </div>
  )
}

export default ImportTool
