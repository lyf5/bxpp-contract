const colors = require('colors')
const BXPP = artifacts.require('BXPP.sol')
const { deployProxy } = require('@openzeppelin/truffle-upgrades')

module.exports = async deployer => {
  const app = await deployProxy(BXPP, { deployer, initializer: 'initialize' })
  const owner = await app.owner()
  console.log(colors.grey(`BXPP contract owner: ${owner}`))
  console.log(colors.green('BXPP contract address:'))
  console.log(colors.yellow(app.address))
}
