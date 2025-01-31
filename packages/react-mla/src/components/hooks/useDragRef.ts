// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback } from "react";

/**
 * Returns a callback ref that calls `drag(element)` when the DOM node is attached.
 * This fixed a issue with React19 until react-dnd has support for it
 */
export function useDragRef(drag: (el: HTMLElement) => void) {
    return useCallback((element: HTMLElement | null) => {
        if (element) {
            drag(element);
        }
    }, [drag]);
}