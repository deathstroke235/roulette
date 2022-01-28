const inquirer = require("inquirer");
//const colors = import('colors');
const colors = require('colors');
const figlet = require("figlet");
const { Keypair } = require('@solana/web3.js');
const {getWalletBalance,transferSOL,airDropSol}=require("./solana");
const { getReturnAmount, totalAmtToBePaid, randomNumber } = require('./helper');

const init = () => {
    console.log(
        colors.red(
        figlet.textSync("SOL Stake", {
            font: "Standard",
            horizontalLayout: "default",
            verticalLayout: "default"
        })
        )
    );
    console.log(colors.blue`The max bidding amount is 2.5 SOL here`);
};


//Ask for Ratio
//Ask for Sol to be Staked
//Check the amount to be available in Wallet 
//Ask Public Key
//Generate a Random Number
//Ask for the generated Number 
//If true return the SOL as per ratio

//const userWallet=web3.Keypair.generate();

//const userPublicKey=[
  //  152, 128, 175,  39, 230, 221, 194,  34,
 //   212, 222,  89, 178, 227,  18, 127, 120,
 //   119, 134, 248, 218,  69,  79, 214, 125,
 //    66, 243,  34,   9, 148, 220, 248,  46
// ]
const userSecretKey=[
    38,  49,  80,   7, 182,  35, 233, 135, 106, 249, 207,
    81,  41, 106, 149, 186, 232, 162,  66, 132, 246,  80,
   207, 241, 166, 246,  20,   4,  73, 133, 253,  50, 155,
   150, 251,  58, 168, 248, 147,  55,  46, 214, 147, 252,
   161, 180, 106, 230,  97, 201, 202, 252, 226,  15, 242,
   145, 185, 172,  60,  25,  89, 190, 228,  81
]

const userWallet=Keypair.fromSecretKey(Uint8Array.from(userSecretKey));


//Treasury
const secretKey=[
    38,  49,  80,   7, 182,  35, 233, 135, 106, 249, 207,
    81,  41, 106, 149, 186, 232, 162,  66, 132, 246,  80,
   207, 241, 166, 246,  20,   4,  73, 133, 253,  50, 155,
   150, 251,  58, 168, 248, 147,  55,  46, 214, 147, 252,
   161, 180, 106, 230,  97, 201, 202, 252, 226,  15, 242,
   145, 185, 172,  60,  25,  89, 190, 228,  81 
]

const treasuryWallet=Keypair.fromSecretKey(Uint8Array.from(secretKey));


const askQuestions = () => {
    const questions = [
        {
            name: "SOL",
            type: "number",
            message: "What is the amount of SOL you want to stake?",
        },
        {
            type: "rawlist",
            name: "RATIO",
            message: "What is the ratio of your staking?",
            choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
            filter: function(val) {
                const stakeFactor=val.split(":")[1];
                return stakeFactor;
            },
        },
        {
            type:"number",
            name:"RANDOM",
            message:"Guess a random number from 1 to 5 (both 1, 5 included)",
            when:async (val)=>{
                if(parseFloat(totalAmtToBePaid(val.SOL))>5){
                    console.log(colors.red`You have violated the max stake limit. Stake with smaller amount.`)
                    return false;
                }
                else{
                    // console.log("In when")
                    console.log(`You need to pay ${colors.green`${totalAmtToBePaid(val.SOL)}`} to move forward`)
                    const userBalance=await getWalletBalance(userWallet.publicKey.toString())
                    if(userBalance<totalAmtToBePaid(val.SOL)){
                        console.log(colors.red`You don't have enough balance in your wallet`);
                        return false;
                    }else{
                        console.log(colors.green`You will get ${getReturnAmount(val.SOL,parseFloat(val.RATIO))} if guessing the number correctly`)
                        return true;    
                    }
                }
            },
        }
    ];
    return inquirer.prompt(questions);
};


const gameExecution=async ()=>{
    init();
    const generateRandomNumber=randomNumber(1,2);
    // console.log("Generated number",generateRandomNumber);
    const answers=await askQuestions();
    if(answers.RANDOM){
        const paymentSignature=await transferSOL(userWallet,treasuryWallet,totalAmtToBePaid(answers.SOL))
        console.log(`Signature of payment for playing the game`,colors.green`${paymentSignature}`);
        if(answers.RANDOM===generateRandomNumber){
            //AirDrop Winning Amount
            await airDropSol(treasuryWallet,getReturnAmount(answers.SOL,parseFloat(answers.RATIO)));
            //guess is successfull
            const prizeSignature=await transferSOL(treasuryWallet,userWallet,getReturnAmount(answers.SOL,parseFloat(answers.RATIO)))
            console.log(colors.green`Your guess is absolutely correct`);
            console.log(`Here is the price signature `,colors.green`${prizeSignature}`);
        }else{
            //better luck next time
            console.log(colors.yellow`Better luck next time`)
        }
    }
}

gameExecution()