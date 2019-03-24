const ethInput = document.getElementById("eth-value-input");
const ethDepositInput = document.getElementById("eth-deposit-input");
const sfInput = document.getElementById("sf-value-input");
const purchaseButton = document.getElementById("purchase-sf-button");
const depositButton = document.getElementById("deposit-eth-button");
const responseDiv = document.getElementById("response");
const responseDepositDiv = document.getElementById("response-deposit");
const calcETH = document.getElementById("calculator-eth");
const calcBTC = document.getElementById("calculator-btc");
const calcUSD = document.getElementById("calculator-usd");
const calcSF = document.getElementById("calculator-sf");

ethInput.onkeyup = () => {
  let value = ethInput.value;
  sfInput.value = value * config.ETHinSf;
}

sfInput.onkeyup = () => {
  let value = sfInput.value;
  ethInput.value = value * config.sfInETH;
}

calcSF.onkeyup = () => {
  let value = calcSF.value;
  calcETH.value = value * config.sfInETH;
  calcBTC.value = value * config.sfInBTC;
  calcUSD.value = value * config.sfInUSD;
}