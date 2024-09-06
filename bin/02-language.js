import prompts from 'prompts'

const getLanguage = async function () {

  const response = await prompts({
    type: 'text',
    name: 'lang',
    message: 'Which language?',
    initial: `en`,
    validate: (val) => {
      if (!val || val.length !== 2) {
        return `'${val}' is invalid - Please provide a 2-letter language code, like 'fr' for French.`
      }
      return true
    }
  });

  return response;
}

export default getLanguage
