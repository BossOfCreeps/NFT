import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC721 functions", function () {
  let owner : any
  let account1 : any
  let account2 : any
  let erc721 : any

  let zero_address = '0x0000000000000000000000000000000000000000';

  let test_url_1 = "https://ipfs.io/ipfs/QmUMNVB73hB7wdZqAeRigZjpjpFeouo7WC1yvbx7MY9gez?filename=1.jpg";
  let test_url_2 = "https://ipfs.io/ipfs/QmUMNVB73hB7wdZqAeRigZjpjpFeouo7WC1yvbx7MY9gez?filename=2.jpg";
  let test_url_3 = "https://ipfs.io/ipfs/kimlkllhgbndk13lgfdlkQmUMNVB73hB7fkflftfyuimnl?filename=3.jpg";

  beforeEach(async function(){
    [owner, account1, account2] = await ethers.getSigners()
    const ERC721 = await ethers.getContractFactory("ERC721", owner)
    erc721 = await ERC721.deploy("ERC721", "HIX")
    await erc721.deployed()
  })

  it("Test name", async function () {
      expect(await erc721.name()).to.equal("ERC721");
  });

  it("Test symbol", async function () {
      expect(await erc721.symbol()).to.equal("HIX");
  });
  
  it("Test mint success", async function () {
    expect(await erc721.totalSupply()).to.equal(0);

    await (await erc721.connect(owner).mint(owner.address, test_url_1)).wait();
    await (await erc721.connect(owner).mint(account1.address, test_url_2)).wait();
    await (await erc721.connect(owner).mint(account1.address, test_url_3)).wait();

    expect(await erc721.totalSupply()).to.equal(3);

    expect(await erc721.tokenURI(0)).to.equal(test_url_1);
    expect(await erc721.tokenURI(1)).to.equal(test_url_2);
    expect(await erc721.tokenURI(2)).to.equal(test_url_3);
    expect(await erc721.tokenURI(3)).to.equal('');

    expect(await erc721.balanceOf(owner.address)).to.equal(1);
    expect(await erc721.balanceOf(account1.address)).to.equal(2);
    expect(await erc721.balanceOf(account2.address)).to.equal(0);

    expect(await erc721.ownerOf(0)).to.equal(owner.address);
    expect(await erc721.ownerOf(1)).to.equal(account1.address);
    expect(await erc721.ownerOf(2)).to.equal(account1.address);
    expect(await erc721.ownerOf(3)).to.equal(zero_address);
  });
  
  it("Test balanceOf error zero address", async function () {
      await expect(erc721.balanceOf(zero_address)).to.be.revertedWith('ERC721: balanceOf zero address');
  });

  it("Test mint error no owner", async function () {
      await expect(erc721.connect(account1).mint(account1.address, test_url_1)).to.be.revertedWith('ERC721: mint can call only by owner');
  });

  it("Test mint error zero address", async function () {
      await expect(erc721.connect(owner).mint(zero_address, test_url_1)).to.be.revertedWith('ERC721: mint zero address');
  });

  it("Test mint error empty url", async function () {
      await expect(erc721.connect(owner).mint(owner.address, '')).to.be.revertedWith('ERC721: mint empty url');
  });

  it("Test transfer success from owner", async function () {
    await (await erc721.connect(owner).mint(owner.address, test_url_1)).wait();

    await (await erc721.connect(owner).transferFrom(owner.address, account1.address, 0)).wait();

    expect(await erc721.ownerOf(0)).to.equal(account1.address);
  });

  it("Test transfer success with token approvals", async function () {
    let tokenId = await erc721.totalSupply();

    await (await erc721.connect(owner).mint(owner.address, test_url_1)).wait();
    await (await erc721.connect(owner).approve(account2.address, tokenId)).wait();
    expect(await erc721.getApproved(tokenId)).to.equal(account2.address);

    await (await erc721.connect(account2).transferFrom(owner.address, account1.address, tokenId)).wait();
    expect(await erc721.ownerOf(tokenId)).to.equal(account1.address);
  });

  it("Test transfer success with operator approvals", async function () {
    let tokenId = await erc721.totalSupply();

    await (await erc721.connect(owner).mint(owner.address, test_url_1)).wait();
    await (await erc721.connect(owner).setApprovalForAll(account2.address, true)).wait();
    expect(await erc721.isApprovalForAll(owner.address, account2.address)).to.equal(true);

    await (await erc721.connect(account2).transferFrom(owner.address, account1.address, tokenId)).wait();

    expect(await erc721.ownerOf(tokenId)).to.equal(account1.address);
  });

  it("Test transfer error with operator approvals set false", async function () {
    let tokenId = await erc721.totalSupply();

    await (await erc721.connect(owner).mint(owner.address, test_url_1)).wait();
    await (await erc721.connect(owner).mint(owner.address, test_url_2)).wait();

    await (await erc721.connect(owner).setApprovalForAll(account2.address, true)).wait();
    await (await erc721.connect(account2).transferFrom(owner.address, account1.address, tokenId)).wait();
    expect(await erc721.ownerOf(tokenId)).to.equal(account1.address);
    
    await (await erc721.connect(owner).setApprovalForAll(account2.address, false)).wait();
    await expect(erc721.connect(account2).transferFrom(owner.address, account1.address, tokenId + 1)).to.be.revertedWith('ERC721: transferFrom no access to this token');
  });

  it("Test transfer error no access", async function () {
    let tokenId = await erc721.totalSupply();

    await (await erc721.connect(owner).mint(owner.address, test_url_1)).wait();

    await expect(erc721.connect(account2).transferFrom(owner.address, account1.address, tokenId)).to.be.revertedWith('ERC721: transferFrom no access to this token');
  });

  it("Test transferFrom error zero address from", async function () {
      await expect(erc721.connect(owner).transferFrom(zero_address, owner.address, 0)).to.be.revertedWith('ERC721: transferFrom zero address from');
  });  
  
  it("Test transferFrom error zero address to", async function () {
      await expect(erc721.connect(owner).transferFrom(owner.address, zero_address, 0)).to.be.revertedWith('ERC721: transferFrom zero address to');
  });

  it("Test approve error zero address", async function () {
      await expect(erc721.connect(owner).approve(zero_address, 0)).to.be.revertedWith('ERC721: approve zero address');
  });

  it("Test approve error not owner", async function () {
      await expect(erc721.connect(account1).approve(account1.address, 0)).to.be.revertedWith('ERC721: approve you are not owner of token');
  });
  
  it("Test setApprovalForAll error zero address", async function () {
      await expect(erc721.connect(owner).setApprovalForAll(zero_address, 0)).to.be.revertedWith('ERC721: setApprovalForAll zero address');
  });

  it("Test isApprovalForAll error zero address owner", async function () {
      await expect(erc721.connect(owner).isApprovalForAll(zero_address, owner.address)).to.be.revertedWith('ERC721: isApprovalForAll zero address owner');
  });

  it("Test isApprovalForAll error zero address operator", async function () {
      await expect(erc721.connect(owner).isApprovalForAll(owner.address, zero_address)).to.be.revertedWith('ERC721: isApprovalForAll zero address operator');
  });
});