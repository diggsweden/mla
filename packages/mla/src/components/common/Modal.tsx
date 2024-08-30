// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useKeyDown from '../../effects/keydown'
import { useEffect, useRef } from 'react'

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
}

function Modal (props: ModalProps) {
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
    <dialog ref={dialog} className={'p-0 animate-in fade-in duration-300 rounded shadow-lg backdrop:bg-black/50 ' + (props.wide ? ' w-full ' : ' w-2/4 max-w-2xl ') + props.className}>
      {props.show &&
        <form className={ 'w-full overflow-x-hidden overflow-y-auto md:h-full' } onSubmit={handleSubmit}>
          <div className="relative w-full h-full mx-auto z-100">
            <div className="duration-300 relative">
              <div className="flex items-center justify-between p-4 bg-primary">
                <h3 hidden={props.title == null} className="text-xl font-semibold text-white dark:text-white">
                  {props.title}
                </h3>
                <button type="button" onClick={props.onNegative} className="text-white bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" data-modal-hide="defaultModal">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  <span className="sr-only">Stäng</span>
                </button>
              </div>
              <div className="flex">
                {props.sidebar && <div className="basis-36 bg-gray-100 border-r py-5">
                  {props.sidebar}
                </div>}
                <div className="grow flex flex-col justify-between">
                  {props.children}
                  {props.mode !== 'ok' && props.onPositive && props.onNegative &&
                    <div className="flex justify-end p-3 space-x-2 border-t border-gray-200">
                      <button data-modal-hide="defaultModal" type="button" disabled={props.valid != null ? !props.valid : false} onClick={props.onPositive} className="text-white bg-primary enabled:hover:bg-blue-800 disabled:opacity-50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 text-center">
                        {props.mode === 'save' ? 'Spara' : 'Ja'}
                      </button>
                      <button data-modal-hide="defaultModal" type="button" onClick={props.onNegative} className="text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2 focus:z-10">
                        {props.mode === 'save' ? 'Avbryt' : 'Nej'}
                      </button>
                    </div>
                  }
                  {props.mode === 'ok' &&
                    <div className="flex justify-end p-3 space-x-2 border-t border-gray-200">
                      <button data-modal-hide="defaultModal" type="button" onClick={props.onNegative} className="text-white bg-primary enabled:hover:bg-blue-800 disabled:opacity-50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 text-center ">
                        Ok
                      </button>
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
