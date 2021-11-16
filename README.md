## PartyBuy

TODO

## PartyDAO 🥳

PartyBuy was developed by PartyDAO, a decentralized autonomous organization that builds and ships products. PartyDAO was [created initially](https://d.mirror.xyz/FLqkPA3iN4x-p97UhfhWwaCx8rBmVo-1yttY20oaob4) for the purpose of shipping PartyBid, a product similar to PartyBuy for participating in on-chain reserve auctions.
To keep up with PartyDAO, follow [@prtyDAO](https://twitter.com/prtyDAO) on Twitter and [Mirror](https://party.mirror.xyz/). Acquire 10 [$PARTY tokens](https://etherscan.io/token/0x402eb84d9cb2d6cf66bde9b46d7277d3f4a16b54?a=0x2f4bea4cb44d0956ce4980e76a20a8928e00399a) to join the DAO and party with us.

## Features

- TODO

## Functions

#### PartyBidFactory

- `startParty` - deploy a PartyBuy contract, specifying the NFT auction to target

#### PartyBid

- `contribute` - contribute ETH to the PartyBuy
- `buy` - TODO
  `expire` - TODO
- `claim` - call once per contributor after the auction closes to claim fractionalized ERC-20 tokens (for any funds that were used to win the auction) and/or excess ETH (if the auction was lost, or if the funds were not used to win the auction)

## Repo Layout

- `contracts/PartyBuy.sol` - core logic contract for PartyBid
- `contracts/PartyBuyFactory.sol` - factory contract used to deploy new PartyBid instances in a gas-efficient manner
- `deploy` - Deployment script for contracts
- `test` - Hardhat tests for the core protocol
- `contracts/external` - External protocols' contracts ([Fractional Art](https://github.com/fractional-company/contracts), copied to this repo for use in integration testing.
- `contracts/test` - Contracts written for use in testing

## Installation

1. Install dependencies

```bash
npm i
```

2. Setup your `.env` file in order to deploy the contracts

```bash
touch .env && cat .env.example > .env
```

Then, populate the values in `.env`.

## Tests

To run the Hardhat tests, simply run

```bash
npm run test
```

## Deployment

You can find the address of deployed PartyBuy Factories on each chain at `deploy/deployed-contracts`

To deploy a new PartyBuy Factory, first ensure you've populated your `.env` file. The RPC endpoint should point chain you want to deploy the contracts, and the private key of the Deployer account should be funded with ETH on that chain .

Next, add a config file to `deploy/configs/[CHAIN_NAME].json` specifying the addresses of the necessary external protocols on that chain. You can use other files in that folder to see which contract addresses must be populated.

Finally, run

```bash
npm run deploy
```

## Security Review

TODO

## Credits

- [Anna Carroll](https://twitter.com/annascarroll) authored the code in this repo
- [Steve Klebanoff](https://twitter.com/steveklbnf) advised on the design of the contracts and reviewed the implementation code
- [John Palmer](https://twitter.com/john_c_palmer) coordinated and product managed the project
- [Lawrence Forman](https://merklejerk.com/) provided a [review](TODO) of the contracts
- [0age](https://merklejerk.com/) provided feedback on the contracts
- [Danny Aranda](https://twitter.com/daranda) managed operations, partnerships & marketing
- [fractional.art](https://fractional.art/) team created the fractionalized NFT code for the post-auction experience
- TODO

## License

PartyBuy contracts are reproduceable under the terms of [MIT license](https://en.wikipedia.org/wiki/MIT_License).

MIT © PartyDAO
