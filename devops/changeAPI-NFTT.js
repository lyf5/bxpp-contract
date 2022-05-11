require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')
const { ethers } = require('ethers')
const { isConstructorDeclaration } = require('typescript')
const NFTT = artifacts.require('NFTT.sol')

const start = async callback => {
  try {
    const accounts = () =>
      new HDWalletProvider({
        mnemonic: process.env.MNEMONIC,
        providerOrUrl: process.env.WALLET_PROVIDER_URL,
      })

    const FROM = ethers.utils.getAddress(accounts().getAddresses()[0])
    const contract = await NFTT.deployed()

    const response = await contract.setBaseURI('https://ipfs.io/ipfs/', {
      from: FROM,
    })
    console.log("for debug. setBaseURI",);

    callback(JSON.stringify(response))
  } catch (e) {
    callback(e)
  }
}

module.exports = start
