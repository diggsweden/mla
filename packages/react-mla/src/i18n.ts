// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../i18n/en.json'
import sv from '../i18n/sv.json'

// The language is changed to the one of the configuration when it is loaded
void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sv: { translation: sv }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })
