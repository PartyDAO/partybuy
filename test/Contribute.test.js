// SPDX-License-Identifier: MIT
// ============ External Imports ============
const { waffle } = require('hardhat');
const { provider } = waffle;
const { expect } = require('chai');
// ============ Internal Imports ============
const {
  eth,
  initExpectedTotalContributed,
  contribute,
} = require('./helpers/utils');
const { deployTestContractSetup } = require('./helpers/deploy');
const { FOURTY_EIGHT_HOURS_IN_SECONDS } = require('./helpers/constants');
const { testCases } = require('./testCases.json');

describe('Contribute', async () => {
      testCases.map((testCase, i) => {
        describe(`Case ${i}`, async () => {
          // get test case information
          let party, signer, artist;
          const { splitRecipient, splitBasisPoints, contributions } = testCase;
          const tokenId = 95;
          const signers = provider.getWallets();
          let expectedTotalContributedToParty = 0;
          const expectedTotalContributed = initExpectedTotalContributed(
            signers,
          );

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
          });

          it('Does not accept a 0 contribution', async () => {
            await expect(contribute(party, signers[0], eth(0))).to.be.revertedWith("Party::contribute: must contribute more than 0");
          });

          // submit each contribution & check test conditions
          for (let contribution of contributions) {
            const { signerIndex, amount } = contribution;
            const signer = signers[signerIndex];

            it('Starts with the correct contribution amount', async () => {
              const totalContributed = await party.totalContributed(
                signer.address,
              );
              expect(totalContributed).to.equal(
                eth(expectedTotalContributed[signer.address]),
              );
            });

            it('Starts with correct *total* contribution amount', async () => {
              const totalContributed = await party.totalContributedToParty();
              expect(totalContributed).to.equal(
                eth(expectedTotalContributedToParty),
              );
            });

            it('Accepts the contribution', async () => {
              await expect(contribute(party, signer, eth(amount))).to.emit(
                party,
                'Contributed',
              );
              // add to local expected variables
              expectedTotalContributed[signer.address] += amount;
              expectedTotalContributedToParty += amount;
            });

            it('Records the contribution amount', async () => {
              const totalContributed = await party.totalContributed(
                signer.address,
              );
              expect(totalContributed).to.equal(
                eth(expectedTotalContributed[signer.address]),
              );
            });

            it('Records the *total* contribution amount', async () => {
              const totalContributed = await party.totalContributedToParty();
              expect(totalContributed).to.equal(
                eth(expectedTotalContributedToParty),
              );
            });

            it('PartyBid ETH balance is total contributed to party', async () => {
              const balance = await provider.getBalance(party.address);
              expect(balance).to.equal(eth(expectedTotalContributedToParty));
            });
          }
        });
      });
});
