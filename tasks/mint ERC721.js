require("@nomiclabs/hardhat-web3");

task("mint_erc721", "Mint ERC721 contract")
  .addParam("address", "Owner address")
  .addParam("value", "NFT url")
  .setAction(async (taskArgs) => {
    const instance = await hre.ethers.getContractAt("ERC721", process.env.INFURA_CONTRACT_ADDRESS);
    await instance.mint({to: taskArgs.to, url: taskArgs.value});
  });

module.exports = {};