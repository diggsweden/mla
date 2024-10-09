// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { expect, test } from 'vitest'
import { render } from "@testing-library/react"
import { MLA } from "./MLA"
import * as config from '../../../tools/test/default.json'
import { page } from '@vitest/browser/context'
import React from 'react'

test("should render", async () => {
    render(<MLA config={JSON.stringify(config)} />)

    const loader = page.getByText("Mönster Länk Analys startar...")
    await expect.element(loader).toBeInTheDocument()
})

test("should add entity", async () => {
    render(<MLA config={JSON.stringify(config)} />)

    const personButton = page.getByText("Person")
    await expect.element(personButton).toBeInTheDocument()

    await personButton.click()
    await expect.element(page.getByText("Create: Person")).toBeInTheDocument()

    await page.getByLabelText("Förnamn").fill("First")
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.getByLabelText("Efternamn").fill("Last")
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.getByRole('button', { name: 'Save' }).click()

    await expect.element(page.getByLabelText("Förnamn")).toHaveValue("First")
})