// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

export function colorShade (col: string, amt: number) {
  col = col.replace(/^#/, '')
  if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]

  const match = col.match(/.{2}/g);
  if (match == null) {
    throw new Error("Invalid color: " + col);
  }

  let [rs, gs, bs] = match;
  const [r, g, b] = [parseInt(rs, 16) + amt, parseInt(gs, 16) + amt, parseInt(bs, 16) + amt]

  rs = Math.max(Math.min(255, r), 0).toString(16)
  gs = Math.max(Math.min(255, g), 0).toString(16)
  bs = Math.max(Math.min(255, b), 0).toString(16)

  const rr = (rs.length < 2 ? '0' : '') + r
  const gg = (gs.length < 2 ? '0' : '') + g
  const bb = (bs.length < 2 ? '0' : '') + b

  return `#${rr}${gg}${bb}`
}
