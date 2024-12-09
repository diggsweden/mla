// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { ChangeEvent, useEffect, useState } from 'react'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'
import { useTranslation } from 'react-i18next'
import louvain from 'graphology-communities-louvain'
import { bindWebGLLayer, createContoursProgram } from '@sigma/layer-webgl'

interface Props {
  show?: boolean
}

export default function CommunityTools(props: Props) {
  const { t } = useTranslation();

  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)

  const [showGrouping, setShowGrouping] = useState(false)
  const [community, setCommunity] = useState("")
  const [communities, setCommunities] = useState([] as string[])

  const [cleanWebGLLayer, setCleanWebGLLayer] = useState<(() => void) | null>(null);

  function changeCommunity(event: ChangeEvent<HTMLSelectElement>) {
    setCommunity(event.target.value)
  }

  function toogleCommunity() {
    setShowGrouping(!showGrouping)

    if (showGrouping) {
      setCommunity("");
      setCommunities([])
    }
  }

  useEffect(() => {
    if (cleanWebGLLayer) cleanWebGLLayer();
    if (community && sigma) {
      const cleanWebGLLayer = bindWebGLLayer(
        "metaball",
        sigma,
        createContoursProgram(graph.filterNodes((_node, attributes) => attributes.community === +community)),
      );

      setCleanWebGLLayer(() => () => cleanWebGLLayer());
    } else {
      setCleanWebGLLayer(null);
    }
  }, [graph, sigma, cleanWebGLLayer, community]);

  useEffect(() => {
    if (showGrouping) {
      louvain.assign(graph, { nodeCommunityAttribute: "community" });
      const communitiesSet = new Set<string>();
      graph.forEachNode((_, attrs) => communitiesSet.add(attrs.community));
      setCommunities(Array.from(communitiesSet));
    }
  }, [graph, showGrouping]);

  if (props.show != true) {
    return null
  }

  return (<>
    <RibbonMenuSection title={(t('grouping'))}>
      <RibbonMenuButton label={t('show')} active={showGrouping} title={t('show')} onClick={() => { toogleCommunity() }} iconName="route" />
      <div className="m-text-left m-px-1 m-w-24">
        <span className="m-mb-1 m-ml-1 m-text-sm m-font-medium m-text-gray-900">{t('grouping')}</span>
        <select onChange={changeCommunity} value={community} className="m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-w-full m-p-1">
          <option key={9999} value=""></option>
          {communities.map(e => (
            <option key={e} value={e}>{t('group')} {e}</option>
          ))}
        </select>
      </div>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </>)
}
