// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

async function global_geocode(req, context) {
  console.log("global_geocode", req)
  if (req.Shape?.Point != null) {
    const geocode = await findAdress(req.Shape?.Point.lat, req.Shape?.Point.lng)

    if (geocode.results.length > 0) {
      const geo = geocode.results[0]
      return {
        Entities: [{
          Id: geo.place_id,
          TypeId: 'adress',
          SourceSystemId: 'Google Maps',
          Coordinates: {
            lat: geo.geometry.location.lat,
            lng: geo.geometry.location.lng
          },
          Properties: [
            {
              TypeId: 'adressE1',
              Value: geo.address_components.find(x => x.types.includes("route"))?.long_name + " " + geo.address_components.find(x => x.types.includes("street_number"))?.long_name
            },
            {
              TypeId: 'adressE3',
              Value: geo.address_components.find(x => x.types.includes("postal_code"))?.long_name
            },
            {
              TypeId: 'adressE4',
              Value: geo.address_components.find(x => x.types.includes("postal_town"))?.long_name
            }
          ]
        }],
        Links: []
      }
    }
  }

  return {
    Entities: [],
    Links: []
  }
}

async function global_reverse_geocode(req, context) {
  console.log("global_geocode", req)
  const res = {
    Entities: [],
    Links: []
  }

  if (req.Entities != null) {
    for (let ent of req.Entities) {
      const geocode = await findPosition(ent.Properties.find(p => p.TypeId == "adressE1")?.Value, ent.Properties.find(p => p.TypeId == "adressE3")?.Value)
  
      if (geocode.results.length > 0) {
        const geo = geocode.results[0]
        const update = {
          Id: ent.Id,
          TypeId: 'adress',
          SourceSystemId: 'Google Maps',
          Coordinates: {
            lat: geo.geometry.location.lat,
            lng: geo.geometry.location.lng
          },
          Properties: [
            {
              TypeId: 'adressE1',
              Value: geo.address_components.find(x => x.types.includes("route"))?.long_name + " " + geo.address_components.find(x => x.types.includes("street_number"))?.long_name
            },
            {
              TypeId: 'adressE3',
              Value: geo.address_components.find(x => x.types.includes("postal_code"))?.long_name
            },
            {
              TypeId: 'adressE4',
              Value: geo.address_components.find(x => x.types.includes("postal_town"))?.long_name
            }
          ]
        }

        res.Entities.push(update)
      }

    }
  }

  return res
}

const GOOGLE_API_KEY = "GOOGLE_MAPS_API_KEY"
async function findPosition(street, postalCode) {
  var url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(street)}&key=${GOOGLE_API_KEY}`
  if (postalCode) {
    url += `&components=postal_code:${postalCode?.replace(' ', '')}`
  }

  var geocoded = await fetch(url)

  if (geocoded.status = 200) {
    var json = await geocoded.json()
    return json
  } else {
    console.error(geocoded.statusText)
  }
}

async function findAdress(lat, lng) {
  var url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
  
  var geocoded = await fetch(url)

  if (geocoded.status = 200) {
    var json = await geocoded.json()
    return json
  } else {
    console.error(geocoded.statusText)
  }
}