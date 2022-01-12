async function deploy(name, args = []) {
  const Implementation = await ethers.getContractFactory(name);
  const contract = await Implementation.deploy(...args);
  return contract.deployed();
}

async function getTokenVault(party, signer) {
  const vaultAddress = await party.tokenVault();
  const TokenVault = await ethers.getContractFactory('TokenVault');
  return new ethers.Contract(vaultAddress, TokenVault.interface, signer);
}

async function deployTestContractSetup(
  provider,
  artistSigner,
  secondsToTimeout,
  deciders,
  splitRecipient,
  splitBasisPoints,
  tokenId,
  fakeMultisig = false,
  gatedToken = "0x0000000000000000000000000000000000000000",
  gatedTokenAmount = 0
) {
  // Deploy WETH
  const weth = await deploy('EtherToken');

  // For other markets, deploy the test NFT Contract
  const nftContract = await deploy('TestERC721', []);
  // Mint token to artist
  await nftContract.mint(artistSigner.address, tokenId);

  // Deploy PartyDAO multisig
  let partyDAOMultisig;
  if(!fakeMultisig) {
    partyDAOMultisig = await deploy('PayableContract');
  } else {
    partyDAOMultisig = artistSigner;
  }

  const tokenVaultSettings = await deploy('Settings');
  const tokenVaultFactory = await deploy('ERC721VaultFactory', [
    tokenVaultSettings.address,
  ]);

  const allowList = await deploy('AllowList');

  // Deploy PartyBid Factory (including PartyBid Logic + Reseller Whitelist)
  const factory = await deploy('CollectionPartyFactory', [
    partyDAOMultisig.address,
    tokenVaultFactory.address,
    weth.address,
    allowList.address
  ]);

  // Deploy PartyBid proxy
  await factory.startParty(
    nftContract.address,
    0,
    secondsToTimeout,
    deciders,
    [splitRecipient, splitBasisPoints],
    [gatedToken, gatedTokenAmount],
    'Parrrrti',
    'PRTI',
  );

  // Get PartyBid ethers contract
  const party = await getPartyBuyContractFromEventLogs(
    provider,
    factory,
    artistSigner,
  );

  return {
    nftContract,
    party,
    partyDAOMultisig,
    weth,
    allowList,
    factory
  };
}

async function getPartyBuyContractFromEventLogs(
  provider,
  factory,
  artistSigner,
) {
  // get logs emitted from PartyBid Factory
  const logs = await provider.getLogs({ address: factory.address });

  // parse events from logs
  const CollectionPartyFactory = await ethers.getContractFactory('CollectionPartyFactory');
  const events = logs.map((log) => CollectionPartyFactory.interface.parseLog(log));

  // extract proxy address from PartyBuyDeployed log
  const proxyAddress = events[0]['args'][0];

  // instantiate ethers contract with PartyBid Logic interface + proxy address
  const CollectionParty = await ethers.getContractFactory('CollectionParty');
  const party = new ethers.Contract(
    proxyAddress,
    CollectionParty.interface,
    artistSigner,
  );
  return party;
}

module.exports = {
  deployTestContractSetup,
  getTokenVault,
  deploy,
};
