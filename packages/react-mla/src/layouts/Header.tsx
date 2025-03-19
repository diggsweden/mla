// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import i18n from "i18next";
import { useMemo } from "react";
import RibbonMenu from "../components/ribbon/RibbonMenu";
import useMainStore from "../store/main-store";
import { getContextValue } from "../utils/utils";

export default function Header() {
    const context = useMainStore((state) => state.context)
    const title = useMemo(() => getContextValue(context, 'title') ?? i18n.t('name'), [context])

    return (
        <header className="m-h-100 m-flex-none m-w-full m-border-b m-border-gray-300 m-text-white m-bg-primary">
            <h1 className="m-pt-2 m-pb-2 m-pl-4">MLA - {title}</h1>
            <RibbonMenu />
        </header>
    )
}        