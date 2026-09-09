import os from 'os'
const cpuCount = os.cpus().length

export default {
  // which wikipedia namespaces to handle (null will do all)
  namespace: 0, //(default article namespace)
  // page filters
  skip_redirect: true,
  skip_disambig: false,
  skip_nsfw: false,
  // how many worker threads parse the file.
  // one core is left for the main thread, which deserializes batches and runs your writer
  workers: Math.max(1, cpuCount - 1),
  // how many pages each worker parses before handing them to your 'batch' listener
  batchPageCount: 100,
  // how many batches the main thread will hold for a slow writer, before pausing the workers.
  // (null defaults to one per worker. peak memory is about (queueLimit + workers) batches)
  queueLimit: null,
  //interval to log status (0 to disable)
  heartbeat: 5000, //every 5 seconds
  // what format to output the pages in
  format: 'json',
}
