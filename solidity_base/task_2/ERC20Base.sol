// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract SimpleERC20 {
    string public name;
    string public symbol;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        totalSupply = _initialSupply * (10 ** uint256(_decimals)); //初始供应量转换为最小单位wei=10**18的总量
        _balances[owner] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this function");
        _;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount); //0地址 代表从无到有 铸造过程
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(
            _balances[msg.sender] >= amount,
            "ERC20:this account has no enough balance"
        );
        _balances[msg.sender] -= amount;
        _balances[to] += amount; // 转账到另一个地址
        emit Transfer(msg.sender, to, amount); // 发出转账事件
        return true;
    }

    //允许代币持有者(msg.sender)授权给第三方地址(spender)一定额度(amount)的代币操作权限，用于后续的transferFrom代扣转账操作。
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    //返回所有者允许花费者的代币数量
    function allowance(
        address _owner,
        address spender
    ) public view returns (uint256) {
        return _allowances[_owner][spender];
    }

    //允许被授权地址(msg.sender)代理转移代币所有者(from)的资金到目标地址(to)，是交易所提现、DeFi协议操作用户资金的基础功能
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        require(
            _balances[from] > amount,
            "ERC20:transfer amount exceeds balance"
        );
        if (_allowances[from][msg.sender] < amount) {
            revert("ERC20: transfer amount exceeds allowance");
        }
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
