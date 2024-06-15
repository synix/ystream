import * as isodb from 'isodb'
import * as db from './db.js'
import { Ystream } from './ystream.js'

export { Ystream, Collection, YTransaction } from './ystream.js'

// 删除数据库
export const remove = isodb.deleteDB

/**
 * @param {string} dbname
 * @param {import('./ystream.js').YstreamConf} [conf]
 * @return {Promise<import('./ystream.js').Ystream>}
 * 
 * 创建数据库，dbname为数据库的路径
 */
export const open = async (dbname, conf) => {
  // idb为创建的数据库实例
  const { idb, isAuthenticated, user, deviceClaim, clientid } = await db.createDb(dbname)
  const ystream = new Ystream(dbname, idb, clientid, user, deviceClaim, conf)
  if (isAuthenticated) {
    ystream.isAuthenticated = true
    ystream.emit('authenticate', [])
  }
  return ystream
}
