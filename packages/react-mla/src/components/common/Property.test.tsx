// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import Property from "./Property"
import React from 'react';

test("should handle string", async () => {
    const { getByLabelText } = await render(<Property config={{
        TypeId: 'xx',
        Name: 'Input',
        Description: 'Input description',
        FieldType: 'String'
    }}
        value="text"
    />)

    await expect.element(getByLabelText("Input")).toHaveValue("text")
});

test("should handle number", async () => {
    const { getByLabelText } = await render(<Property config={{
        TypeId: 'xx',
        Name: 'Input',
        Description: 'Input description',
        FieldType: 'Number'
    }}
        value="3"
    />)

    await expect.element(getByLabelText("Input")).toHaveValue(3)
});

test("should show an empty number as empty", async () => {
    const { getByLabelText } = await render(<Property config={{
        TypeId: 'xx',
        Name: 'Input',
        Description: 'Input description',
        FieldType: 'Number'
    }}
    />)

    await expect.element(getByLabelText("Input")).toHaveValue(null)
});

test("should show zero as zero", async () => {
    const { getByLabelText } = await render(<Property config={{
        TypeId: 'xx',
        Name: 'Input',
        Description: 'Input description',
        FieldType: 'Number'
    }}
        value={0}
    />)

    await expect.element(getByLabelText("Input")).toHaveValue(0)
});

test("should let a number be removed", async () => {
    const changes: Array<string | number | boolean | undefined> = []
    const { getByLabelText } = await render(<Property config={{
        TypeId: 'xx',
        Name: 'Input',
        Description: 'Input description',
        FieldType: 'Number'
    }}
        value={5}
        onChange={(v) => { changes.push(v) }}
    />)

    const input = getByLabelText("Input")
    await input.fill('')
    await expect.element(input).toHaveValue(null)
    await expect.poll(() => changes).toEqual([undefined])
});
