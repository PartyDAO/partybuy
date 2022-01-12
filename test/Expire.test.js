// SPDX-License-Identifier: MIT
// ============ External Imports ============
const { waffle } = require('hardhat');
const { provider } = waffle;
const { expect } = require('chai');
// ============ Internal Imports ============
const {
  eth,
  weiToEth,
  contribute,
  encodeData
} = require('./helpers/utils');
const { deployTestContractSetup, deploy } = require('./helpers/deploy');
const {
  PARTY_STATUS,
  FOURTY_EIGHT_HOURS_IN_SECONDS,
} = require('./helpers/constants');
const { testCases } = require('./testCases.json');

describe('Expire', async () => {
  testCases.map((testCase, i) => {
    describe(`Case ${i}`, async () => {
      // get test case information
      const {
        splitRecipient,
        splitBasisPoints,
        contributions,
        amountSpent,
      } = testCase;
      // instantiate test vars
      let party,
        nftContract,
        sellerContract,
        signer;
      const signers = provider.getWallets();
      const tokenId = 95;

      before(async () => {
        [signer] = provider.getWallets();

        // DEPLOY NFT, MARKET, AND PARTY BID CONTRACTS
        const contracts = await deployTestContractSetup(
          provider,
          signer,
          FOURTY_EIGHT_HOURS_IN_SECONDS,
          [signer.address],
          splitRecipient,
          splitBasisPoints,
          tokenId,
        );

        party = contracts.party;
        nftContract = contracts.nftContract;

        // submit contributions
        for (let contribution of contributions) {
          const { signerIndex, amount } = contribution;
          const signer = signers[signerIndex];
          await contribute(party, signer, eth(amount));
        }

        // deploy Seller contract & transfer NFT to Seller
        sellerContract = await deploy("Seller");
        await nftContract.transferFrom(signer.address, sellerContract.address, tokenId);
      });

      it('Is ACTIVE before Expire', async () => {
        const partyStatus = await party.partyStatus();
        expect(partyStatus).to.equal(PARTY_STATUS.ACTIVE);
      });

      it('Does not allow getClaimAmounts before Expire', async () => {
        await expect(party.getClaimAmounts(signers[0].address)).to.be.revertedWith("Party::getClaimAmounts: party still active; amounts undetermined");
      });

      it('Does not allow totalEthUsed before Expire', async () => {
        await expect(party.totalEthUsed(signers[0].address)).to.be.revertedWith("Party::totalEthUsed: party still active; amounts undetermined");
      });

      it('Does not allow Expire before party has timed out', async () => {
        // buy NFT
        await expect(party.expire()).to.be.revertedWith("PartyBuy::expire: party has not timed out");
      });

      it('Expires after Party is timed out', async () => {
        // increase time on-chain so that party can be expired
        await provider.send('evm_increaseTime', [
          FOURTY_EIGHT_HOURS_IN_SECONDS,
        ]);
        await provider.send('evm_mine');
        // expire party
        await expect(party.expire()).to.emit(party, 'Expired');
      });

      it(`Doesn't accept contributions after Expire`, async () => {
        await expect(contribute(party, signers[0], eth(0.00001))).to.be.reverted;
      });

      it(`Doesn't allow Buy after Expire`, async () => {
        // encode data to buy NFT
        const data = encodeData(sellerContract, 'sell', [eth(amountSpent), tokenId, nftContract.address]);
        // buy NFT
        await expect(party.buy(tokenId, eth(amountSpent), sellerContract.address, data)).to.be.revertedWith("PartyBuy::buy: party not active");
      });

      it(`Doesn't allow Expire after initial Expire`, async () => {
        await expect(party.expire()).to.be.revertedWith("PartyBuy::expire: party not active");
      });

      it('Does allow getClaimAmounts before Expire', async () => {
        await expect(party.getClaimAmounts(signers[0].address)).to.not.be.reverted;
      });

      it('Does allow totalEthUsed before Expire', async () => {
        await expect(party.totalEthUsed(signers[0].address)).to.not.be.reverted;
      });

      it(`Is LOST after Expire`, async () => {
        const partyStatus = await party.partyStatus();
        expect(partyStatus).to.equal(PARTY_STATUS.LOST);
      });

      it('totalSpent is 0', async () => {
        const totalSpent = await party.totalSpent();
        expect(weiToEth(totalSpent)).to.equal(0);
      });

      it('ETH balance is equal to totalContributed', async () => {
        const totalContributed = await party.totalContributedToParty();
        const ethBalance = await provider.getBalance(party.address);
        expect(ethBalance).to.equal(totalContributed);
      });
    });
  });
});
