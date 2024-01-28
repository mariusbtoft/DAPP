import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import YourContractABI from "/Users/mariustoft/DTU/7 semester/Bachelor/scaffold-eth-2/packages/hardhat/artifacts/contracts/YourContract.sol/YourContract.json";
// Import the ABI of your contract
import { Ether } from "@uniswap/sdk-core";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { Address, EtherInput } from "~~/components/scaffold-eth";
import { Balance } from "~~/components/scaffold-eth";
import {
  useAccountBalance,
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  // State for the inputs and blockchain interaction

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const [campaignID, setCampaignID] = useState("");
  const [campaignPrice, setCampaignPrice] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [fundsRaised, setFundsRaised] = useState("");

  const [campaignContributions, setCampaignContributions] = useState("");

  const [checkCampaignID, setCheckCampaignID] = useState("");

  const { address } = useAccount();

  //Listen for campaign ended event and console.log the event that has ended
  useScaffoldEventSubscriber({
    contractName: "YourContract",
    eventName: "CampaignEnded",
    listener: logs => {
      logs.forEach(log => {
        const { campaignIndex, title, creator, goalReached } = log.args;
        console.log(
          `CampaignEnded event: CampaignIndex=${campaignIndex}, Title=${title} ,Creator=${creator}, GoalReached=${goalReached}`,
        );
      });
    },
  });

  const { writeAsync: setCampaign } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "createCampaign",
    args: [title, description, goal, price, duration],
  });

  const { writeAsync: contribute } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "contributeToCampaign",
    args: [campaignID],
    value: campaignPrice ? ethers.parseEther(campaignPrice) : ethers.parseEther("0"),
  });

  //Function to get the campaign price
  const { data: totalCounter } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getCampaignPrice",
    args: [campaignID],
  });

  //Function to get the campaign title
  const { data: totalCounter2 } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getCampaignTitle",
    args: [campaignID],
  });

  const { data: totalCounter3 } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getCampaignDescription",
    args: [campaignID],
  });

  const { data: totalCounter4 } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getCampaignGoal",
    args: [campaignID],
  });

  const { data: totalCounter5 } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getFundsRaised",
    args: [campaignID],
  });

  //Function to refund campaign
  const { writeAsync: refundCampaign } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "refundIfGoalNotReached",
    args: [campaignID],
  });

  //Function to get user campaign contributions
  const { data: totalCounter6 } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserContributions",
    args: [address],
  });

  const fetchUserContributions = async () => {
    try {
      if (totalCounter6 && address !== "") {
        const contributions = totalCounter6.toString();
        setCampaignContributions(contributions);
        console.log(contributions);
      } else {
        setCampaignContributions("");
        console.log("no contributions");
      }
    } catch (e) {
      console.error(e);
      setCampaignContributions("");
    }
  };

  const handleContribute = async () => {
    try {
      await contribute();
      fetchUserContributions(); // Fetch contributions after contributing
    } catch (e) {
      console.error("Error contributing:", e);
    }
  };

  useEffect(() => {
    fetchUserContributions();
  }, [totalCounter6]);

  useEffect(() => {
    try {
      if (totalCounter && campaignID !== "") {
        const price = ethers.formatEther(totalCounter.toString());
        setCampaignPrice(price);
      } else {
        setCampaignPrice("");
      }
    } catch (e) {
      console.log(e);
      setCampaignPrice("");
    }
  }, [campaignID]);

  useEffect(() => {
    try {
      if (totalCounter2 && campaignID !== "") {
        const title = totalCounter2.toString();
        setCampaignTitle(title);
        console.log(title);
      } else {
        setCampaignTitle("");
      }
    } catch (e) {
      console.log(e);
      setCampaignTitle("");
    }
  }, [campaignID]);

  useEffect(() => {
    try {
      if (totalCounter3 && campaignID !== "") {
        const description = totalCounter3.toString();
        setCampaignDescription(description);
      } else {
        setCampaignDescription("");
      }
    } catch (e) {
      console.log(e);
      setCampaignDescription("");
    }
  }, [campaignID]);

  //campaignGoal
  useEffect(() => {
    try {
      if (totalCounter4 && campaignID !== "") {
        const goal = ethers.formatEther(totalCounter4.toString());
        setCampaignGoal(goal);
        console.log(goal);
      } else {
        setCampaignGoal("");
        console.log("no goal");
      }
    } catch (e) {
      console.log(e);
      setCampaignGoal("");
    }
  }, [campaignID]);

  useEffect(() => {
    try {
      if (totalCounter5 && campaignID !== "") {
        const raisedAmount = ethers.formatEther(totalCounter5.toString());

        if (parseFloat(raisedAmount) > 0) {
          // Added parentheses around the condition
          setFundsRaised(raisedAmount);
        } else {
          setFundsRaised("0");
        }
      } else {
        setFundsRaised("");
      }
    } catch (e) {
      console.log(e);
      setFundsRaised("");
    }
  }, [campaignID, totalCounter5]); // Added totalCounter5 as a dependency

  return (
    <>
      <MetaHeader />

      <div className="flex items-center flex-col flex-grow pt-10">
        <h1 className="mt-5 mb-3 font-bold text-3xl">Decentralized Crowdfunding</h1>
        Welcome!
        <Address address={address} />
        <h1 className="mt-5 mb-3 font-bold text-1xl">Your balance is:</h1>
        <Balance address={address} />
        <h1 className="mt-5 mb-3 font-bold text-1xl">You have contributed to the following campaigns IDs:</h1>
        {campaignContributions.length === 0 ? (
          <h1 className="mt-5 mb-3 font-bold text-1xl">No contributions yet</h1>) : (<h1 className="mt-5 mb-3 font-bold text-1xl">{campaignContributions}</h1>)}
      </div>

      <div className="flex items-center flex-col flex-grow pt-10">
        <h1 className="mt-5 mb-3 font-bold text-2xl">Create a campaign</h1>
        <input
          type="text"
          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 w-72 font-medium placeholder:text-accent/50 text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent mb-2"
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Campaign Title"
        />
        <input
          type="text"
          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 w-72 font-medium placeholder:text-accent/50 text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent mb-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (max 100 characters)" maxLength={100}
        />
        <div className="mb-2">
          <EtherInput value={goal} onChange={value => setGoal(value)} placeholder="Funding Goal" />
        </div>
        <div className="mb-2">
          <EtherInput value={price} onChange={value => setPrice(value)} placeholder="Price per ticket" />
        </div>
        <input
          type="text"
          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 w-72 font-medium placeholder:text-accent/50 text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent mb-2"
          value={duration}
          onChange={event => setDuration(event.target.value)}
          placeholder="Campaign duration"
        />
        <button onClick={setCampaign} className="btn btn-primary">
          Create Campaign
        </button>
      </div>

      <div className="flex items-center flex-col flex-grow pt-10">
        <h1 className="mt-5 mb-3 font-bold text-2xl">Contribute to a campaign</h1>
        <input
          type="number"
          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 w-72 font-medium placeholder:text-accent/50 text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent mb-2"
          value={campaignID}
          onChange={event => setCampaignID(event.target.value)}
          placeholder="Campaign ID"
        />
        {campaignPrice && <h1 className="mt-5 mb-3 font-bold text-1xl">Price: {campaignPrice} ETH</h1>}
        {campaignTitle && <h1 className="mt-5 mb-3 font-bold text-1xl">Title: {campaignTitle}</h1>}
        {campaignDescription && <h1 className="mt-5 mb-3 font-bold text-1xl">Description: {campaignDescription}</h1>}
        {fundsRaised >= 0 && campaignGoal && (
          <h1 className="mt-5 mb-3 font-bold text-1xl">Funds raised: {fundsRaised} ETH</h1>
        )}
        {campaignGoal && <h1 className="mt-5 mb-3 font-bold text-1xl">Goal: {campaignGoal} ETH</h1>}
        <button onClick={handleContribute} className="mt-2 btn btn-primary">
          Contribute
        </button>
      </div>

      <div className="flex items-center flex-col flex-grow pt-10">
        <h1 className="mt-5 mb-3 font-bold text-2xl">Get refund</h1>
        <input
          type="number"
          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 w-72 font-medium placeholder:text-accent/50 text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent mb-2"
          value={checkCampaignID}
          onChange={event => setCheckCampaignID(event.target.value)}
          placeholder="Campaign ID"
        />
        <button onClick={refundCampaign} className="mt-2 btn btn-primary">
          Check campaign
        </button>
      </div>
    </>
  );
};

export default Home;
