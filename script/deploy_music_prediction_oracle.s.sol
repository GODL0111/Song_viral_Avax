// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/MusicPredictionOracle.sol";

contract DeployMusicPredictionOracle is Script {
    function run() external {
        vm.startBroadcast();
        MusicPredictionOracle oracle = new MusicPredictionOracle();
        vm.stopBroadcast();
    }
}
