import * as t from 'lib0/testing'
import * as authentication from '../src/api/authentication.js'
import * as Ystream from '../src/index.js'
import * as map from 'lib0/map'
import * as ecdsa from 'lib0/crypto/ecdsa'
import * as encoding from 'lib0/encoding'
import * as promise from 'lib0/promise'
import * as buffer from 'lib0/buffer'
import * as json from 'lib0/json'

/**
 * @type {Map<string, Array<Ystream.Ystream>>}
 */
const instances = new Map()

/**
 * @param {t.TestCase} tc
 */
const createTestDb = async tc => {
  // 初始化instances里tc.testName key所对应的value为空数组
  const testInstances = map.setIfUndefined(instances, tc.testName, () => /** @type {any} */ ([]))
  const dbname = `./.test_dbs/${tc.moduleName}-${tc.testName}-${testInstances.length}`
  console.log('INVOKE createTestDb, dbname: ', dbname)
  // 删除dbname路径下的数据库
  await Ystream.remove(dbname)
  // 重新在dbname路径下创建数据库
  const y = await Ystream.open(dbname)
  // 这个代码应该有问题吧☠️
  testInstances.push(testInstances)
  return y
}

/**
 * @param {t.TestCase} _tc
 */
export const testGenerateAuth = async _tc => {
  const userObject = await authentication.createUserIdentity({ extractable: true })
  // 相当于把公钥/私钥都转成可序列化的JWK格式，把UserIdentity对象也进行序列化编码
  const [publicKey, privateKey, user] = await promise.all([
    ecdsa.exportKeyJwk(userObject.publicKey),
    ecdsa.exportKeyJwk(userObject.privateKey),
    encoding.encode(encoder => userObject.userIdentity.encode(encoder))
  ])
  console.log({
    publicKey: json.stringify(publicKey),
    privateKey: json.stringify(privateKey),
    user: buffer.toBase64(user)
  })
}

/**
 * @param {t.TestCase} tc
 */
export const testBasic = async tc => {
  const db1 = await createTestDb(tc)
  t.assert(db1.isAuthenticated === false)
  const { userIdentity, publicKey, privateKey } = await authentication.createUserIdentity()
  await authentication.setUserIdentity(db1, userIdentity, publicKey, privateKey)
  t.assert(db1.isAuthenticated)
  const db2 = await createTestDb(tc)
  const device2 = await authentication.getDeviceIdentity(db2)
  // @todo maybe createDeviceClaim should return a dbtypes.DeviceClaim
  const claim1 = await authentication.createDeviceClaim(db1, device2)
  await authentication.useDeviceClaim(db2, claim1)
  t.assert(db2.isAuthenticated)
  const uid1 = await authentication.getUserIdentity(db1)
  const uid2 = await authentication.getUserIdentity(db2)
  t.assert(uid1.ekey === uid2.ekey)
}
