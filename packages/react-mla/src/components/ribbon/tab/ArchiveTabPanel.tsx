// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import { blobToBase64, canvasToBlob, getContextValue, setContextValue } from '../../../utils/utils'
import queryService from '../../../services/queryService'
import Modal from '../../common/Modal'
import configService from '../../../services/configurationService'
import ImportToolbox from '../toolbox/ImportToolbox'
import { useTranslation } from 'react-i18next'

function ArchiveTabPanel () {
  const config = configService.getConfiguration()
  const { t } = useTranslation();

  const save = useMainStore((state) => state.save)
  const open = useMainStore((state) => state.open)
  const setDirty = useMainStore((state) => state.setDirty)
  const context = useMainStore((state) => state.context)
  const setContext = useMainStore((state) => state.setContext)

  const network = useMainStore((state) => state.network)

  const [showSave, setShowSave] = useState(false)
  const [showImageSave, setShowImageSave] = useState(false)
  const [newFilename, setNewFilename] = useState('')
  const [loading, setLoading] = useState(false)

  const [filename, setFilename] = useState(getContextValue(context, 'filename'))
  useEffect(() => {
    setFilename(getContextValue(context, 'filename'))
  }, [context])

  let reader = undefined as FileReader | undefined
  const fileInputRef = useRef<HTMLInputElement>(null)

  function checkFileAPI () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      reader = new FileReader()
      return true
    } else {
      alert('The File APIs are not fully supported by your browser. Fallback required.')
      return false
    }
  }

  function saveRemote (name?: string) {
    if (loading) {
      return
    }
    if (name && name.length > 0) {
      setLoading(true)
      const update = setContextValue(context, 'filename', name)
      setContext(update)

      const json = save()
      const saveAction = async () => {
        const result = await queryService.SaveFile(json)
        if (result) {
          setDirty(false)
          closeSave()
        } else {
          window.alert('Failed to save')
        }
        setLoading(false)
        setNewFilename('')
      }

      void saveAction()
    } else {
      showSaveAs()
    }
  }

  function showSaveAs () {
    setNewFilename(filename ?? '')
    setShowSave(true)
  }

  function showImageSaveAs () {
    setNewFilename('')
    setShowImageSave(true)
  }

  function closeSave () {
    setNewFilename('')
    setShowSave(false)
  }

  function closeImageSave () {
    setNewFilename('')
    setShowImageSave(false)
  }

  function saveAsFile () {
    const json = save()
    const blob = new Blob([json], { type: 'application/json' })

    if (window.showSaveFilePicker != null) {
      const options = {
        suggestedName: t('default_filename'),
        types: [
          {
            description: t('default_description'),
            accept: { 'application/json': ['.json'] }
          } satisfies FilePickerAcceptType
        ]
      }

      const saveAction = async () => {
        try {
          const handle = await window.showSaveFilePicker(options)

          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          setDirty(false)
        } catch (err: any) {
          // Fail silently if the user has simply canceled the dialog.
          if (err.name !== 'AbortError') {
            console.error(err.name, err.message)
          }
          setDirty(true)
        }
      }

      void saveAction()
    } else {
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.download = t('default_filename')
      link.href = url

      link.click()
      link.remove()
    }
  }

  function saveImage () {
    if (network) {
      const canvas = (network as any).canvas.frame.canvas as HTMLCanvasElement
      fillCanvasBackgroundWithColor(canvas, 'white')
      const url = canvas.toDataURL('image/png')

      const link = document.createElement('a')
      link.download = t('default_image')
      link.href = url

      link.click()
      link.remove()
    }
  }

  function saveImageRemote (name?: string) {
    if (loading) {
      return
    }

    if (network) {
      if (name && name.length > 0) {
        setLoading(true)

        const canvas = (network as any).canvas.frame.canvas as HTMLCanvasElement
        fillCanvasBackgroundWithColor(canvas, 'white')

        const saveAction = async () => {
          const imageBlob = await canvasToBlob(canvas)
          const base64data = await blobToBase64(imageBlob)

          const result = await queryService.SaveImage(base64data, name)
          if (result) {
            setDirty(false)
            closeImageSave()
          } else {
            window.alert('Failed to save')
          }
          setLoading(false)
          setNewFilename('')
        }
        void saveAction()
      } else {
        showImageSaveAs()
      }
    }
  }

  function fillCanvasBackgroundWithColor (canvas: HTMLCanvasElement, color: string) {
    const context = canvas.getContext('2d')
    if (context != null) {
      context.save()
      context.globalCompositeOperation = 'destination-over'
      context.fillStyle = color
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.restore()
    }
  }

  function fileChange (event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault()

    if (event.target.files != null && event.target.files.length > 0) {
      const file = event.target.files[0]

      if (file && reader) {
        reader.onload = async (e) => {
          const text = e.target?.result as string

          open(text)
        }
        reader.readAsText(file)
      }
    }
  }

  const inputClass = (newFilename.length > 0 ? 'm-border-gray-300 ' : 'm-border-red-500 bg-red-200 ') + 'm-p-1 m-mb-3 m-bg-white m-border m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 m-block m-w-full';
  return <div className="m-flex m-text-center m-h-full m-p-1">
    <input
      type="file"
      accept="application/json"
      ref={fileInputRef}
      onChange={event => { fileChange(event) }}
      hidden
    />
    <RibbonMenuSection title={t('diagram')} >
      {config.Save === 'file' && (
        <RibbonMenuButton label={t('save')} onClick={saveAsFile} disabled={!checkFileAPI()} iconName="save" />
      )}
      {config.Save && config.Save.length > 0 && config.Save !== 'file' && <div>
        <RibbonMenuButton label={t('save')} disabled={loading} onClick={() => { saveRemote(filename) }} iconName="save" />
        {filename && filename?.length > 0 && (
          <RibbonMenuButton label={t('save as')} disabled={loading} onClick={showSaveAs} iconName="move_to_inbox" />
        )}
      </div>}

      {config.Open === 'file' && (
        <RibbonMenuButton label={t('open')} onClick={() => fileInputRef?.current?.click()} disabled={!checkFileAPI()} iconName="outlined_file_open" />
      )}
    </RibbonMenuSection>
    <RibbonMenuDivider />

    <RibbonMenuSection title={t('share')} >
      {config.SaveImage === 'file' && (
        <RibbonMenuButton label={t('as picture')} onClick={ saveImage } iconName="outlined_add_a_photo" />
      )}
      {config.SaveImage && config.SaveImage !== '' && config.SaveImage.length > 0 && config.SaveImage !== 'file' && (
        <RibbonMenuButton label={t('as picture')} onClick={ saveImageRemote } iconName="outlined_add_a_photo" />
      )}
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <ImportToolbox show={config.Menu?.Archive?.Import} />
    <Modal mode="save" show={showSave} title={t('save as')} onNegative={closeSave} onPositive={() => { saveRemote(newFilename) }}>
      <div className="m-text-start m-px-4 m-py-1">
        <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900">{t('filename')}</span>
        <input type="text" value={newFilename} onChange={(e) => { setNewFilename(e.target.value) }} className={inputClass}></input>
        {loading && <p>{t('saving')}</p>}
      </div>
    </Modal>

    <Modal mode="save" show={showImageSave} title={t('save image as')}  onNegative={closeImageSave} onPositive={() => { saveImageRemote(newFilename) }}>
      <div className="m-text-start m-px-4 m-py-1">
        <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900">{t('filename')}</span>
        <input type="text" value={newFilename} onChange={(e) => { setNewFilename(e.target.value) }} className={inputClass}></input>
        {loading && <p>{t('saving')}</p>}
      </div>
    </Modal>

  </div>
}
export default ArchiveTabPanel
