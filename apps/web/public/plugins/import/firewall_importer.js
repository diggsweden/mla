// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

function global_firewall_import (csvfile) {
  const result = {
    Entities: [],
    Links: [],
    Events: [],
    ErrorMessage: ""
  }

  const lines = csvfile.split('\n')

  let added = 0
  for (let i = lines.length - 1; i >= 5; i--) {
    const data = lines[i].split(' ')
    if (data.length < 10) {
      continue
    }

    // if (added > 20000) {
    //   result.ErrorMessage = "Fler än 20 000 händelser, importen avslutades. Förfina sökningen"
    //   break
    // }
    
    const time = `${data[0]}T${data[1]}`
    const event = {
      Date: new Date(time),
      TypeId: data[2] === 'DROP' ? 'deny' : 'allow',
      Properties: [
        {
          TypeId: "typ",
          Value: data[3]
        },
        {
          TypeId: "ip_from",
          Value: data[4]
        },        
        {
          TypeId: "ip_to",
          Value: data[3] === 'UDP' ? '127.0.0.1' : data[5]
        },
        {
          TypeId: "port_from",
          Value: data[6]
        },        
        {
          TypeId: "port_to",
          Value: data[7]
        },
        {
          TypeId: "direction",
          Value: data[16]
        }
      ]
    }
    added++
    result.Events.push(event)
  }

  return result
}