// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Issuer DID registry + PII-free verification receipts.
contract VerimaskRegistry {
    struct Issuer {
        string did;
        bytes pubkey;
        bool registered;
    }

    mapping(bytes32 => Issuer) public issuers;
    mapping(bytes32 => bytes32) public credentialIssuer;
    mapping(bytes32 => bool) public receipts;

    event IssuerRegistered(bytes32 indexed didHash, string did, bytes pubkey);
    event CredentialAnchored(bytes32 indexed credHash, bytes32 indexed issuerDidHash);
    event VerificationLogged(
        bytes32 indexed receipt,
        bytes32 indexed verifierDidHash,
        bytes32 indexed issuerDidHash,
        bytes32 claimsHash,
        bool passed,
        uint64 at
    );

    function registerIssuer(string calldata did, bytes calldata pubkey) external {
        bytes32 id = keccak256(bytes(did));
        issuers[id] = Issuer({did: did, pubkey: pubkey, registered: true});
        emit IssuerRegistered(id, did, pubkey);
    }

    function anchorCredential(bytes32 credHash, bytes32 issuerDidHash) external {
        require(issuers[issuerDidHash].registered, "unknown issuer");
        credentialIssuer[credHash] = issuerDidHash;
        emit CredentialAnchored(credHash, issuerDidHash);
    }

    function logVerification(
        bytes32 receipt,
        bytes32 verifierDidHash,
        bytes32 issuerDidHash,
        bytes32 claimsHash,
        bool passed
    ) external {
        receipts[receipt] = true;
        emit VerificationLogged(
            receipt,
            verifierDidHash,
            issuerDidHash,
            claimsHash,
            passed,
            uint64(block.timestamp)
        );
    }
}
