// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from "luxon";
import { IChartBase } from "../../interfaces/data-models";
import viewService from "../../services/viewService";
import { getDateBetween, isSameDay } from "../../utils/date";
import { getId } from "../../utils/utils";
import { IViewConfiguration } from "../../interfaces/configuration/view-configuration";

export const pixelsPerMonth = 96

export function calculatePixelOffset(date: DateTime, startOffset: DateTime): number {
  const months = Math.floor(date.startOf("month").diff(startOffset, "months").months)
  const monthsPixels = pixelsPerMonth * (months)
  const datePixels = (pixelsPerMonth / date.daysInMonth!) * date.day

  return monthsPixels + datePixels;
}

export function createHistoryDots(things: IChartBase[][], startOffset: DateTime, viewConfig: IViewConfiguration) {
  const history = [] as HistoryDot[]
  for (const list of things) {
    const ent = list[0]
    const view = viewService.getView(ent.TypeId)
    if (view.Show === false) {
      continue
    }

    const evs = list.filter(x => x.DateFrom != null || x.DateTo != null);
    for (const ent of evs) {
      const isActivity = isSameDay(ent.DateFrom, ent.DateTo)
      if (ent.DateFrom) {
        let date = ent.DateFrom
        if (isActivity) {
          date = getDateBetween(ent)
        }

        history.push({
          date: date,
          rubrik: ent.LabelShort,
          text: ent.LabelLong,
          id: getId(ent),
          color: getColor(ent, viewConfig),
          offset: calculatePixelOffset(date, startOffset)
        })
      }

      if (ent.DateTo && !isActivity) {
        const date = ent.DateTo.plus({ day: 1 })

        history.push({
          date,
          rubrik: ent.LabelShort,
          text: ent.LabelLong,
          id: getId(ent),
          color: getColor(ent, viewConfig),
          offset: calculatePixelOffset(date, startOffset)
        })
      }
    }
  }

  history.sort((a, b) => a.date.diff(b.date).milliseconds)
  return history
}

export interface HistoryDot {
  color: string
  date: DateTime
  offset: number
  rubrik: string
  text: string
  id: string
}

function getColor(e: IChartBase, viewConfig: IViewConfiguration) {
  if (e.Color) {
    return e.Color
  }

  const rule = viewService.getRule(e, viewConfig)
  if (rule?.Color != null) {
    return rule.Color
  }

  return viewService.getView(e.TypeId).Color
}