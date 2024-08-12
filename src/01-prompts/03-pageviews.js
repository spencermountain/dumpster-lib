import prompts from 'prompts'

const getLanguage = async function () {

  const response = await prompts({
    type: 'text',
    name: 'lang',
    message: 'Which language?',
    initial: `en`,
    validate: lang => !lang || lang.length < 2 ? `Provide a 2-letter language code` : true
  });

  return response;
}

export default getLanguage
