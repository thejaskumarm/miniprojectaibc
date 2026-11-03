// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustTraceAnchor
 * @dev Cryptographic anchoring smart contract for TrustTrace AI Supply Chain Verification.
 * Anchors off-chain event payload hashes with canonical proof chaining to detect tampering.
 */
contract TrustTraceAnchor {
    address public owner;

    struct AnchoredEvent {
        bytes32 shipmentHash;
        string eventId;
        string eventType;
        uint256 timestamp;
        bytes32 payloadHash;
        address submitter;
        bytes32 prevHash;
        uint256 blockNumber;
    }

    // Mapping from shipmentHash => array of AnchoredEvent
    mapping(bytes32 => AnchoredEvent[]) private _shipmentEvents;

    // Mapping to prevent duplicate event IDs: keccak256(shipmentHash, eventId) => bool
    mapping(bytes32 => bool) private _eventExists;

    // Authorized submitters (carriers, certified IoT loggers, customs agents)
    mapping(address => bool) public authorizedSubmitters;

    // Events
    event EventAnchored(
        bytes32 indexed shipmentHash,
        string eventId,
        string eventType,
        bytes32 payloadHash,
        bytes32 prevHash,
        address indexed submitter,
        uint256 timestamp
    );

    event SubmitterAuthorized(address indexed submitter);
    event SubmitterRevoked(address indexed submitter);

    modifier onlyOwner() {
        require(msg.sender == owner, "TrustTrace: Caller is not the contract owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedSubmitters[msg.sender],
            "TrustTrace: Caller is not an authorized event submitter"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedSubmitters[msg.sender] = true;
    }

    function setSubmitterAuthorization(address submitter, bool authorized) external onlyOwner {
        require(submitter != address(0), "TrustTrace: Invalid zero address");
        authorizedSubmitters[submitter] = authorized;
        if (authorized) {
            emit SubmitterAuthorized(submitter);
        } else {
            emit SubmitterRevoked(submitter);
        }
    }

    /**
     * @notice Anchors a verifiable supply chain milestone hash on-chain.
     */
    function anchorEvent(
        bytes32 shipmentHash,
        string calldata eventId,
        string calldata eventType,
        uint256 timestamp,
        bytes32 payloadHash,
        bytes32 prevHash
    ) external onlyAuthorized returns (uint256 eventIndex) {
        require(shipmentHash != bytes32(0), "TrustTrace: Invalid shipment hash");
        require(payloadHash != bytes32(0), "TrustTrace: Invalid payload hash");
        require(bytes(eventId).length > 0, "TrustTrace: Empty event ID");

        bytes32 duplicateKey = keccak256(abi.encodePacked(shipmentHash, eventId));
        require(!_eventExists[duplicateKey], "TrustTrace: Duplicate event ID for this shipment");
        _eventExists[duplicateKey] = true;

        AnchoredEvent memory newEvent = AnchoredEvent({
            shipmentHash: shipmentHash,
            eventId: eventId,
            eventType: eventType,
            timestamp: timestamp,
            payloadHash: payloadHash,
            submitter: msg.sender,
            prevHash: prevHash,
            blockNumber: block.number
        });

        _shipmentEvents[shipmentHash].push(newEvent);
        eventIndex = _shipmentEvents[shipmentHash].length - 1;

        emit EventAnchored(
            shipmentHash,
            eventId,
            eventType,
            payloadHash,
            prevHash,
            msg.sender,
            timestamp
        );
    }

    /**
     * @notice Verifies whether a candidate payload matches the anchored on-chain record.
     */
    function verifyEvent(
        bytes32 shipmentHash,
        string calldata eventId,
        bytes32 computedPayloadHash
    ) external view returns (bool isValid, string memory reason, bytes32 anchoredHash, address submitter) {
        AnchoredEvent[] storage events = _shipmentEvents[shipmentHash];
        for (uint256 i = 0; i < events.length; i++) {
            if (keccak256(bytes(events[i].eventId)) == keccak256(bytes(eventId))) {
                anchoredHash = events[i].payloadHash;
                submitter = events[i].submitter;
                if (events[i].payloadHash == computedPayloadHash) {
                    return (true, "Cryptographic match: Payload hash verified against on-chain anchor", anchoredHash, submitter);
                } else {
                    return (false, "TAMPERING DETECTED: Computed payload hash does not match anchored on-chain hash", anchoredHash, submitter);
                }
            }
        }
        return (false, "Event not found on blockchain anchor registry", bytes32(0), address(0));
    }

    function getShipmentEventCount(bytes32 shipmentHash) external view returns (uint256) {
        return _shipmentEvents[shipmentHash].length;
    }

    function getShipmentEvent(bytes32 shipmentHash, uint256 index) external view returns (
        string memory eventId,
        string memory eventType,
        uint256 timestamp,
        bytes32 payloadHash,
        address submitter,
        bytes32 prevHash,
        uint256 blockNumber
    ) {
        require(index < _shipmentEvents[shipmentHash].length, "TrustTrace: Event index out of bounds");
        AnchoredEvent storage ev = _shipmentEvents[shipmentHash][index];
        return (
            ev.eventId,
            ev.eventType,
            ev.timestamp,
            ev.payloadHash,
            ev.submitter,
            ev.prevHash,
            ev.blockNumber
        );
    }
}
