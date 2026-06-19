# dumpster-lib

shared resources for [dumpster-dip](https://github.com/spencermountain/dumpster-dip), [dumpster-dive](https://github.com/spencermountain/dumpster-dive/), [dumpster-duck](https://github.com/spencermountain/dumpster-duck/) and [dumpster-disk](https://github.com/spencermountain/dumpster-disk/)

used to download, unzip, and parse wikipedia dumps, other wikimedia dumps, and 3rd-party mediawiki dumps.

### Usage

```js
import dumpster from 'dumpster-lib'

dumpster({
  project: 'wikipedia',
  lang: 'sw',
  format: 'text',
  chunkSize: 10,
  file: './swwiki-latest-pages-articles.xml'
}).on('chunk', (chunk) => {
  console.log(chunk.length,'pages to write')
}).on('end', () => {
  console.log('end')
})
```

MIT