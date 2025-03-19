// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import ChartArea from "../components/chart/ChartArea";
import ErrorBoundary from "../components/common/ErrorBoundary";
import Map from '../components/map/Map';
import configService from "../services/configurationService";
import useAppStore from '../store/app-store';

export default function Container() {
    const map = useAppStore((state) => state.showMap)

    return (
        <section className="m-flex-1 m-flex m-min-h-0 m-relative">
            <ChartArea></ChartArea>
            {configService.getConfiguration().MapConfiguration && (<ErrorBoundary>
                <div className={(map ? '' : 'm-hidden ') + 'm-h-full m-w-1 m-bg-gray-300 m-z-10 hover:m-cursor-col-resize'} />
                <Map className={(map ? '' : 'm-hidden ') + 'm-h-full m-w-full m-flex-1'} />
            </ErrorBoundary>)}
        </section>
    )
}