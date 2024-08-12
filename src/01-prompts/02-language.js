import prompts from 'prompts'

const getPageviews = async function () {

  const response = await prompts({
    type: 'confirm',
    name: 'pageviews',
    message: 'Do you want to include pageview data?',
    initial: true
  });
  return response;
}

export default getPageviews
