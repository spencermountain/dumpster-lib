import os from 'os'
const cpuCount = os.cpus().length

export default {
  // which wikipedia namespaces to handle (null will do all)
  namespace: 0, //(default article namespace)
  // whether to include pages that are redirects
  redirects: false,
  // whether to include disambiguiation pages
  disambiguation: true,
  // define how many concurrent workers to run
  workers: cpuCount, // default is cpu count
  //interval to log status
  heartbeat: 5000, //every 5 seconds
  // how many pages to process at a time
  chunks: 10,

}
