import prompts from 'prompts'
import { onCancel } from './_lib.js'

const getProject = async function () {

  const response = await prompts({
    type: 'select',
    name: 'project',
    message: 'Which Wikimedia project?',
    choices: [
      { title: 'Wikipedia', value: 'wikipedia', },
      { title: 'Wiktionary', value: 'wiktionary' },
      { title: 'Wikivoyage', value: 'wikivoyage' },
      { title: 'Custom Wiki', value: 'custom', description: 'Process a 3rd-party wiki dump', }
    ],
  }, { onCancel });

  return response;
}

export default getProject
