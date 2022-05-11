require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')
const colors = require('colors')
const fetch = require('node-fetch')
const { utils, ethers } = require('ethers')
const NFTT = artifacts.require('NFTT.sol')
const path = require('path')
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2), { string: ['nfts'] })

const { SERVICE_URL } = process.env

const start = async callback => {
  try {
    const objectsToBeMinted = []

    const currentTokens = await (await fetch(`${SERVICE_URL}/token`)).json()
    const currentIndex = currentTokens.length
    const AMOUNT = Number(argv.nfts) || 1

    const accounts = () =>
      new HDWalletProvider({
        privateKeys: process.env.PRIVATEKEY.split(','),
        providerOrUrl: process.env.WALLET_PROVIDER_URL,
      })

    
    const FROM = ethers.utils.getAddress(accounts().getAddresses()[0])
    console.log("FROM:", FROM);

    console.log("amount,currentIndex:", AMOUNT, currentIndex);

    var tokenid;
    for (let i = currentIndex; i < currentIndex + AMOUNT; i++) {
      objectsToBeMinted.push(`BXPP ${i}`);
      tokenid = i;
    }

    console.log("objectsToBeMinted:", objectsToBeMinted);

    const mintAssetsOnIPFS = await (
      await fetch(`${SERVICE_URL}/mint`, {
        method: 'POST',
        body: JSON.stringify({ objectsToBeMinted }),
      })
    ).json()

    console.log("for debug. mintAssetsOnIPFS:", mintAssetsOnIPFS);

    const contract = await NFTT.deployed()
    const price = '0.2'

    const priceWei = utils.parseEther(price)
    const ipfsURLs = []

    const mintedTokens = await Promise.all(
      mintAssetsOnIPFS.map(async token => {
        ipfsURLs.push({
          description: `Description for ${token.name}`,
          external_url: `https://bxpp.io/${tokenid}`,
          image: `ipfs://${token.path}`,
          name: token.name,
          attributes: [
            {
              "trait_type": "Base", 
              "value": "Starfish"
            }, 
            {
              "trait_type": "Eyes", 
              "value": "Big"
            }, 
            {
              "trait_type": "Mouth", 
              "value": "Surprised"
            }, 
          ],
        })
        console.log("for debug. token.path:", token.path);
        return await contract.mintCollectable(FROM, priceWei, token.name, token.path, true, {
          from: FROM,
        })
      })
    )

    const content = `export const tokenProps = ${JSON.stringify([...currentTokens, ...ipfsURLs])}`

    const file = path.resolve(__dirname, '../', 'db.ts')
    await fs.writeFileSync(file, content)

    const util = require('util');
    const child_process = require('child_process');
    // 调用util.promisify方法，返回一个promise,如const { stdout, stderr } = await exec('rm -rf build')
    const exec = util.promisify(child_process.exec);

    const runCmd = async function () {
    // cwd指定子进程的当前工作目录, 这里没有。
      await exec(`cp -f ./db.ts ../nft-market-service/db/index.ts`);
    }
    runCmd();


    console.log(colors.green(`⚡️ Tokens created: ${colors.white(mintedTokens.length)}`))
    callback()
    process.exit(0)
  } catch (e) {
    console.log(e)
    callback(e)
  }
}

module.exports = start
