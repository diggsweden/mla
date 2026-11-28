// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useKeyDown from '../../effects/keydown'
import { useEffect, useRef } from 'react'
import Button from './Button'
import { useTranslation } from 'react-i18next'

interface ModalProps {
  title?: string
  className?: string
  onPositive?: () => void
  onNegative?: () => void
  mode: 'save' | 'accept' | 'ok'
  valid?: boolean
  show: boolean
  wide?: boolean
  children?: React.ReactNode
  sidebar?: React.ReactNode
  // The text of the button that does what the dialog is for, instead of Save
  positiveLabel?: string
  // The dialog keeps to the height of the window: its heading and buttons are always seen, and its content scrolls between them.
  // The content then gives which part of it scrolls
  fitScreen?: boolean
  // A note beside the buttons, such as what is left to fill in
  footerNote?: React.ReactNode
}

// The buttons at the bottom of a dialog: the same size wherever the dialog is opened, and wide enough to be easy to hit
const footerButton = 'm:text-[14px] m:leading-5 m:min-w-20 m:py-1.5'

function Modal (props: ModalProps) {
  const { t } = useTranslation() 
  function onPositive () {
    if (props.onPositive && props.show && (props.valid ?? true)) {
      props.onPositive()
    }
  }

  const dialog = useRef<HTMLDialogElement>(null)
  useKeyDown(() => {
    onPositive()
  }, dialog, ['Enter'])

  function handleSubmit (ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    onPositive()
  }

  useEffect(() => {
    const modal = dialog?.current
    if (modal) {
      if (props.show) {
        modal.showModal()
      } else {
        modal.close()
      }
    }

    return () => {
      if (modal) modal.close()
    }
  }, [props.show, dialog])

  return (
    <dialog ref={dialog} className={'m:p-0 m:animate-in m:fade-in m:duration-300 m:rounded-sm m:shadow-lg m:backdrop:bg-black/50 ' + (props.wide ? ' m:w-full ' : ' m:w-2/4 m:max-w-2xl ') + (props.fitScreen ? ' m:max-h-[92vh] m:overflow-hidden ' : '') + props.className}>
      {props.show &&
        <form className={'m:w-full m:overflow-x-hidden ' + (props.fitScreen ? 'm:max-h-[92vh] m:flex m:flex-col m:overflow-y-hidden' : 'm:overflow-y-auto')} onSubmit={handleSubmit}>
          <div className={'m:relative m:w-full m:h-full m:mx-auto' + (props.fitScreen ? ' m:flex m:flex-col m:min-h-0' : '')}>
            <div className={'m:duration-300 m:relative' + (props.fitScreen ? ' m:flex m:flex-col m:min-h-0' : '')}>
              <div className="m:flex m:items-center m:justify-between m:p-4 m:bg-primary">
                <h3 hidden={props.title == null} className="m:text-xl m:font-semibold m:text-white">
                  {props.title}
                </h3>
                <button type="button" onClick={props.onNegative} className="m:text-white m:bg-transparent m:hover:bg-gray-200 m:hover:text-gray-900 m:rounded-lg m:text-sm m:p-1.5 m:ml-auto m:inline-flex m:items-center" data-modal-hide="defaultModal">
                  <svg className="m:w-5 m:h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  <span className="m:sr-only">{t('close')}</span>
                </button>
              </div>
              <div className={'m:flex' + (props.fitScreen ? ' m:min-h-0' : '')}>
                {props.sidebar && <div className="m:basis-36 m:bg-gray-100 m:border-r m:py-5">
                  {props.sidebar}
                </div>}
                <div className={'m:grow m:flex m:flex-col m:justify-between' + (props.fitScreen ? ' m:min-h-0' : '')}>
                  {props.children}
                  {/* The buttons have their own size of text, as a dialog takes the size of where it is opened, like the smaller one of the ribbon */}
                  {props.mode !== 'ok' && props.onPositive && props.onNegative &&
                    <div className="m:flex m:justify-end m:items-center m:p-3 m:gap-x-2 m:border-t m:border-gray-200 m:shrink-0">
                      {props.footerNote != null && <div className="m:mr-auto m:text-left">{props.footerNote}</div>}
                      <Button dataModalHide='defaultModal' disabled={props.valid != null ? !props.valid : false} onClick={props.onPositive} className={footerButton}>
                        {props.positiveLabel ?? (props.mode === 'save' ? t('save') : t('yes'))}
                      </Button>
                      {/* Cancelling is always possible, also when what is filled in is not valid */}
                      <Button dataModalHide='defaultModal' onClick={props.onNegative} type="secondary" className={footerButton}>
                        {props.mode === 'save' ? t('cancel') : t('no')}
                      </Button>
                    </div>
                  }
                  {props.mode === 'ok' &&
                    <div className="m:flex m:justify-end m:p-3 m:gap-x-2 m:border-t m:border-gray-200">
                      <Button dataModalHide='defaultModal' onClick={() => { props.onNegative?.() }} className={footerButton}>
                        {t('ok')}
                      </Button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </form>
      }
    </dialog>
  )
}

export default Modal
