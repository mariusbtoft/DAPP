// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
//import "hardhat/console.sol";

/**
 * A smart contract that allows changing a state variable of the contract, tracking changes, and creating crowdfunding campaigns.
 * It also allows the owner to withdraw the Ether in the contract.
 * @author BuidlGuidl
 */
contract YourContract {
    // State Variables
    string public greeting = "DECENTRALIZED CROWDFUNDING!";


    // Struct to represent a crowdfunding campaign
    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 raisedAmount;
		uint256 price;
        bool goalReached;
        bool ended;
    }

    // Event to track when crowdfunding campaigns end
    event CampaignEnded(uint256 campaignIndex, string title, address creator, bool goalReached);

	// Mapping to track contributors and their contributions to each campaign
    mapping(uint256 => mapping(address => uint256)) public campaignContributions;


    // Array to store active crowdfunding campaigns
    Campaign[] public campaigns;

    // Constructor: Called once on contract deployment
    constructor() {
    }



    //Function that allows the contract to receive ETH
    receive() external payable {}

    // Function to create a new crowdfunding campaign
    function createCampaign(string memory _title, string memory _description, uint256 _goal, uint256 _price, uint256 _durationInDays) public {
        require(_goal > 0, "Goal must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");
        require(_price > 0, "Price must be greater than 0");

        uint256 deadline = block.timestamp + (_durationInDays * 1 days);

        Campaign memory newCampaign = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal * 1 ether,
            deadline: deadline,
            raisedAmount: 0,
			price: _price * 1 ether,
            goalReached: false,
            ended: false
        });

        campaigns.push(newCampaign);
    }

    // Function to contribute to a specific crowdfunding campaign
    function contributeToCampaign(uint256 campaignIndex) public payable {
        require(campaignIndex < campaigns.length, "Invalid campaign index");

        Campaign storage campaign = campaigns[campaignIndex];
        require(!campaign.ended, "Campaign has ended");
        
        require(msg.value == campaign.price , "Not the price");

        campaign.raisedAmount += msg.value;

		// Track contributor's contribution for this campaign	
        campaignContributions[campaignIndex][msg.sender] += msg.value;

        // Check if campaign goal was reached
        if (campaign.raisedAmount >= campaign.goal) {
            campaign.goalReached = true;
            campaign.ended = true;
            emit CampaignEnded(campaignIndex, campaign.title, campaign.creator, true);

			// Automatically release funds to the campaign creator
            (bool success, ) = payable(campaign.creator).call{value: campaign.raisedAmount}("");
            require(success, "Failed to transfer funds");
        }
    }
	
    // Function to refund contributors if the campaign goal is not reached
    function refundIfGoalNotReached(uint256 campaignIndex) public {
        require(campaignIndex < campaigns.length, "Invalid campaign index");
       
        Campaign storage campaign = campaigns[campaignIndex];

        // Check if campaign has ended and goal was not reached
        if (block.timestamp > campaign.deadline){
            require(!campaigns[campaignIndex].goalReached, "Campaign goal was reached, no refunds");
            campaign.ended = true;
            emit CampaignEnded(campaignIndex, campaign.title, campaign.creator, false);
        }

        require(campaign.ended, "Campaign has not ended yet");
        require(!campaign.goalReached, "Goal was reached, no refunds");

        uint256 contribution = campaignContributions[campaignIndex][msg.sender];
        require(contribution > 0, "No contribution found for sender");

        campaignContributions[campaignIndex][msg.sender] = 0; // Reset contributor's contribution

        (bool success, ) = payable(msg.sender).call{value: contribution}("");
        require(success, "Failed to refund contribution");
    }



    function getCampaignPrice(uint256 campaignIndex) public view returns (uint256) {
        require(campaignIndex < campaigns.length, "Invalid campaign index");

        return campaigns[campaignIndex].price;
    }

    function getCampaignTitle(uint256 campaignIndex) public view returns (string memory) {
        require(campaignIndex < campaigns.length, "Invalid campaign index");

        return campaigns[campaignIndex].title;
    }

    function getCampaignDescription(uint256 campaignIndex) public view returns (string memory) {
        require(campaignIndex < campaigns.length, "Invalid campaign index");

        return campaigns[campaignIndex].description;
    }

    function getCampaignGoal(uint256 campaignIndex) public view returns (uint256) {
        require(campaignIndex < campaigns.length, "Invalid campaign index");

        return campaigns[campaignIndex].goal;
    }

    function getFundsRaised(uint256 campaignIndex) public view returns (uint256) {
        require(campaignIndex < campaigns.length, "Invalid campaign index");

        return campaigns[campaignIndex].raisedAmount;
    }

    function getCampaignDetails(uint256 campaignIndex) public view returns (Campaign memory) {
        require(campaignIndex < campaigns.length, "Invalid campaign index");
        return campaigns[campaignIndex];
    }

    function getUserContributions(address user) public view returns (uint256[] memory) {
        uint256[] memory userContributions = new uint256[](campaigns.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < campaigns.length; i++) {
            if (campaignContributions[i][user] > 0) {
                userContributions[count] = i;
                count++;
            }
        }

        // Resize the array to fit actual count
        uint256[] memory contributions = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            contributions[i] = userContributions[i];
        }

        return contributions;
}

    
}

