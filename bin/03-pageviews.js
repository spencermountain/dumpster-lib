import prompts from 'prompts'
import { onCancel } from './_lib.js'

const getPageviews = async function () {

  const response = await prompts({
    type: 'confirm',
    name: 'pageviews',
    message: 'Would you like to download and include Pageviews data?',
  }, { onCancel });

  return response;
}

export default getPageviews
