// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react';

import useMainStore from '../../store/main-store';

import useAppStore from '../../store/app-store';
import bindFabricLayer from './fabric-drawing';

interface Props {
  children?: React.ReactNode
}

function Draw(props: Props) {
  const drawingsRef = useRef<string>(undefined)

  const sigma = useMainStore((state) => state.sigma)
  const fabric = useMainStore((state) => state.fabric)
  const drawings = useMainStore((state) => state.drawings)

  const setFabric = useMainStore((state) => state.setFabric)

  const drawingMode = useAppStore((state) => state.drawingMode)

  useEffect(() => {
    if (sigma == null) {
      return
    }

    const fabric = bindFabricLayer(sigma)
    fabric.fabric.loadFromJSON(drawingsRef)

    setFabric(fabric.fabric)

    return () => {
      fabric.clean()
    }
  }, [sigma, setFabric])

  useEffect(() => {
    if (fabric != null) {
      fabric.elements.container.style.zIndex = drawingMode ? "1" : "-1"
    }
  }, [drawingMode, fabric])

  useEffect(() => {
    drawingsRef.current = drawings

    if (fabric != null && drawings) {
      fabric.loadFromJSON(drawings)
    }
  }, [fabric, drawings])

  return (<>{props.children}</>)
}

export default Draw