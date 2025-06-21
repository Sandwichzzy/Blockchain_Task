// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

//contract address:0xeCc788433a4cA9102785F0e8134B416194AA654f
contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    //  name   NFT 的名称
    //  symbol NFT 的符号
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    //  to 接收者地址
    function safeMint(address recipient, string memory uri) public onlyOwner {
        uint tokenID = _nextTokenId++;
        _safeMint(recipient, tokenID);
        _setTokenURI(tokenID, uri);
    }

    function tokenURI(
        uint256 tokenID
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenID);
    }

    function supportsInterface(
        bytes4 interfaceID
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceID);
    }
}
