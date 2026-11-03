const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustTraceAnchor Smart Contract Test Suite", function () {
  let anchorContract;
  let owner, carrier, unauthorizedUser;

  const shipmentId = "TT-000042";
  const shipmentHash = ethers.id(shipmentId);
  const eventId = "EVT-TT-000042-01";
  const eventType = "COLD_STORAGE_TRANSFER";
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Canonical JSON simulation
  const validPayload = JSON.stringify({
    eventId: eventId,
    shipmentId: shipmentId,
    eventType: eventType,
    temperature_c: 4.2,
    location: "Basel Pharma Hub",
    timestamp: timestamp
  });
  const validPayloadHash = ethers.id(validPayload);
  const prevHash = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, carrier, unauthorizedUser] = await ethers.getSigners();
    const TrustTraceAnchor = await ethers.getContractFactory("TrustTraceAnchor");
    anchorContract = await TrustTraceAnchor.deploy();
    await anchorContract.waitForDeployment();

    // Authorize carrier
    await anchorContract.setSubmitterAuthorization(carrier.address, true);
  });

  it("should deploy with deployer as owner and authorized submitter", async function () {
    expect(await anchorContract.owner()).to.equal(owner.address);
    expect(await anchorContract.authorizedSubmitters(owner.address)).to.be.true;
  });

  it("should permit authorized carrier to anchor a supply chain event", async function () {
    const tx = await anchorContract.connect(carrier).anchorEvent(
      shipmentHash,
      eventId,
      eventType,
      timestamp,
      validPayloadHash,
      prevHash
    );
    await tx.wait();

    const count = await anchorContract.getShipmentEventCount(shipmentHash);
    expect(count).to.equal(1n);

    const eventData = await anchorContract.getShipmentEvent(shipmentHash, 0);
    expect(eventData[0]).to.equal(eventId);
    expect(eventData[1]).to.equal(eventType);
    expect(eventData[3]).to.equal(validPayloadHash);
    expect(eventData[4]).to.equal(carrier.address);
  });

  it("should reject anchoring attempt by unauthorized submitter", async function () {
    await expect(
      anchorContract.connect(unauthorizedUser).anchorEvent(
        shipmentHash,
        eventId,
        eventType,
        timestamp,
        validPayloadHash,
        prevHash
      )
    ).to.be.revertedWith("TrustTrace: Caller is not an authorized event submitter");
  });

  it("should prevent duplicate event ID submission for the same shipment", async function () {
    await anchorContract.connect(carrier).anchorEvent(
      shipmentHash,
      eventId,
      eventType,
      timestamp,
      validPayloadHash,
      prevHash
    );

    await expect(
      anchorContract.connect(carrier).anchorEvent(
        shipmentHash,
        eventId,
        eventType,
        timestamp,
        validPayloadHash,
        prevHash
      )
    ).to.be.revertedWith("TrustTrace: Duplicate event ID for this shipment");
  });

  it("should verify authentic payload hash successfully", async function () {
    await anchorContract.connect(carrier).anchorEvent(
      shipmentHash,
      eventId,
      eventType,
      timestamp,
      validPayloadHash,
      prevHash
    );

    const [isValid, reason, anchoredHash] = await anchorContract.verifyEvent(
      shipmentHash,
      eventId,
      validPayloadHash
    );

    expect(isValid).to.be.true;
    expect(anchoredHash).to.equal(validPayloadHash);
    expect(reason).to.include("Cryptographic match");
  });

  it("should DETECT TAMPERING when payload has been altered", async function () {
    await anchorContract.connect(carrier).anchorEvent(
      shipmentHash,
      eventId,
      eventType,
      timestamp,
      validPayloadHash,
      prevHash
    );

    // Altered payload: e.g. someone fraudulently modified temperature from 4.2°C to 12.8°C
    const tamperedPayload = JSON.stringify({
      eventId: eventId,
      shipmentId: shipmentId,
      eventType: eventType,
      temperature_c: 12.8, // TAMPERED!
      location: "Basel Pharma Hub",
      timestamp: timestamp
    });
    const tamperedPayloadHash = ethers.id(tamperedPayload);

    const [isValid, reason, anchoredHash] = await anchorContract.verifyEvent(
      shipmentHash,
      eventId,
      tamperedPayloadHash
    );

    expect(isValid).to.be.false;
    expect(reason).to.include("TAMPERING DETECTED");
    expect(anchoredHash).to.equal(validPayloadHash);
    expect(tamperedPayloadHash).to.not.equal(validPayloadHash);
  });
});
