// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import Property from "./Property"
import React from 'react';

test("should handle string", async () => {
    const { getByLabelText } = render(<Property config={{
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
    const { getByLabelText } = render(<Property config={{
        TypeId: 'xx',
        Name: 'Input',
        Description: 'Input description',
        FieldType: 'Number'
    }}
        value="3"
    />)

    await expect.element(getByLabelText("Input")).toHaveValue(3)
});
