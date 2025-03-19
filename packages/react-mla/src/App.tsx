// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import Container from './layouts/Container'
import Footer from './layouts/Footer'
import Header from './layouts/Header'

import AppShortcuts from './components/common/AppShortcuts'

import './App.scss'

export default function App() {
  return (
    <AppShortcuts className="m-h-full m-w-full m-max-h-full m-max-w-full m-text-base m-flex m-flex-col">
      <DndProvider backend={HTML5Backend}>
        <Header />
        <Container />
        <Footer />
      </DndProvider>
    </AppShortcuts>
  )
}
