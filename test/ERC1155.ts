import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC1155 functions", function () {
  let owner : any
  let account1 : any
  let account2 : any
  let erc1155 : any

  let zero_address = '0x0000000000000000000000000000000000000000';

  let test_url_1 = "https://ipfs.io/ipfs/QmUMNVB73hB7wdZqAeRigZjpjpFeouo7WC1yvbx7MY9gez?filename=1.jpg";
  let test_url_2 = "https://ipfs.io/ipfs/QmUMNVB73hB7wdZqAeRigZjpjpFeouo7WC1yvbx7MY9gez?filename=2.jpg";
  let test_url_3 = "https://ipfs.io/ipfs/kimlkllhgbndk13lgfdlkQmUMNVB73hB7fkflftfyuimnl?filename=3.jpg";

  beforeEach(async function(){
    [owner, account1, account2] = await ethers.getSigners()
    const ERC1155 = await ethers.getContractFactory("ERC1155", owner)
    erc1155 = await ERC1155.deploy("ERC1155", "HIX")
    await erc1155.deployed()
  })

  it("Test name", async function () {
      expect(await erc1155.name()).to.equal("ERC1155");
  });

  it("Test symbol", async function () {
      expect(await erc1155.symbol()).to.equal("HIX");
  });

  it("Test mint success", async function () {
    expect(await erc1155.totalSupply()).to.equal(0);

    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 3)).wait();
    await (await erc1155.connect(owner).mint(account1.address, test_url_2, 1)).wait();
    await (await erc1155.connect(owner).mint(account1.address, test_url_3, 2)).wait();
    await (await erc1155.connect(owner).mint(account1.address, test_url_3, 5)).wait();

    expect(await erc1155.totalSupply()).to.equal(3 + 5 + 1 + 2);

    expect(await erc1155.tokenURI(0)).to.equal(test_url_1);
    expect(await erc1155.tokenURI(1)).to.equal(test_url_2);
    expect(await erc1155.tokenURI(2)).to.equal(test_url_3);
    expect(await erc1155.tokenURI(3)).to.equal(test_url_3);
    expect(await erc1155.tokenURI(4)).to.equal('');

    expect(await erc1155.balanceOf(owner.address, 0)).to.equal(3);
    expect(await erc1155.balanceOf(owner.address, 1)).to.equal(0);
    expect(await erc1155.balanceOf(account1.address, 1)).to.equal(1);
    expect(await erc1155.balanceOf(account1.address, 2)).to.equal(2);
    expect(await erc1155.balanceOf(account1.address, 3)).to.equal(5);
    expect(await erc1155.balanceOf(account1.address, 4)).to.equal(0);

    let a = await erc1155.balanceOfBatch([owner.address, owner.address, account1.address, account1.address, account1.address], [0,1,1,2,3]);
    expect(a[0]).to.equal(3);
    expect(a[1]).to.equal(0);
    expect(a[2]).to.equal(1);
    expect(a[3]).to.equal(2);
    expect(a[4]).to.equal(5);
  });

  it("Test balanceOf error accounts and ids length mismatch", async function () {
      await expect(erc1155.balanceOf(zero_address,0)).to.be.revertedWith('ERC1155: balanceOf zero address');
  });

  it("Test balanceOfBatch error accounts and ids length mismatch", async function () {
      await expect(erc1155.balanceOfBatch([owner.address],[1,2])).to.be.revertedWith('ERC1155: accounts and ids length mismatch');
  });

  it("Test mint error no owner", async function () {
      await expect(erc1155.connect(account1).mint(account1.address, test_url_1, 5)).to.be.revertedWith('ERC1155: mint can call only by owner');
  });

  it("Test mint error zero address", async function () {
      await expect(erc1155.connect(owner).mint(zero_address, test_url_1, 5)).to.be.revertedWith('ERC1155: mint zero address');
  });

  it("Test mint error empty url", async function () {
      await expect(erc1155.connect(owner).mint(owner.address, '', 5)).to.be.revertedWith('ERC1155: mint empty url');
  });
  
  it("Test mint error zero coins", async function () {
      await expect(erc1155.connect(owner).mint(owner.address, test_url_1, 0)).to.be.revertedWith('ERC1155: mint count is zero');
  });

  it("Test transfer success from owner", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 5)).wait();

    await (await erc1155.connect(owner).transferFrom(owner.address, account1.address, 0, 3)).wait();

    expect(await erc1155.balanceOf(owner.address, 0)).to.equal(5 - 3);
    expect(await erc1155.balanceOf(account1.address, 0)).to.equal(3);
  });

  it("Test transfer success with operator approvals", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 5)).wait();
    await (await erc1155.connect(owner).setApprovalForAll(account2.address, true)).wait();
    expect(await erc1155.isApprovalForAll(owner.address, account2.address)).to.equal(true);

    await (await erc1155.connect(account2).transferFrom(owner.address, account1.address, 0, 3)).wait();

    expect(await erc1155.balanceOf(owner.address, 0)).to.equal(5 - 3);
    expect(await erc1155.balanceOf(account1.address, 0)).to.equal(3);
  });

  it("Test transfer error with operator approvals set false", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 5)).wait();

    await (await erc1155.connect(owner).setApprovalForAll(account2.address, true)).wait();
    await (await erc1155.connect(account2).transferFrom(owner.address, account1.address, 0, 3)).wait();

    await (await erc1155.connect(owner).setApprovalForAll(account2.address, false)).wait();
    expect(await erc1155.isApprovalForAll(owner.address, account2.address)).to.equal(false);
    await expect(erc1155.connect(account2).transferFrom(owner.address, account1.address, 0, 1)).to.be.revertedWith('ERC1155: transferFrom no access to this token');

    expect(await erc1155.balanceOf(owner.address, 0)).to.equal(5 - 3);
    expect(await erc1155.balanceOf(account1.address, 0)).to.equal(3);
  });

  it("Test transfer error no access", async function () {
    let tokenId = await erc1155.totalSupply();

    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 5)).wait();

    await expect(erc1155.connect(account2).transferFrom(owner.address, account1.address, tokenId, 3)).to.be.revertedWith('ERC1155: transferFrom no access to this token');
  });

  it("Test transferFrom error zero address from", async function () {
      await expect(erc1155.connect(owner).transferFrom(zero_address, owner.address, 0, 1)).to.be.revertedWith('ERC1155: transferFrom zero address from');
  });  
  
  it("Test transferFrom error zero address to", async function () {
      await expect(erc1155.connect(owner).transferFrom(owner.address, zero_address, 0, 1)).to.be.revertedWith('ERC1155: transferFrom zero address to');
  });

  it("Test transfer error no balance owner", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 5)).wait();

    await expect(erc1155.connect(owner).transferFrom(owner.address, account1.address, 0, 10)).to.be.revertedWith('ERC1155: transferFrom no balance of token');
  });

  it("Test setApprovalForAll error zero address to", async function () {
      await expect(erc1155.connect(owner).setApprovalForAll(zero_address, true)).to.be.revertedWith('ERC1155: setApprovalForAll zero address');
  });
  
  it("Test safeBatchTransferFrom success by owner", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 3)).wait();
    await (await erc1155.connect(owner).mint(owner.address, test_url_2, 1)).wait();
    await (await erc1155.connect(owner).mint(owner.address, test_url_3, 2)).wait();
    
    await (await erc1155.connect(owner).safeBatchTransferFrom(owner.address, account1.address, [0, 2], [3, 1])).wait();

    expect(await erc1155.balanceOf(owner.address, 0)).to.equal(0);
    expect(await erc1155.balanceOf(owner.address, 1)).to.equal(1);
    expect(await erc1155.balanceOf(owner.address, 2)).to.equal(1);
    expect(await erc1155.balanceOf(account1.address, 0)).to.equal(3);
    expect(await erc1155.balanceOf(account1.address, 1)).to.equal(0);
    expect(await erc1155.balanceOf(account1.address, 2)).to.equal(1);
  });

  it("Test safeBatchTransferFrom success by approval acccount", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 3)).wait();
    await (await erc1155.connect(owner).mint(owner.address, test_url_2, 1)).wait();
    await (await erc1155.connect(owner).mint(owner.address, test_url_3, 2)).wait();
    
    await (await erc1155.connect(owner).setApprovalForAll(account1.address, true)).wait();
    await (await erc1155.connect(account1).safeBatchTransferFrom(owner.address, account1.address, [0, 2], [3, 1])).wait();

    expect(await erc1155.balanceOf(owner.address, 0)).to.equal(0);
    expect(await erc1155.balanceOf(owner.address, 1)).to.equal(1);
    expect(await erc1155.balanceOf(owner.address, 2)).to.equal(1);
    expect(await erc1155.balanceOf(account1.address, 0)).to.equal(3);
    expect(await erc1155.balanceOf(account1.address, 1)).to.equal(0);
    expect(await erc1155.balanceOf(account1.address, 2)).to.equal(1);
  });

  it("Test safeBatchTransferFrom error ids and amounts length different", async function () {
      await expect(erc1155.connect(owner).safeBatchTransferFrom(owner.address, account1.address, [0], [3, 1])).to.be.revertedWith('ERC1155: safeBatchTransferFrom ids and amounts length different');
  });
  
  it("Test safeBatchTransferFrom error zero address from", async function () {
      await expect(erc1155.connect(owner).safeBatchTransferFrom(zero_address, account1.address, [0, 2], [3, 1])).to.be.revertedWith('ERC1155: safeBatchTransferFrom zero address from');
  });

  it("Test safeBatchTransferFrom error zero address to", async function () {
      await expect(erc1155.connect(owner).safeBatchTransferFrom(owner.address, zero_address, [0, 2], [3, 1])).to.be.revertedWith('ERC1155: safeBatchTransferFrom zero address to');
  });

  it("Test safeBatchTransferFrom error zero address to", async function () {
    await expect(erc1155.connect(account1).safeBatchTransferFrom(owner.address, account1.address, [0, 2], [3, 1])).to.be.revertedWith('ERC1155: safeBatchTransferFrom no access to tokens');
  });

  it("Test safeBatchTransferFrom error no balance of token", async function () {
    await (await erc1155.connect(owner).mint(owner.address, test_url_1, 3)).wait();
    await (await erc1155.connect(owner).mint(owner.address, test_url_2, 1)).wait();
    await (await erc1155.connect(owner).mint(owner.address, test_url_3, 2)).wait();
    
    await (await erc1155.connect(owner).setApprovalForAll(account1.address, true)).wait();
    await expect(erc1155.connect(account1).safeBatchTransferFrom(owner.address, account1.address, [0, 2], [4, 1])).to.be.revertedWith('ERC1155: safeBatchTransferFrom no balance of tokenId=0 for transfer');
  });

  it("Test isApprovalForAll error zero address owner", async function () {
      await expect(erc1155.connect(owner).isApprovalForAll(zero_address, owner.address)).to.be.revertedWith('ERC1155: isApprovalForAll zero address owner');
  });

  it("Test isApprovalForAll error zero address operator", async function () {
      await expect(erc1155.connect(owner).isApprovalForAll(owner.address, zero_address)).to.be.revertedWith('ERC1155: isApprovalForAll zero address operator');
  });  
});