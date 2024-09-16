// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import fs from 'node:fs';
import path from 'node:path';

const styles = {
    symbols: ['outlined', 'rounded', 'sharp'],
};

const materialSymbols = './node_modules/@material-symbols/svg-400';
const customIcons = './custom_icons';
const output = '../../packages/react-mla/src/icons.json';

const result = {};

function addToResult(name, path) {
    const contents = fs.readFileSync(path, 'utf-8')
    result[name.replace("-", "_")] = contents.toString();
}

for (var folder of styles.symbols) {
    for (var file of fs.readdirSync(path.join(materialSymbols, folder))) {
        if (file.endsWith('.svg')) {
            addToResult(path.basename(folder + '_' + file, ".svg"), path.join(materialSymbols, folder, file))
        }
    }
}

for (var file of fs.readdirSync(customIcons)) {
    if (file.endsWith('.svg')) {
        addToResult(path.basename(file, ".svg"), path.join(customIcons, file))
    }
}

console.log(`Imported ${Object.keys(result).length} icons`)
fs.writeFileSync(output, JSON.stringify(result, null, 2))
