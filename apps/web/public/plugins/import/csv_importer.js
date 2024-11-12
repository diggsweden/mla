// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

function global_csv_import (csvfile) {
  const result = {
    Entities: [],
    Links: [],
    ErrorMessage: ""
  }

  const lines = csvfile.split('\n')

  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(';')
    console.log(data)

    if (data.length < 10) {
      continue
    }

    const name = data[5].split(' ')
    let fornamn = data[3]
    let efternamn = ''
    if (name.length == 2) {
      fornamn = name[0]
      efternamn = name[1]
    }

    let date = undefined
    try {
      date = new Date(data[1])
    } catch {
      // NOP
    }

    const person = {
      TypeId: 'person',
      Id: data[4],
      DateFrom: date,
      Properties: [
        {
          TypeId: 'personE6',
          Value: data[0]
        },
        {
          TypeId: 'personE1',
          Value: data[4]
        },
        {
          TypeId: 'personE2',
          Value: fornamn
        },
        {
          TypeId: 'personE3',
          Value: efternamn
        }
      ]
    }

    result.Entities.push(person)

    if (data[7] && data[7].length > 1 && data[7] !== '-') {
      const adress = {
        TypeId: 'adress',
        Id: data[5] + data[6],
        DateFrom: date,
        Properties: [
          {
            TypeId: 'adressE1',
            Value: data[7]
          },
          {
            TypeId: 'adressE2',
            Value: data[6]
          },
          {
            TypeId: 'adressE4',
            Value: data[8]
          }
        ]
      }

      result.Entities.push(adress)
      var adressLink = {
        Id: adress.Id + person.Id,
        TypeId: 'LT3',
        FromEntityId: adress.Id,
        ToEntityId: person.Id,
        FromEntityTypeId: 'adress',
        ToEntityTypeId: 'person',
        Properties: [
        ]
      }

      if (data[0] === 'folkbokförd') {
        adressLink.Properties.push({ TypeId: 'LT2E1', Value: 'Folkbokförd' })
      }

      result.Links.push(adressLink)
    }

    // if (data[7] && data[7].length > 1 && data[7] !== '-') {
    //   const telefon = {
    //     TypeId: 'ET6',
    //     Id: data[7],
    //     Properties: [
    //       {
    //         TypeId: 'ET6E1',
    //         Value: data[7]
    //       }
    //     ]
    //   }

    //   result.Entities.push(telefon)
    //   var telefonLink = {
    //     Id: person.Id + telefon.Id,
    //     TypeId: 'LT4',
    //     FromEntityId: telefon.Id,
    //     ToEntityId: person.Id,
    //     FromEntityTypeId: 'ET6',
    //     ToEntityTypeId: 'person',
    //     Properties: [
    //     ]
    //   }

    //   result.Links.push(telefonLink)
    // }

    if (data[12] && data[12].length > 1 && data[12] !== '-') {
      const organisation = {
        TypeId: 'organisation',
        Id: data[12],
        Properties: [
          {
            TypeId: 'organisationE1',
            Value: data[12]
          },
          {
            TypeId: 'organisationE2',
            Value: data[14]
          }
        ]
      }

      result.Entities.push(organisation)
      var orgLink = {
        Id: person.Id + organisation.Id,
        TypeId: 'LT1',
        FromEntityId: person.Id,
        ToEntityId: organisation.Id,
        FromEntityTypeId: 'person',
        ToEntityTypeId: 'organisation',
        Properties: [
        ]
      }

      result.Links.push(orgLink)

      // if (data[10] && data[10].length > 1 && data[10] !== '-') {
      //   let bolagAdr = data[10]
      //   let ort = ''
      //   let postnummer = ''

      //   if (data[10].indexOf(',') >= 0) {
      //     var first = bolagAdr.substring(0, bolagAdr.lastIndexOf(",") + 1);
      //     var last = bolagAdr.substring(bolagAdr.lastIndexOf(",") + 1, bolagAdr.length);
      //     var sp = last.split[' ']

      //     if (sp) {
      //       var addingPostnr = true
      //       for (var s of sp) {
      //         if (addingPostnr && !isNaN(s)) {
      //           postnummer += (s)
      //         } else {
      //           addingPostnr = false
      //           ort += (s + " ")
      //         }
      //       }
  
      //       bolagAdr = first
      //     }
      //   }

      //   const adress = {
      //     TypeId: 'adress',
      //     Id: data[10],
      //     DateFrom: date,
      //     Properties: [
      //       {
      //         TypeId: 'adressE1',
      //         Value: bolagAdr
      //       },
      //       {
      //         TypeId: 'adressE3',
      //         Value: postnummer
      //       },
      //       {
      //         TypeId: 'adressE4',
      //         Value: ort
      //       }
      //     ]
      //   }
  
      //   result.Entities.push(adress)
      //   var adressLink = {
      //     Id: adress.Id + organisation.Id,
      //     TypeId: 'LT3',
      //     FromEntityId: adress.Id,
      //     ToEntityId: organisation.Id,
      //     FromEntityTypeId: 'adress',
      //     ToEntityTypeId: 'organisation',
      //     Properties: [
      //     ]
      //   }
  
      //   result.Links.push(adressLink)
      // }
    }
  }

  return result
}