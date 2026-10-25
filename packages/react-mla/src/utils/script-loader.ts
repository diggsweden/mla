// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

export async function loadScript (fileUrl: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.async = false
    script.src = fileUrl
    script.addEventListener('load', () => { resolve() })
    script.addEventListener('error', () => { reject(new Error('Could not load ' + fileUrl)) })
    document.head.appendChild(script)
  })
}
