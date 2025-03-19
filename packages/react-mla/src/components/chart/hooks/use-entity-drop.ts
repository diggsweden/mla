// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { RefObject } from 'react';
import { useDrop } from 'react-dnd';
import Sigma from "sigma";

function useEntityDrop(sigma: Sigma | undefined, container: RefObject<HTMLDivElement | null>) {
    const dropRef = useDrop(
        () => ({
            accept: ['entity', 'result'],
            drop: (item, monitor) => {
                const clientPosition = monitor.getClientOffset()
                if (clientPosition == null || container.current == null || sigma == null) {
                    return
                }
                const offset = container.current.getBoundingClientRect()
                const click = { x: clientPosition.x - offset.x, y: clientPosition.y - offset.y };
                const pos = sigma.viewportToGraph(click);
                return pos
            }
        }),
        [sigma]
    )

    return dropRef
}

export default useEntityDrop