/* eslint-disable @typescript-eslint/no-unused-vars */


import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";


describe("YourContract", function () {
  // Define variables to store contract instances
  let yourContract;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  // Deploy the contract before each test
  beforeEach(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const YourContract = await ethers.getContractFactory("YourContract");
    yourContract = await YourContract.deploy();
    await yourContract.deployed();
  });

  // Test cases for the contract functions
  describe("Deployment", function () {
    it("Should have the correct initial greeting", async function () {
      const initialGreeting = await yourContract.greeting();
      expect(initialGreeting).to.equal("DECENTRALIZED CROWDFUNDING!");
    });
  });

  describe("createCampaign", function () {
    it("Should create a new crowdfunding campaign", async function () {
      const title = "My Campaign";
      const description = "My Campaign Description";
      const goal = 10n ; // 10 ETH
      const price = 1n; // 1 ETH
      const durationInDays = 7;

      await yourContract.createCampaign(title, description, goal, price, durationInDays);

      const campaigns = await yourContract.campaigns(0);

      expect(campaigns.creator).to.equal(owner.address);
      expect(campaigns.title).to.equal(title);
      expect(campaigns.description).to.equal(description);
      expect(campaigns.goal).to.equal(goal*10n**18n);
      expect(campaigns.price).to.equal(price*10n**18n);

    });
  });


  describe("Contribution Tests", function () {
    it("Should allow contributors to participate in campaigns", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign 1", "Description", 10n, 1n, 7);

      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000});

      // Verify that addr1 is a contributor to campaign 0
      const userContributions = await yourContract.getUserContributions(addr1.address);
      expect(userContributions[0]).to.equal(BigNumber.from(0));
  
      // Contribute to the campaign with addr2
      await yourContract.connect(addr2).contributeToCampaign(0, { value: 1n * 10n ** 18n , gasLimit: 1000000});

      // Verify that addr2 is also a contributor to campaign 0
      const userContributions2 = await yourContract.getUserContributions(addr2.address);
      expect(userContributions2[0]).to.equal(BigNumber.from(0));
    });
  
    it("Should prevent contributors from contributing more than the ticket price", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign 1", "Description", 5n, 2n, 7);
      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 2n * 10n ** 18n, gasLimit: 1000000}); // Exceeds ticket price
  
      // Verify that addr1 is not a contributor to campaign 1
      const userContributions = await yourContract.getUserContributions(addr1.address);
      expect(userContributions).to.not.include(0);
    });
  
    it("Should allow contributors to get a refund if the goal is not reached", async function () {
      // Create a campaign with a high goal
      await yourContract.createCampaign("Campaign 3", "Description", 100n, 1n, 7);
      
      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000});
  
      // Ensure that addr1 can get a refund after the campaign ends
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // Fast-forward time

      //Mine block
      await ethers.provider.send("evm_mine", []);

      await yourContract.connect(addr1).refundIfGoalNotReached(0);
      
      // Verify that addr1's contribution was refunded
      const userContributions = await yourContract.getUserContributions(addr1.address);

      //check that userContributions is empty
      expect(userContributions.toString()).to.equal([].toString());
    });

    
    it("Should send the money to the creator if the goal is reached", async function () {
      // Create a campaign with a goal that can be reached
      const goal = 10n;
      const price = 5n;
      await yourContract.createCampaign("Campaign 2", "Description", goal, price, 7);
    
      // Check the balance of the campaign creator before goal reached
      const creatorBalanceBefore = await ethers.provider.getBalance(owner.address);

      // Contribute to the campaign with addr1 and addr2 to reach the goal
      await yourContract.connect(addr1).contributeToCampaign(0, { value: price * 10n ** 18n, gasLimit: 1000000 });
      await yourContract.connect(addr2).contributeToCampaign(0, { value: price * 10n ** 18n, gasLimit: 1000000 });
    
    
    
      // Check if the campaign has ended
      const campaignDetails = await yourContract.getCampaignDetails(0);
      expect(campaignDetails.ended).to.be.true;
    
      // Check if the campaign goal has been reached
      expect(campaignDetails.goalReached).to.be.true;
      
      const creatorBalanceAfter = await ethers.provider.getBalance(owner.address);

      // Ensure that the creator's balance has increased after withdrawal
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore.add(goal * 10n ** 18n));
    });
    
  });
  
  describe("Campaign Expiry and Goal Tests", function () {
    it("Should correctly end campaigns after the specified duration", async function () {
      // Create a campaign with a short duration
      await yourContract.createCampaign("Campaign 4", "Description", 10n, 1n, 1);
      
      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000});

      // Ensure that the campaign ends after the specified time
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // Fast-forward time

      //Mine block
      await ethers.provider.send("evm_mine", []);

      await yourContract.connect(addr1).refundIfGoalNotReached(0);

      const campaignDetails = await yourContract.getCampaignDetails(0);
      expect(campaignDetails.ended).to.be.true;
    });
  
    it("Should correctly handle campaigns with different goal statuses", async function () {
      // Create a campaign with a high goal
      await yourContract.createCampaign("Campaign 5", "Description", 100n, 1n, 7);
      
      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000});
      
      // Ensure that the campaign is not ended since the goal is not reached
      const campaignDetails = await yourContract.getCampaignDetails(0);
      expect(campaignDetails.ended).to.be.false;
  
      // Fast-forward time and ensure that the campaign ends
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]); // Fast-forward time

      //Mine block
      await ethers.provider.send("evm_mine", []);

      await yourContract.connect(addr1).refundIfGoalNotReached(0);

      const campaignDetails2 = await yourContract.getCampaignDetails(0);
      expect(campaignDetails2.ended).to.be.true;
    });
  });
  

  // Test cases for getCampaignPrice, getCampaignTitle, getCampaignDescription, getCampaignGoal, and getFundsRaised functions
  describe("Campaign Information", function () {
    it("Should return the correct campaign price", async function () {
      // Create a campaign with a specific price
      const campaignPrice = 10n; // Set the campaign price
      await yourContract.createCampaign("Campaign 1", "Description", 100n, campaignPrice, 7);

      // Retrieve the campaign price using the contract function
      const price = await yourContract.getCampaignPrice(0);

      // Assert that the returned price matches the expected price
      expect(price).to.equal(campaignPrice*10n**18n);
    });

    it("Should return the correct campaign title", async function () {
      // Create a campaign with a specific title
      const campaignTitle = "My Campaign Title";
      await yourContract.createCampaign(campaignTitle, "Description", 10, 1, 7);

      // Retrieve the campaign title using the contract function
      const title = await yourContract.getCampaignTitle(0);

      // Assert that the returned title matches the expected title
      expect(title).to.equal(campaignTitle);
    });

    it("Should return the correct campaign description", async function () {
      // Create a campaign with a specific description
      const campaignDescription = "My Campaign Description"; 
      await yourContract.createCampaign("Campaign 1", campaignDescription, 10, 1, 7);

      // Retrieve the campaign description using the contract function
      const description = await yourContract.getCampaignDescription(0);

      // Assert that the returned description matches the expected description
      expect(description).to.equal(campaignDescription);
    });

    it("Should return the correct campaign goal", async function () {
      // Create a campaign with a specific goal
      const campaignGoal = 1000n; // Set the campaign goal
      await yourContract.createCampaign("Campaign 1", "Description", campaignGoal, 1, 7);

      // Retrieve the campaign goal using the contract function
      const goal = await yourContract.getCampaignGoal(0);

      // Assert that the returned goal matches the expected goal
      expect(goal).to.equal(campaignGoal*10n**18n);
    });

    it("Should return the correct funds raised for a campaign", async function () {
      
      // Create a campaign and contribute to it
      await yourContract.createCampaign("Campaign 1", "Description", 10, 1, 7);
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000});
      await yourContract.connect(addr2).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000});

      // Retrieve the funds raised for the campaign using the contract function
      const fundsRaised = await yourContract.getFundsRaised(0);

      // Assert that the returned funds raised match the expected funds raised
      expect(fundsRaised).to.equal(2n * 10n ** 18n);
    });
  });

  // Test cases for invalid inputs
  describe("Invalid Inputs", function () {
    it ("Should not allow a campaign to be created with a price of 0", async function () {
      // Create a campaign with a price of 0
      await expect(yourContract.createCampaign("Campaign 1", "Description", 10, 0, 7)).to.be.revertedWith("Price must be greater than 0");
    });

    it ("Should not allow a campaign to be created with a goal of 0", async function () {
      // Create a campaign with a goal of 0
      await expect(yourContract.createCampaign("Campaign 1", "Description", 0, 1, 7)).to.be.revertedWith("Goal must be greater than 0");
    });

    it ("Should not allow a campaign to be created with a duration of 0", async function () {
      // Create a campaign with a duration of 0
      await expect(yourContract.createCampaign("Campaign 1", "Description", 10, 1, 0)).to.be.revertedWith("Duration must be greater than 0");
    });


  });

  // Test cases for invalid calls
  describe("Contribution and Refund Fail Tests", function () {
    it("Should not allow contributors to participate in campaigns when contributing is not right", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign 6", "Description", 5n, 2n, 7);
      
      // Contribute to the campaign with addr1
      await expect(yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000})).to.be.revertedWith("Not the price");
    });

    it("Should not allow contributors to participate in campaigns that does not exist", async function () {
      // Contribute to the campaign with addr1
      await expect(yourContract.connect(addr1).contributeToCampaign(0, { value: 1n * 10n ** 18n, gasLimit: 1000000})).to.be.revertedWith("Invalid campaign index");
    });

    it("Should not allow contributors to participate in campaigns that are ended", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign", "Description", 15n, 5n, 7);

      //Contribute to the campaign with addr1 addr2 and addr3
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});
      await yourContract.connect(addr2).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});
      await yourContract.connect(addr3).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});

      // Ensure that the campaign is ended
      const campaignDetails = await yourContract.getCampaignDetails(0);
      expect(campaignDetails.ended).to.be.true;
      expect(campaignDetails.goalReached).to.be.true;

      // Try to contribute again to the campaign with addr1
      await expect(yourContract.connect(addr1).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000})).to.be.revertedWith("Campaign has ended");
    });


    it("Should not allow refund of a campaign where the goal was reached", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign", "Description", 10n, 5n, 7);
      
      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});
      
      // Contribute to the campaign with addr1
      await yourContract.connect(addr2).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});
      
      // Ensure that the campaign is ended since the goal is reached
      const campaignDetails = await yourContract.getCampaignDetails(0);
      expect(campaignDetails.ended).to.be.true;
      expect(campaignDetails.goalReached).to.be.true;
  
      // Try to refund the campaign
      await expect(yourContract.connect(addr1).refundIfGoalNotReached(0)).to.be.revertedWith("Goal was reached, no refunds");
    });


    it("Should not allow refund of a campaign (ended - but goal not reached) but was not contributed to", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign", "Description", 10n, 5n, 7);

      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});

      // Increase time by 8 days
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);

      // Mine block
      await ethers.provider.send("evm_mine");
  
      // Try to refund the an address which did not contribute to the campaign
      await expect(yourContract.connect(addr2).refundIfGoalNotReached(0)).to.be.revertedWith("No contribution found for sender");
    });

    it("Should not allow refund of a campaign that has not ended", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign", "Description", 10n, 5n, 7);

      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});

      // Try to refund the campaign
      await expect(yourContract.connect(addr1).refundIfGoalNotReached(0)).to.be.revertedWith("Campaign has not ended yet");
    });

    it("Should not allow refund of a campaign that does not exist", async function () {
      // Try to refund a campaign that does not exist
      await expect(yourContract.connect(addr1).refundIfGoalNotReached(0)).to.be.revertedWith("Invalid campaign index");
    });

    it("Should not allow refund of a campaign that has ended but the goal was reached", async function () {
      // Create a campaign
      await yourContract.createCampaign("Campaign", "Description", 10n, 5n, 7);

      // Contribute to the campaign with addr1
      await yourContract.connect(addr1).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});
      
      // Contribute to the campaign with addr1
      await yourContract.connect(addr2).contributeToCampaign(0, { value: 5n * 10n ** 18n, gasLimit: 1000000});
      
      // Increase time by 8 days
      await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);

      // Mine block
      await ethers.provider.send("evm_mine");

      // Ensure that the campaign is ended since the goal is reached
      const campaignDetails = await yourContract.getCampaignDetails(0);
      expect(campaignDetails.ended).to.be.true;
      expect(campaignDetails.goalReached).to.be.true;
  
      // Try to refund the campaign
      await expect(yourContract.connect(addr1).refundIfGoalNotReached(0)).to.be.revertedWith("Campaign goal was reached, no refunds");
    });
      
  });


  // Test cases for invalid get 'some info' calls
  describe("Invalid Get Info Calls", function () {
    it ("Should fail to get details about a campaign that does not exist", async function () {
      // Try to get details about a campaign that does not exist
      await expect(yourContract.getCampaignDetails(0)).to.be.revertedWith("Invalid campaign index")
    });

    it ("Should fail to get the description of a campaign that does not exist", async function () {
      // Try to get the description of a campaign that does not exist
      await expect(yourContract.getCampaignDescription(0)).to.be.revertedWith("Invalid campaign index")
    });

    it ("Should fail to get the goal of a campaign that does not exist", async function () {
      // Try to get the goal of a campaign that does not exist
      await expect(yourContract.getCampaignGoal(0)).to.be.revertedWith("Invalid campaign index")
    });

    it ("Should fail to get the funds raised of a campaign that does not exist", async function () {
      // Try to get the funds raised of a campaign that does not exist
      await expect(yourContract.getFundsRaised(0)).to.be.revertedWith("Invalid campaign index")
    });

    it ("Should fail to get the price of a campaign that does not exist", async function () {
      // Try to get the price of a campaign that does not exist
      await expect(yourContract.getCampaignPrice(0)).to.be.revertedWith("Invalid campaign index")
    });

    it ("Should fail to get the title of a campaign that does not exist", async function () {
      // Try to get the title of a campaign that does not exist
      await expect(yourContract.getCampaignTitle(0)).to.be.revertedWith("Invalid campaign index")
    });


  });

});
