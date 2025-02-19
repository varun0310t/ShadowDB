import { createClient } from 'redis';

const Rclient = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

export default Rclient;