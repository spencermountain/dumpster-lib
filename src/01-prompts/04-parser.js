import prompts from 'prompts'
import { onCancel } from './_lib.js'

const getParser = async function () {

  const response = await prompts({
    type: 'select',
    name: 'parser',
    message: 'What data would you like, for each page?',
    choices: [
      { title: 'JSON', value: 'json', description: 'pages parsed into data' },
      { title: 'Plaintext', value: 'text', description: 'pages turned into clean text' },
      { title: 'Custom Parser', value: 'custom', description: 'Point to a javascript file', }
    ],
  }, { onCancel });

  return response;
}

export default getParser
