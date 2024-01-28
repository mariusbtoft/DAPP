## Running the application
To run this application follow the steps below:

1. Download the files

2. Open the terminal and navigate to the folder with the downloaded files

3. Run the following commands:
```
yarn install
```

```
yarn chain
```


```
yarn start
```

4. Open a browser and go to


```
http://localhost:3000
```

You can now interact with the application which runs on a local Hardhat test network.
Testnet ETH are available from the faucets on the site.

For more documentation go to https://github.com/scaffold-eth/scaffold-eth-2

## Smart contract code
The smart contract code is in the `YourContract.sol` file (location - packages/hardhat/contracts/YourContract.ts)

## Front end code
The code for the frontend is in the `index.tsx` file location - packages/nextjs/pages/index.tsx)


## Testing
The unit tests for the application are in the `YourContract.ts` file (location - packages/hardhat/test/YourContract.ts)

Navigate to the downloaded folder for the commands below to work.
To run the unit tests:
```
yarn test
```
To run the code coverage:
```
yarn coverage
```
For more documentation on the implemented tool `solidity-coverage` go to https://github.com/sc-forks/solidity-coverage

To run the automated smart contract audit:

```
slither packages/hardhat/contracts/yourcontract.sol
```
For more documentation on the implemented tool `slither` go to https://github.com/crytic/slither






