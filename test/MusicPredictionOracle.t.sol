// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MusicPredictionOracle.sol";

contract MusicPredictionOracleTest is Test {
    MusicPredictionOracle oracle;
    address owner;
    address alice;

    function setUp() public {
        owner = address(this);
        alice = vm.addr(1);
        oracle = new MusicPredictionOracle();
    }

    function testStorePrediction() public {
        uint256 songId = 123;
        uint256 prob = 5000;
        bool isHit = true;
        string memory version = "vtest";
        string memory songHash = "deadbeef";

        uint256 pid = oracle.storePrediction(songId, prob, isHit, version, songHash);

    MusicPredictionOracle.Prediction memory p = oracle.getPrediction(pid);

    assertEq(p.predictor, address(this));
    assertEq(p.songId, songId);
    assertEq(p.isPredictedHit, isHit);
    assertEq(p.modelVersion, version);
    }

    function testVerifyPrediction() public {
        uint256 pid = oracle.storePrediction(1, 1000, false, "v1", "h");

        // Only owner (deployer) can verify
        oracle.verifyPrediction(pid, true);

    MusicPredictionOracle.Prediction memory p2 = oracle.getPrediction(pid);
    assertTrue(p2.verified);
    assertTrue(p2.actualOutcome);
    }
}
