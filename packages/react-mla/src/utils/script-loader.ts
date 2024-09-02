// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

export async function loadScript (fileUrl: string): Promise<{ status: boolean, error?: string }> {
  return await new Promise((resolve, reject) => {
    try {
      const scriptEle = document.createElement('script')
      scriptEle.type = 'text/javascript'
      scriptEle.async = false

      scriptEle.src = fileUrl

      scriptEle.addEventListener('load', () => {
        resolve({ status: true })
      })

      scriptEle.addEventListener('error', (ev: ErrorEvent) => {
        reject(new Error(ev.message))
      })

      document.head.appendChild(scriptEle)
    } catch (error) {
      reject(error)
    }
  })
}
