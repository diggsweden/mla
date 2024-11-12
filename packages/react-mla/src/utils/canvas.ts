// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

export async function toPng (svgString: string, color: string, size: number, svgString2?: string, color2?: string, withSelectedStyle?: boolean): Promise<string> {
  const scale = 1.2
  const offset = (scale * size - size) / 2

  const canvas = new OffscreenCanvas(size * scale, size * scale)
  const ctx = canvas.getContext('2d')
  if (ctx == null) {
    throw new Error('Could not create canvas')
  }

  drawCircle(canvas, size * scale)

  const svg = await drawSvg(svgString, color, size)
  ctx.drawImage(svg, offset, offset, size, size)

  if (svgString2) {
    const svg2 = await drawSvg(svgString2, color2 ?? color, size * scale)
    ctx.drawImage(svg2, 0, 0)
  }

  if (withSelectedStyle) {
    const w = size * scale;
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#00008B'
    ctx.beginPath();
    ctx.arc(w/2, w/2, (w/2 - 10), 0, 2 * Math.PI)
    ctx.stroke();
  }

  // Should be in types
  const blob: Blob = await canvas.convertToBlob()
  const pngUrl = URL.createObjectURL(blob)

  return pngUrl
}

export async function drawSvg (svgString: string, color: string, size: number): Promise<OffscreenCanvas> {
  return await new Promise((resolve, reject) => {
    const canvas = new OffscreenCanvas(size, size)
    const ctx = canvas.getContext('2d')
    if (ctx == null) {
      reject(new Error('Could not create canvas'))
      return
    }

    ctx.fillStyle = color

    // Handle @material-design-icons
    let draw = svgString.replace('width="24" height="24"', `width="${size}" height="${size}"`)

    draw = draw.replaceAll('currentColor', color)
    draw = draw.replaceAll('<svg', `<svg fill="${color}"`)
    try {
      const svgDataBase64 = btoa(unescape(encodeURIComponent(draw)))
      const svgDataUrl = `data:image/svg+xml;base64,${svgDataBase64}`

      const image = new Image()
      image.onload = () => {
        ctx.drawImage(image, 0, 0, size, size)
        resolve(canvas)
      }
      image.onerror = (e) => {
        console.error(e)
        reject(new Error('Failed to load icon ' + svgString))
      }

      image.src = svgDataUrl
    } catch (e) {
      reject(e)
    }
  })
}

export function drawCircle (canvas: OffscreenCanvas, size: number): void {
  const ctx = canvas.getContext('2d')
  if (ctx == null) {
    throw new Error('Could not create canvas')
  }

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
  ctx.fill()
}
