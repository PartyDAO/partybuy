// SPDX-License-Identifier: MIT
// ============ External Imports ============
const { waffle } = require('hardhat');
const { provider } = waffle;
const { expect } = require('chai');
// ============ Internal Imports ============
const { deployTestContractSetup } = require('./helpers/deploy');
const { eth } = require('./helpers/utils');
const { PARTY_STATUS, FOURTY_EIGHT_HOURS_IN_SECONDS } = require('./helpers/constants');

describe('Deploy', async () => {
      const splitRecipient = "0x0000000000000000000000000000000000000000";
      const splitBasisPoints = 0;
      const tokenId = 95;
      let party, partyDAOMultisig, factory, nftContract, signer, artist;

      before(async () => {
        // GET RANDOM SIGNER & ARTIST
        [signer, artist] = provider.getWallets();

        // DEPLOY PARTY BID CONTRACT
        const contracts = await deployTestContractSetup(
          provider,
          artist,
          FOURTY_EIGHT_HOURS_IN_SECONDS,
          [signer.address],
          splitRecipient,
          splitBasisPoints,
          tokenId,
        );

        party = contracts.party;
        partyDAOMultisig = contracts.partyDAOMultisig;
        factory = contracts.factory;
        nftContract = contracts.nftContract;
      });

      it('Cannot set maxPrice too high', async () => {
        await expect(factory.startParty(
          nftContract.address,
          (115792089237316195423570985008687907853269984665640564039457584007913129639936),
          FOURTY_EIGHT_HOURS_IN_SECONDS,
          [signer.address],
          [splitRecipient, splitBasisPoints],
          ["0x0000000000000000000000000000000000000000", 0],
          'Parrrrti',
          'PRTI',
        )).to.be.reverted;
      });

      it('Cannot initialize logic contract', async () => {
        // get PartyBuy logic contract
        const logic = await factory.logic();
        const CollectionParty = await ethers.getContractFactory('CollectionParty');
        const partyBuyLogic = new ethers.Contract(
          logic,
          CollectionParty.interface,
          signer,
        );
        // calling initialize from external signer should not be possible
        await expect(partyBuyLogic.initialize(
          nftContract.address,
          0,
          FOURTY_EIGHT_HOURS_IN_SECONDS,
          ["0x0000000000000000000000000000000000000000"],
          [splitRecipient, splitBasisPoints],
          ["0x0000000000000000000000000000000000000000", 0],
          "CollectionParty Logic",
          "LOGIC"
        )).to.be.revertedWith("Party::__Party_init: only factory can init");
      });

      it('Cannot re-initialize Party contract', async () => {
        await expect(party.initialize(
          nftContract.address,
          0,
          FOURTY_EIGHT_HOURS_IN_SECONDS,
          ["0x0000000000000000000000000000000000000000"],
          [splitRecipient, splitBasisPoints],
          ["0x0000000000000000000000000000000000000000", 0],
          "CollectionParty",
          "PARTYYYY"
        )).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it('Party Status is Active', async () => {
        const partyStatus = await party.partyStatus();
        expect(partyStatus).to.equal(PARTY_STATUS.ACTIVE);
      });

      it('Version is 1', async () => {
        const version = await party.VERSION();
        expect(version).to.equal(1);
      });

      it('Total spent is zero', async () => {
        const totalSpent = await party.totalSpent();
        expect(totalSpent).to.equal(eth(0));
      });

      it('Total contributed to party is zero', async () => {
        const totalContributedToParty = await party.totalContributedToParty();
        expect(totalContributedToParty).to.equal(eth(0));
      });

      it('Deciders are set', async () => {
        const isDecider = await party.isDecider(signer.address);
        expect(isDecider).to.be.true;
      });

      it('Total Contributed is zero for random account', async () => {
        const totalContributed = await party.totalContributed(
          signer.address,
        );
        expect(totalContributed).to.equal(eth(0));
      });

      it('PartyDAO Multisig is correct', async () => {
        const multisig = await party.partyDAOMultisig();
        expect(multisig).to.equal(partyDAOMultisig.address);
      });

      it('Name is Parrrrti', async () => {
        const name = await party.name();
        expect(name).to.equal("Parrrrti");
      });

      it('Symbol is PRTI', async () => {
        const symbol = await party.symbol();
        expect(symbol).to.equal("PRTI");
      });
});
