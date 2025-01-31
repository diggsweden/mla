// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback } from "react";

/**
 * Returns a callback ref that calls `drop(element)` when the DOM node is attached.
 * This fixed a issue with React19 until react-dnd has support for it
 */
export default function useDropRef(drop: (el: HTMLDivElement) => void) {
    return useCallback((element: HTMLDivElement | null) => {
        if (element) {
            drop(element);
        }
    }, [drop]);
}