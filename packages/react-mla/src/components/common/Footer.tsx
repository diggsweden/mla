// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { fitViewportToNodes } from "@sigma/utils";
import { useTranslation } from 'react-i18next';
import useAppStore from '../../store/app-store';
import useMainStore from '../../store/main-store';
import Icon from './Icon';

function Footer() {
  const { t } = useTranslation()
  const selected = useMainStore((state) => state.selectedIds)
  const dirty = useMainStore((state) => state.dirty)
  const sigma = useMainStore((state) => state.sigma)
  const graph = useMainStore((state) => state.graph)

  const hoverEffect = useAppStore((state) => state.hoverEffect)
  const setHoverEffect = useAppStore((state) => state.setHoverEffect)

  function fit(selection: boolean) {
    if (sigma && graph && graph.nodes().length) {
      fitViewportToNodes(
        sigma,
        graph.filterNodes((node) => !selection || selected.includes(node)),
        { animate: true },
      );
    }
  }

  return (
    <footer className="m-h-5 m-flex m-flex-row m-w-full m-border-t m-border-gray-300 m-bg-gray-50">
      <span className={(!dirty ? 'm-hidden ' : '') + 'm-ml-1'}>{t('unsaved changes')}</span>
      <div className="m-flex-1"></div>
      <span className=''>
        <button className={"m-pr-3" + (!hoverEffect ? " m-text-secondary" : "")} onClick={() => { setHoverEffect(!hoverEffect) }}><Icon className="m-h-3 m-inline-block m-mr-1" name="group_work" />{t('highlight')}</button>
        <button className="m-pr-3" onClick={() => { fit(false) }}><Icon className="m-h-3 m-inline-block m-mr-1" name="monitor" />{t('show all')}</button>
        <button disabled={selected.length === 0} className='disabled:opacity-50 m-mr-2' onClick={() => { fit(true) }}><Icon className="m-h-3 m-inline-block m-mr-1" name="screenshot_monitor" />{t('show selected')}</button>
      </span>
    </footer>
  )
}

export default Footer
