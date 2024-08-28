// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { freeze } from 'immer'
import * as icons from '../icons.json'
import { toPng } from '../utils/canvas'
import configService from './configurationService'
import viewService from './viewService'

const size = 100
class IconService {
  private readonly svgs = new Map<string, string>()
  private readonly pngs = new Map<string, string>()

  public async init (): Promise<void> {
    const config = configService.getConfiguration()

    const iconsToImport: Record<string, string> = {
      ...icons,
      ...config.Icons
    }

    for (const key of Object.keys(iconsToImport)) {
      this.svgs.set(key, iconsToImport[key])
    }

    for (const ent of config.Domain.EntityTypes) {
      const view = viewService.getView(ent.TypeId)
      await this.getPNG(view.Icon, view.Color, undefined, undefined, false)
      await this.getPNG(view.Icon, view.Color, undefined, undefined, true)
    }
  }

  public getSVG (icon: string): string {
    return this.getSVGInternal(icon)
  }

  public async getPNG (icon: string, color: string, icon2?: string, color2?: string, withSelectedStyle?: boolean): Promise<string> {
    const key = icon + '-color-' + color + '-size-' + size + '-icon2-' + icon2 + '-color2-' + color2 + '-withSelectedStyle-' + withSelectedStyle

    if (this.pngs.has(key)) {
      return this.pngs.get(key)!
    }

    const png = await toPng(this.getSVGInternal(icon), color, size, icon2 ? this.getSVGInternal(icon2) : undefined, color2, withSelectedStyle)
    this.pngs.set(key, png)
    return png
  }

  private getSVGInternal (icon: string): string {
    if (!this.svgs.has(icon)) {
      for (const prefix of ['outlined', 'round', 'sharp']) {
        const test = prefix + '_' + icon
        if (this.svgs.has(test)) {
          this.svgs.set(icon, this.svgs.get(test)!)
          return this.svgs.get(test)!
        }
      }

      console.error(`Icon not found: "${icon}", Available icons`, this.svgs.keys())
      return this.svgs.get('filled_warning')!
    }

    return this.svgs.get(icon)!
  }
}

const iconService = freeze(new IconService())

export default iconService
