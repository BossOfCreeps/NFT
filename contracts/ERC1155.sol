//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC1155 {
    string private _name;
    string private _symbol;
    address private _owner;

    mapping(uint256 => string) private _tokens;
    uint256 private _totalSupply;
    uint256 public _id;

    mapping(uint256 => mapping(address => uint256)) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
        _owner = msg.sender;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function tokenURI(uint256 tokenId) public view returns(string memory) {
        return _tokens[tokenId];
    }

    function balanceOf(address owner, uint256 tokenId) public view returns (uint256){
        require(owner != address(0), "ERC1155: balanceOf zero address");

        return _balances[tokenId][owner];
    }

    function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory){
        require(accounts.length == ids.length, "ERC1155: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;    
    }

    function transferFrom(address from, address to, uint256 tokenId, uint256 amount) public {
        require(from != address(0), "ERC1155: transferFrom zero address from");
        require(to != address(0), "ERC1155: transferFrom zero address to");
        require(_balances[tokenId][from] >= amount, "ERC1155: transferFrom no balance of token");

        require(from == msg.sender || _operatorApprovals[from][msg.sender], "ERC1155: transferFrom no access to this token");

        _balances[tokenId][from] -= amount;
        _balances[tokenId][to] += amount;
    }

    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts) public {
        require(ids.length == amounts.length, "ERC1155: safeBatchTransferFrom ids and amounts length different");
        require(from != address(0), "ERC1155: safeBatchTransferFrom zero address from");
        require(to != address(0), "ERC1155: safeBatchTransferFrom zero address to");
        require(from == msg.sender || _operatorApprovals[from][msg.sender], "ERC1155: safeBatchTransferFrom no access to tokens");

        for (uint256 i = 0; i < ids.length; ++i) {
            require(_balances[ids[i]][from] >= amounts[i], string(abi.encodePacked("ERC1155: safeBatchTransferFrom no balance of tokenId=", Strings.toString(ids[i]), " for transfer")));

            _balances[ids[i]][from] -= amounts[i];
            _balances[ids[i]][to] += amounts[i];
        }
    }

    function setApprovalForAll(address operator, bool approved) public {
        require(operator != address(0), "ERC1155: setApprovalForAll zero address");

        _operatorApprovals[msg.sender][operator] = approved;
    }

    function isApprovalForAll(address owner, address operator) public view returns(bool) {
        require(owner != address(0), "ERC1155: isApprovalForAll zero address owner");
        require(operator != address(0), "ERC1155: isApprovalForAll zero address operator");

        return _operatorApprovals[owner][operator];
    }

    function mint(address to, string memory url, uint256 count) public{
        require(_owner == msg.sender, "ERC1155: mint can call only by owner");

        require(to != address(0), "ERC1155: mint zero address");
        require(bytes(url).length != 0, "ERC1155: mint empty url");
        require(count != 0, "ERC1155: mint count is zero");

        _tokens[_id] = url;
        _balances[_id][to] += count;
        _totalSupply += count;
        _id += 1;
    }
}