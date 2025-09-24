import Deck from "./deck.js";

//set stand and hit buttons initially unabled
togButton("stand", false);
togButton("hit", false);

//target the buttons and set event listeners
document.querySelector("#deal-button").addEventListener("click", dealButton);
document.querySelector("#hit-button").addEventListener("click", hitButton);
document.querySelector("#stand-button").addEventListener("click", standButton);
document.querySelector("#bet-button").addEventListener("click", addBet);

const betInput = document.querySelector("#bet-input");
const betButton = document.querySelector("#bet-button");
const potAmountLabel = document.querySelector("#bet-pot-amount");
const potChipStack = document.querySelector("#pot-chip-stack");
const balanceChipStack = document.querySelector("#balance-chip-stack");
const quickBetButtons = document.querySelectorAll("[data-quick-bet]");
const clearBetButton = document.querySelector("#clear-bet-button");
const doubleBetButton = document.querySelector("#double-bet-button");
const maxBetButton = document.querySelector("#max-bet-button");
const statusBanner = document.querySelector("#status-banner");
const effectsLayer = document.querySelector("#effects-layer");
const bankAnchor = document.querySelector("#bank-anchor");
const potAnchor = document.querySelector("#pot-anchor");
const dealerAnchor = document.querySelector("#dealer-anchor");
const insuranceAnchor = document.querySelector("#insurance-anchor");
const gameContainer = document.querySelector(".game");
const repeatBetButton = document.querySelector("#repeat-bet-button");
const halfBetButton = document.querySelector("#half-bet-button");
const tipDealerButton = document.querySelector("#tip-dealer-button");
const insuranceButton = document.querySelector("#insurance-button");
const autoRebetToggle = document.querySelector("#auto-rebet-toggle");
const autoStandToggle = document.querySelector("#auto-stand-toggle");
const highRollerToggle = document.querySelector("#high-roller-toggle");
const historyList = document.querySelector("#hand-history");
const clearHistoryButton = document.querySelector("#clear-history-button");
const profitValue = document.querySelector("#game-profit");
const handsValue = document.querySelector("#game-hands");
const bestWinValue = document.querySelector("#game-best-win");
const tierLabel = document.querySelector("#bank-tier");
const tierProgressFill = document.querySelector("#tier-progress");
const bankTrendFill = document.querySelector("#bank-trend-fill");
const bankTrendLabel = document.querySelector("#bank-trend-label");
const lastProfitLabel = document.querySelector("#last-profit-label");
const vaultBalanceLabel = document.querySelector("#vault-balance");
const saveBankButton = document.querySelector("#save-bank-button");
const withdrawBankButton = document.querySelector("#withdraw-bank-button");
const vaultAnchor = document.querySelector("#vault-anchor");
const vaultChipStack = document.querySelector("#vault-chip-stack");
const insuranceAmountLabel = document.querySelector("#insurance-amount");
const insuranceChipStack = document.querySelector("#insurance-chip-stack");
const jackpotAmountLabel = document.querySelector("#jackpot-amount");

//new audio object
const hitSound = new Audio("audio/swish.mp3");

quickBetButtons.forEach((button) => {
    button.addEventListener("click", () => handleQuickBet(button));
});
if (clearBetButton) clearBetButton.addEventListener("click", () => updateTargetBet(0));
if (doubleBetButton) doubleBetButton.addEventListener("click", doubleBet);
if (maxBetButton) maxBetButton.addEventListener("click", maxBet);
if (repeatBetButton) repeatBetButton.addEventListener("click", repeatBet);
if (halfBetButton) halfBetButton.addEventListener("click", halfBet);
if (tipDealerButton) tipDealerButton.addEventListener("click", tipDealer);
if (insuranceButton) insuranceButton.addEventListener("click", toggleInsurance);
if (autoRebetToggle) autoRebetToggle.addEventListener("change", () => {
    YOU["autoRebet"] = autoRebetToggle.checked;
    setStatusMessage(
        YOU["autoRebet"] ? "Auto rebet enabled." : "Auto rebet disabled.",
        YOU["autoRebet"] ? "info" : "neutral"
    );
});
if (autoStandToggle) autoStandToggle.addEventListener("change", () => {
    YOU["autoStand"] = autoStandToggle.checked;
    setStatusMessage(
        YOU["autoStand"] ? "Auto stand on 17 enabled." : "Auto stand disabled.",
        YOU["autoStand"] ? "info" : "neutral"
    );
});
if (highRollerToggle)
    highRollerToggle.addEventListener("change", () => {
        YOU["highRoller"] = highRollerToggle.checked;
        applyHighRollerMode(highRollerToggle.checked);
        setStatusMessage(
            YOU["highRoller"] ? "High roller mode engaged." : "High roller mode off.",
            YOU["highRoller"] ? "info" : "neutral"
        );
    });
if (clearHistoryButton) clearHistoryButton.addEventListener("click", clearHistory);
if (saveBankButton) saveBankButton.addEventListener("click", depositToVault);
if (withdrawBankButton) withdrawBankButton.addEventListener("click", withdrawFromVault);
if (betInput) {
    betInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addBet();
        }
    });
    betInput.addEventListener("input", () => {
        if (betButton && betButton.disabled) return;
        clearBetError();
    });
}

//create blakcjack object for game 
let blackjack = {
    you: {
        scoreSpan: "#player-result",
        div: "#game__box-player",
        balanceSpan: "#game-money",
        streakSpan: "#game-streak",
        score: 0,
        standing: false,
        balance: 1000,
        streak: 0,
        hand: [],
        lifetimeProfit: 0,
        handsPlayed: 0,
        biggestWin: 0,
        lastProfit: 0,
        vault: 0,
        autoRebet: false,
        autoStand: false,
        highRoller: false,
    },
    dealer: {
        scoreSpan: "#dealer-result",
        div: "#game__box-dealer",
        score: 0,
        hand: [],
    },
    cardsMap: {
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        K: 10,
        J: 10,
        Q: 10,
        A: [1, 11],
    },
};

let YOU = blackjack["you"];
let DEALER = blackjack["dealer"];
let BET = 0;
let betInPot = 0;
let lastBalanceValue = YOU["balance"];
let lastPotValue = betInPot;
let lastHandBet = 0;
let lastLockedBet = 0;
let insuranceBet = 0;
let insuranceLocked = false;
let jackpotAmount = 5000;
const deck = new Deck();
deck.shuffle();

function dealButton() {
    if (betInPot <= 0) {
        showBetError("Place a bet before dealing.");
        return;
    }

    insuranceLocked = true;
    if (insuranceButton) insuranceButton.disabled = true;
    lastHandBet = betInPot;
    if (betInPot > 0) lastLockedBet = betInPot;
    updateInsuranceDisplay();

    // Resets the players score and cards
    resetGame();
    clearBetError();
    setStatusMessage("Player's turn — make your move!", "info");
    flashElement(potAnchor, "is-glowing");

    // 1 for YOU > 1 for DEALER > 1 for YOU > face down for DEALER
    dealCardsTimer(YOU, 1000);
    dealCardsTimer(DEALER, 1500);
    dealCardsTimer(YOU, 2000);

    //deal button not visible
    togButton("deal", false);

    //make other buttons visible
    togButton("hit", true);
    togButton("stand", true);

    if (betButton) betButton.disabled = true;

    //finish the game auto (TODO)
}

async function hitButton() {
    // If you pressed stand, then you shouldn't be able to request a new card
    if (YOU["standing"]) return;
    setStatusMessage("Player hits!", "info");
    await dealCARDS(YOU);
    //auto deal
    if (YOU["score"] > 21) standButton();
}

function addBet() {
    if (betButton && betButton.disabled) return;
    if (!betInput) return;

    clearBetError();
    const rawValue = parseInt(betInput.value, 10);

    if (Number.isNaN(rawValue) || rawValue < 0) {
        showBetError("Enter a bet of 0 or more.");
        return;
    }

    const max = getMaxBet();
    let desiredBet = Math.min(rawValue, max);
    if (YOU["highRoller"] && desiredBet > 0 && desiredBet < 100) {
        desiredBet = Math.min(100, max);
    }

    if (desiredBet !== rawValue) {
        betInput.value = desiredBet;
    }

    const availableBalance = YOU["balance"] + betInPot;

    if (desiredBet > availableBalance) {
        showBetError("No balance available");
        return;
    }

    const difference = desiredBet - betInPot;

    if (difference > 0) {
        animateChipTransfer(difference, bankAnchor, potAnchor, {
            label: formatCurrency(difference),
            variant: "bet",
        });
        flashElement(potAnchor, "is-glowing");
        if (desiredBet >= 500) {
            showBetSpotlight(desiredBet);
        }
        seedJackpot(Math.floor(difference * 0.05));
    } else if (difference < 0) {
        animateChipTransfer(Math.abs(difference), potAnchor, bankAnchor, {
            label: formatCurrency(Math.abs(difference)),
            variant: "return",
        });
        flashElement(bankAnchor, "is-glowing");
    }

    YOU["balance"] = availableBalance - desiredBet;
    BET = desiredBet;
    betInPot = desiredBet;

    if (betInPot === 0 && insuranceBet > 0) {
        animateChipTransfer(insuranceBet, insuranceAnchor, bankAnchor, {
            label: formatCurrency(insuranceBet),
            variant: "return",
        });
        YOU["balance"] += insuranceBet;
        insuranceBet = 0;
        updateInsuranceDisplay();
    }

    if (betInPot > 0) {
        lastLockedBet = betInPot;
    }

    updateBalanceDisplay();
    updatePotDisplay();
    updateInsuranceDisplay();

    if (betInPot > 0) {
        setStatusMessage(`Bet locked: ${formatCurrency(betInPot)}`, "info");
    } else {
        setStatusMessage("Bet cleared", "neutral");
    }

    console.log("Bet placed:", BET, "Remaining balance:", YOU["balance"]);
}

function updateBalanceDisplay() {
    const balanceElement = document.querySelector(YOU["balanceSpan"]);
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(YOU["balance"]);
        if (YOU["balance"] !== lastBalanceValue) {
            triggerPulse(balanceElement);
        }
    }
    renderChipStack(balanceChipStack, YOU["balance"]);
    lastBalanceValue = YOU["balance"];
    updateStatsDisplay();
}

function updatePotDisplay() {
    if (potAmountLabel) {
        potAmountLabel.textContent = formatCurrency(betInPot);
        if (betInPot !== lastPotValue) {
            triggerPulse(potAmountLabel);
        }
    }
    renderChipStack(potChipStack, betInPot);
    lastPotValue = betInPot;
}

function showBetError(message) {
    if (!betInput) return;
    betInput.classList.add("has-error");
    betInput.setCustomValidity(message);
    betInput.reportValidity();
    betInput.focus();
    setStatusMessage(message, "alert");
}

function clearBetError() {
    if (!betInput) return;
    betInput.classList.remove("has-error");
    betInput.setCustomValidity("");
}

// resetGame: restarts the game, function called every dealButton()
function resetGame() {
    YOU["score"] = 0;
    YOU["standing"] = false; // If you pressed stand, then you wont be able to pick more cards. Needed in order to make the game finish if no one is on "bust" state
    YOU["hand"] = [];
    const playerBox = document.getElementById("game__box-player");
    if (playerBox) playerBox.innerHTML = "";
    const playerScoreSpan = document.querySelector(YOU["scoreSpan"]);
    if (playerScoreSpan) {
        playerScoreSpan.textContent = "0";
        setScoreState(playerScoreSpan);
    }

    DEALER["score"] = 0;
    DEALER["hand"] = [];
    const dealerBox = document.getElementById("game__box-dealer");
    if (dealerBox) dealerBox.innerHTML = "";
    const dealerScoreSpan = document.querySelector(DEALER["scoreSpan"]);
    if (dealerScoreSpan) {
        dealerScoreSpan.textContent = "0";
        setScoreState(dealerScoreSpan);
    }
}

function dealCardsTimer(player, time) {
    window.setTimeout(function () {
        dealCARDS(player);
    }, time);
}

async function dealCARDS(player) {
    let card = deck.cards.pop();
    addCardToHand(player, card.value);
    await showCard(card, player);
    updateScore(card.value, player);
    showScore(player);

  // After every card deal, the game should check if there's a winner
    computeWinner();
}

function standButton() {
  // If you pressed stand, then return to avoid bugs
    if (YOU["standing"]) return;
    YOU["standing"] = true;
    setStatusMessage("Dealer drawing cards...", "info");
    togButton("hit", false, true);
    flashElement(dealerAnchor, "is-glowing");

  //fix
    const finalDeal = window.setInterval(function () {
        dealCARDS(DEALER);
        if (DEALER["score"] >= 17) clearInterval(finalDeal);
    }, 750);
}

function addCardToHand(player, card) {
    //array of values without suit
    player["hand"].push(card);
}

function layoutHand(player) {
    const container = document.querySelector(player["div"]);
    if (!container) return;
    const cards = container.querySelectorAll(".card");
    const cardCount = cards.length;
    cards.forEach((cardElement, index) => {
        const offsetFromCenter = cardCount > 1 ? index - (cardCount - 1) / 2 : 0;
        const translateX = offsetFromCenter * 45;
        const rotate = offsetFromCenter * 6;
        const translateY = player === YOU ? 40 : -20;
        cardElement.style.setProperty("--tx", `${translateX}px`);
        cardElement.style.setProperty("--ty", `${translateY}px`);
        cardElement.style.setProperty("--rot", `${rotate}deg`);
    });
}

async function showCard(card, player) {
    let image = document.createElement("img");
    image.src = `cards/${card.value}${card.suit}.svg`;
    image.alt = `${card.value} of ${card.suit}`;
    image.classList.add("card", player === YOU ? "card--player" : "card--dealer");
    image.draggable = false;
    const container = document.querySelector(player["div"]);
    if (container) {
        container.appendChild(image);
        layoutHand(player);
    }

    hitSound.currentTime = 0;
    try {
        await hitSound.play();
    } catch (error) {
        // Audio play can fail on some browsers without a user gesture.
    }
}

function updateScore(card, player) {
    //fix problem if As comes first
    //As is avalueted as 1 or 11 depending on player cards hand
    //when player draws an ace and the score exceedes 21, As value change to 1
    if (card === "A") {
        if (player["score"] + blackjack["cardsMap"][card][1] <= 21) {
            player["score"] += blackjack["cardsMap"][card][1];
        } else {
            player["score"] += blackjack["cardsMap"][card][0];
        }
    } else {
        player["score"] += blackjack["cardsMap"][card];
        if(player["hand"].length > 1){
            if(player["hand"][player["hand"].length - 2] === "A"){
                player["score"]-=10;
      }
    }
  }
}

function showScore(player) {
    const scoreSpan = document.querySelector(player["scoreSpan"]);
    if (!scoreSpan) return;
    if (player["score"] > 21) {
        scoreSpan.textContent = "BUST";
        setScoreState(scoreSpan, "bust");
    } else {
        scoreSpan.textContent = `${player["score"]}`;
        setScoreState(scoreSpan);
    }
    triggerPulse(scoreSpan);

    if (
        player === YOU &&
        YOU["autoStand"] &&
        player["hand"].length >= 2 &&
        player["score"] >= 17 &&
        !YOU["standing"]
    ) {
        setTimeout(() => {
            if (!YOU["standing"]) {
                standButton();
            }
        }, 500);
    }
}

function computeWinner() {
  // A winner can't be choiced if the dealer score is less than 17, keep playing if that is the case
    if (DEALER["score"] < 17) return;

  // Otherwise, try to calculate a winner
    let winner;

  // If your score is greater than 21, the dealer wins
    if (YOU["score"] > 21) winner = DEALER;
  // If the dealer score is greater than 21, you win
    else if (DEALER["score"] > 21) winner = YOU;
  // If you decided to stand (neither you or the dealer have more than 21 points)
    else if (YOU["standing"]) {
        // Dealer wins by points
        if (DEALER["score"] > YOU["score"]) winner = DEALER;
        // You win by points
        else if (YOU["score"] > DEALER["score"]) winner = YOU;
        //Draw
        else if (YOU["score"] === DEALER["score"]) winner = "DRAW";
        //delete this?
        else {
            // TODO
            // This code will only make the game restart, this isn't how it should work
            // Make the buttons dissapear in order to avoid bugs
            togButton("deal", false, true);
            togButton("hit", false, true);
            togButton("stand", false, true);
        }
    }

  // Keep playing
    if (!winner) {
        return;
    }

    const wager = betInPot;
    let roundProfit = 0;
  // If you are the winner, then show it
    const playerScoreSpan = document.querySelector(YOU["scoreSpan"]);
    const dealerScoreSpan = document.querySelector(DEALER["scoreSpan"]);

    if (winner === YOU) {
        if (playerScoreSpan) {
            playerScoreSpan.textContent = `WIN (${YOU["score"]})`;
            setScoreState(playerScoreSpan, "win");
            triggerPulse(playerScoreSpan);
        }
        if (dealerScoreSpan) {
            dealerScoreSpan.textContent = `${DEALER["score"]}`;
            setScoreState(dealerScoreSpan, "lose");
            triggerPulse(dealerScoreSpan);
        }
        setStatusMessage("Player wins the hand!", "win");
        winChangeBalance(winner, wager);
        roundProfit += wager;
        upgradeStreak(winner);
    } else if (winner === DEALER) {
        if (dealerScoreSpan) {
            dealerScoreSpan.textContent = `WIN (${DEALER["score"]})`;
            setScoreState(dealerScoreSpan, "win");
            triggerPulse(dealerScoreSpan);
        }
        if (playerScoreSpan) {
            if (YOU["score"] > 21) {
                playerScoreSpan.textContent = "BUST";
                setScoreState(playerScoreSpan, "bust", "lose");
            } else {
                playerScoreSpan.textContent = `LOSE (${YOU["score"]})`;
                setScoreState(playerScoreSpan, "lose");
            }
            triggerPulse(playerScoreSpan);
        }
        setStatusMessage("Dealer takes the pot.", "lose");
        winChangeBalance(winner, wager);
        roundProfit -= wager;
        upgradeStreak(winner);
    } else if (winner === "DRAW") {
        if (playerScoreSpan) {
            playerScoreSpan.textContent = `PUSH (${YOU["score"]})`;
            setScoreState(playerScoreSpan, "draw");
            triggerPulse(playerScoreSpan);
        }
        if (dealerScoreSpan) {
            dealerScoreSpan.textContent = `PUSH (${DEALER["score"]})`;
            setScoreState(dealerScoreSpan, "draw");
            triggerPulse(dealerScoreSpan);
        }
        setStatusMessage("Push! Bets returned.", "draw");
        winChangeBalance(winner, wager);
        upgradeStreak(winner);
    }

    const insuranceNet = settleInsurance(winner);
    roundProfit += insuranceNet;
    YOU["lastProfit"] = roundProfit;
    YOU["handsPlayed"] += 1;
    if (winner === YOU) {
        YOU["biggestWin"] = Math.max(
            YOU["biggestWin"],
            wager + Math.max(0, insuranceNet)
        );
    }
    YOU["lifetimeProfit"] += roundProfit;

    if (roundProfit > 0) {
        makeItRain("win", roundProfit);
    } else if (roundProfit < 0) {
        burnChips(Math.abs(roundProfit));
        seedJackpot(Math.floor(Math.abs(roundProfit) * 0.1));
    } else {
        showEvenSpark();
    }

    addHistoryEntry(winner, wager, roundProfit, YOU["score"], DEALER["score"], insuranceNet);
    updateStatsDisplay();

    togButton("deal", true);
    togButton("hit", false, true);
    togButton("stand", false, true);
    finalizeRound();
}



// togButton: string name, bool state [[, bool instant]]
// name: button name
// state: if true then show the dealButton, false to hide it
// instant: make the tog instant, to avoid bugs, optional
function togButton(name, state, instant) {
    // Return false if the name is not an string in order to avoid console errors
    if (typeof name != "string") return false;

    // If instant wasn't declared as bool, then make it false
    if (typeof instant != "boolean") instant = false;

    // Get the button, if it does not exist then return false
    var btn = document.querySelector(`#${name}-button`);

    if (!btn) return false;

    // SHOW IT
    if (state) {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.disabled = false;
        // Make it appear in 0.3s
        if (!instant) {
            setTimeout(function addThis() {
                btn.style.visibility = "visible";
            }, 300);
        }
        // Make it appear instantly
        else btn.style.visibility = "visible";
    }
    // HIDE IT
    else {
        btn.style.opacity = "0";
        btn.style.pointerEvents = "none";
        btn.disabled = true;
        // Make it dissapear in 0.3s
        if (!instant) {
            setTimeout(function removeThis() {
                btn.style.visibility = "hidden";
            }, 300);
        }
        // Make it dissapear instantly
        else btn.style.visibility = "hidden";
    }
    return false;
}

function finalizeRound() {
    const previousBet = BET;
    betInPot = 0;
    if (betButton) betButton.disabled = false;
    insuranceLocked = false;
    if (insuranceButton) insuranceButton.disabled = false;
    clearBetError();
    updatePotDisplay();
    if (insuranceBet > 0) {
        YOU["balance"] += insuranceBet;
        insuranceBet = 0;
        updateBalanceDisplay();
    }
    updateInsuranceDisplay();
    if (previousBet > 0) {
        lastLockedBet = previousBet;
    }
    if (betInput) {
        const suggestedBet = Math.min(previousBet, YOU["balance"]);
        betInput.value = suggestedBet > 0 ? suggestedBet : "";
    }
    if (YOU["autoRebet"]) {
        const nextBet = Math.min(lastLockedBet, getMaxBet());
        if (nextBet > 0) {
            setTimeout(() => updateTargetBet(nextBet), 1200);
        }
    }
}

function winChangeBalance(winner, wager) {
    //if win return profit
    if (typeof wager !== "number" || wager <= 0) {
        updateBalanceDisplay();
        updatePotDisplay();
        return;
    }

    if (winner === YOU) {
        const winnings = wager * 2;
        animateChipTransfer(winnings, potAnchor, bankAnchor, {
            label: `+${formatCurrency(winnings)}`,
            variant: "win",
        });
        flashElement(bankAnchor, "is-glowing");
        YOU["balance"] += winnings;
    } else if (winner === "DRAW") {
        animateChipTransfer(wager, potAnchor, bankAnchor, {
            label: formatCurrency(wager),
            variant: "return",
        });
        flashElement(bankAnchor, "is-glowing");
        YOU["balance"] += wager;
    } else if (winner === DEALER) {
        animateChipTransfer(wager, potAnchor, dealerAnchor, {
            label: formatCurrency(wager),
            variant: "dealer",
        });
        flashElement(dealerAnchor, "is-glowing");
    }
    updateBalanceDisplay();
    updatePotDisplay();
    console.log("final balance: ", YOU["balance"]);
}

function upgradeStreak(winner) {
    if (winner === YOU) YOU["streak"]++;
    else if (winner === "DRAW") return;
    else if (winner === DEALER) YOU["streak"] = 0;
    const streakElement = document.querySelector(YOU["streakSpan"]);
    if (streakElement) {
        streakElement.textContent = YOU["streak"];
        triggerPulse(streakElement);
    }
    console.log(YOU["streak"]);
}

function formatCurrency(amount) {
    const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
    const sign = safeAmount < 0 ? "-" : "";
    const absolute = Math.abs(safeAmount);
    return `${sign}$${absolute.toLocaleString("en-US")}`;
}

function formatSignedCurrency(amount) {
    if (!Number.isFinite(amount) || amount === 0) {
        return formatCurrency(0);
    }
    const prefix = amount > 0 ? "+" : "-";
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
}

function updateStatsDisplay() {
    if (profitValue) {
        profitValue.textContent = formatSignedCurrency(YOU["lifetimeProfit"]);
    }
    if (handsValue) {
        const hands = YOU["handsPlayed"];
        handsValue.textContent = `${hands} ${hands === 1 ? "hand" : "hands"}`;
    }
    if (bestWinValue) {
        bestWinValue.textContent = `Best win: ${formatCurrency(YOU["biggestWin"])}`;
    }
    if (lastProfitLabel) {
        lastProfitLabel.textContent =
            YOU["lastProfit"] === 0
                ? "Last result: Even"
                : `Last result: ${formatSignedCurrency(YOU["lastProfit"])}`;
    }
    if (gameContainer) {
        gameContainer.classList.toggle("game--ahead", YOU["lifetimeProfit"] > 0);
        gameContainer.classList.toggle("game--behind", YOU["lifetimeProfit"] < 0);
    }
    updateVipTier();
    updateTrendMeter();
    updateVaultDisplay();
}

function updateTrendMeter() {
    if (!bankTrendFill || !bankTrendLabel) return;
    const clampRange = 4000;
    const normalized = Math.max(-1, Math.min(1, YOU["lifetimeProfit"] / clampRange));
    const widthPercent = ((normalized + 1) / 2) * 100;
    bankTrendFill.style.width = `${Math.max(4, widthPercent)}%`;
    bankTrendFill.classList.toggle("is-negative", YOU["lifetimeProfit"] < 0);
    bankTrendFill.classList.toggle("is-positive", YOU["lifetimeProfit"] >= 0);
    if (YOU["lifetimeProfit"] > 0) {
        bankTrendLabel.textContent = `Up ${formatCurrency(YOU["lifetimeProfit"])}`;
    } else if (YOU["lifetimeProfit"] < 0) {
        bankTrendLabel.textContent = `Down ${formatCurrency(Math.abs(YOU["lifetimeProfit"]))}`;
    } else {
        bankTrendLabel.textContent = "Even";
    }
}

function updateVipTier() {
    if (!tierLabel) return;
    const bankroll = YOU["balance"] + YOU["vault"];
    const tiers = [
        { name: "Bronze", threshold: 0 },
        { name: "Silver", threshold: 1500 },
        { name: "Gold", threshold: 3000 },
        { name: "Platinum", threshold: 6000 },
        { name: "Diamond", threshold: 10000 },
        { name: "Obsidian", threshold: 20000 },
    ];
    let currentIndex = 0;
    for (let i = 0; i < tiers.length; i++) {
        if (bankroll >= tiers[i].threshold) {
            currentIndex = i;
        }
    }
    const currentTier = tiers[currentIndex];
    tierLabel.textContent = currentTier.name;
    const nextTier = tiers[Math.min(currentIndex + 1, tiers.length - 1)];
    let progress = 1;
    if (nextTier && nextTier.threshold !== currentTier.threshold) {
        const span = nextTier.threshold - currentTier.threshold;
        progress = Math.min(
            1,
            Math.max(0, (bankroll - currentTier.threshold) / span)
        );
    }
    if (tierProgressFill) {
        tierProgressFill.style.width = `${Math.max(10, progress * 100)}%`;
    }
}

function updateVaultDisplay() {
    if (vaultBalanceLabel) {
        vaultBalanceLabel.textContent = formatCurrency(YOU["vault"]);
    }
    renderChipStack(vaultChipStack, YOU["vault"]);
}

function updateInsuranceDisplay() {
    if (insuranceAmountLabel) {
        insuranceAmountLabel.textContent = formatCurrency(insuranceBet);
    }
    renderChipStack(insuranceChipStack, insuranceBet);
    if (insuranceButton) {
        insuranceButton.classList.toggle("is-active", insuranceBet > 0);
        insuranceButton.textContent = insuranceBet > 0 ? "Insurance On" : "Add Insurance";
        insuranceButton.disabled = insuranceLocked;
    }
}

function addHistoryEntry(result, bet, profit, playerScore, dealerScore, insuranceNet) {
    if (!historyList) return;
    const outcome = result === YOU ? "win" : result === DEALER ? "lose" : "draw";
    const item = document.createElement("li");
    item.className = `history-list__item history-list__item--${outcome}`;
    const displayProfit = profit === 0 ? "Even" : formatSignedCurrency(profit);
    const timeLabel = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    const insuranceTag =
        insuranceNet && insuranceNet !== 0
            ? `<span class="history-list__tag">Insurance ${formatSignedCurrency(insuranceNet)}</span>`
            : "";

    item.innerHTML = `
        <span class="history-list__badge">${outcome.toUpperCase()}</span>
        <div class="history-list__details">
          <span class="history-list__scores">${playerScore} - ${dealerScore}</span>
          <span class="history-list__bet">Bet ${formatCurrency(bet)}</span>
          ${insuranceTag}
        </div>
        <span class="history-list__profit">${displayProfit}</span>
        <span class="history-list__time">${timeLabel}</span>
    `;

    historyList.prepend(item);
    while (historyList.children.length > 7) {
        historyList.removeChild(historyList.lastElementChild);
    }
}

function clearHistory() {
    if (!historyList) return;
    historyList.innerHTML = "";
    setStatusMessage("History cleared.", "neutral");
}

function repeatBet() {
    if (betButton && betButton.disabled) return;
    const lastBet = lastHandBet > 0 ? lastHandBet : lastLockedBet;
    const max = getMaxBet();
    if (!lastBet || lastBet <= 0) {
        setStatusMessage("No previous bet to repeat.", "alert");
        return;
    }
    if (max <= 0) {
        setStatusMessage("No balance available to repeat that bet.", "alert");
        return;
    }
    updateTargetBet(Math.min(lastBet, max));
}

function halfBet() {
    if (betButton && betButton.disabled) return;
    const current = betInPot > 0 ? betInPot : parseInt(betInput && betInput.value, 10) || 0;
    if (current <= 0) {
        setStatusMessage("No bet to halve.", "alert");
        return;
    }
    updateTargetBet(Math.floor(current / 2));
}

function tipDealer() {
    if (betButton && betButton.disabled) {
        setStatusMessage("Finish the hand before tipping.", "alert");
        return;
    }
    const available = YOU["balance"];
    if (available <= 0) {
        setStatusMessage("No chips available to tip.", "alert");
        return;
    }
    const base = betInPot > 0 ? Math.round(betInPot * 0.1) : 25;
    const tipAmount = Math.min(Math.max(10, base), available);
    YOU["balance"] -= tipAmount;
    animateChipTransfer(tipAmount, bankAnchor, dealerAnchor, {
        label: `Tip ${formatCurrency(tipAmount)}`,
        variant: "tip",
    });
    flashElement(dealerAnchor, "is-glowing");
    updateBalanceDisplay();
    seedJackpot(Math.floor(tipAmount * 0.2));
    setStatusMessage(`You tipped the dealer ${formatCurrency(tipAmount)}.`, "info");
}

function toggleInsurance() {
    if (insuranceLocked) {
        setStatusMessage("Insurance locked for this hand.", "alert");
        return;
    }
    if (insuranceBet > 0) {
        YOU["balance"] += insuranceBet;
        animateChipTransfer(insuranceBet, insuranceAnchor, bankAnchor, {
            label: formatCurrency(insuranceBet),
            variant: "return",
        });
        insuranceBet = 0;
        updateInsuranceDisplay();
        updateBalanceDisplay();
        setStatusMessage("Insurance canceled.", "neutral");
        return;
    }
    if (betInPot <= 0) {
        setStatusMessage("Lock a bet before adding insurance.", "alert");
        return;
    }
    const base = Math.floor(betInPot / 2);
    const maxInsurance = Math.min(base, YOU["balance"]);
    if (maxInsurance <= 0) {
        setStatusMessage("No balance available for insurance.", "alert");
        return;
    }
    insuranceBet = maxInsurance;
    YOU["balance"] -= insuranceBet;
    animateChipTransfer(insuranceBet, bankAnchor, insuranceAnchor, {
        label: formatCurrency(insuranceBet),
        variant: "insurance",
    });
    flashElement(insuranceAnchor, "is-glowing");
    updateInsuranceDisplay();
    updateBalanceDisplay();
    setStatusMessage(`Insurance set at ${formatCurrency(insuranceBet)}.`, "info");
}

function depositToVault() {
    if (betButton && betButton.disabled) {
        setStatusMessage("Wait for the hand to finish before vaulting.", "alert");
        return;
    }
    const amount = Math.min(100, YOU["balance"]);
    if (amount <= 0) {
        setStatusMessage("Nothing available to vault.", "alert");
        return;
    }
    YOU["balance"] -= amount;
    YOU["vault"] += amount;
    animateChipTransfer(amount, bankAnchor, vaultAnchor, {
        label: formatCurrency(amount),
        variant: "vault",
    });
    flashElement(vaultAnchor, "is-glowing");
    updateBalanceDisplay();
    updateVaultDisplay();
    setStatusMessage(`Vaulted ${formatCurrency(amount)} for a rainy day.`, "info");
}

function withdrawFromVault() {
    if (betButton && betButton.disabled) {
        setStatusMessage("Wait for the hand to finish before withdrawing.", "alert");
        return;
    }
    const amount = Math.min(100, YOU["vault"]);
    if (amount <= 0) {
        setStatusMessage("Vault is empty.", "alert");
        return;
    }
    YOU["vault"] -= amount;
    YOU["balance"] += amount;
    animateChipTransfer(amount, vaultAnchor, bankAnchor, {
        label: formatCurrency(amount),
        variant: "vault",
    });
    flashElement(bankAnchor, "is-glowing");
    updateVaultDisplay();
    updateBalanceDisplay();
    setStatusMessage(`Withdrew ${formatCurrency(amount)} from the vault.`, "info");
}

function makeItRain(type = "win", amount = 0) {
    if (!effectsLayer) return;
    const count = Math.min(24, 8 + Math.floor(Math.abs(amount) / 120));
    for (let i = 0; i < count; i++) {
        const bill = document.createElement("span");
        bill.className = "money-bill";
        if (type === "loss") bill.classList.add("money-bill--loss");
        bill.style.setProperty("--x", Math.random().toFixed(3));
        bill.style.setProperty("--rot", `${(Math.random() * 24 - 12).toFixed(2)}deg`);
        bill.style.animationDelay = `${i * 0.05}s`;
        effectsLayer.appendChild(bill);
        bill.addEventListener("animationend", () => bill.remove());
    }
}

function burnChips(amount) {
    if (!effectsLayer || !potAnchor || !gameContainer) return;
    const potRect = potAnchor.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();
    const count = Math.min(18, 6 + Math.floor(amount / 120));
    for (let i = 0; i < count; i++) {
        const ember = document.createElement("span");
        ember.className = "chip-ember";
        const offsetX = (Math.random() - 0.5) * potRect.width;
        const offsetY = (Math.random() - 0.5) * potRect.height;
        ember.style.left = `${potRect.left - gameRect.left + potRect.width / 2 + offsetX}px`;
        ember.style.top = `${potRect.top - gameRect.top + potRect.height / 2 + offsetY}px`;
        ember.style.setProperty("--tx", `${(Math.random() * 120 - 60).toFixed(2)}px`);
        effectsLayer.appendChild(ember);
        ember.addEventListener("animationend", () => ember.remove());
    }
}

function showEvenSpark() {
    if (!effectsLayer) return;
    const spark = document.createElement("div");
    spark.className = "even-spark";
    effectsLayer.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
}

function showBetSpotlight(amount) {
    if (!effectsLayer) return;
    const spotlight = document.createElement("div");
    spotlight.className = "table-spotlight";
    spotlight.style.setProperty("--intensity", Math.min(1, amount / 2000).toFixed(2));
    effectsLayer.appendChild(spotlight);
    spotlight.addEventListener("animationend", () => spotlight.remove());
}

function seedJackpot(amount) {
    if (!Number.isFinite(amount) || amount === 0) return;
    jackpotAmount = Math.max(0, Math.round(jackpotAmount + amount));
    updateJackpotDisplay();
}

function updateJackpotDisplay() {
    if (!jackpotAmountLabel) return;
    jackpotAmountLabel.textContent = formatCurrency(jackpotAmount);
    triggerPulse(jackpotAmountLabel);
}

function applyHighRollerMode(active) {
    if (betInput) {
        betInput.min = active ? "100" : "0";
        betInput.step = active ? "50" : "10";
    }
    if (gameContainer) {
        gameContainer.classList.toggle("game--high-roller", active);
    }
    if (active) {
        const max = getMaxBet();
        if (max > 0 && betInPot < 100 && !(betButton && betButton.disabled)) {
            updateTargetBet(Math.min(Math.max(100, betInPot || 100), max));
        }
    }
}

function settleInsurance(winner) {
    if (insuranceBet <= 0) {
        updateInsuranceDisplay();
        return 0;
    }

    let net = 0;
    const dealerHasBlackjack = DEALER["score"] === 21 && DEALER["hand"].length === 2;
    if (dealerHasBlackjack) {
        const payout = insuranceBet * 3;
        animateChipTransfer(payout, insuranceAnchor, bankAnchor, {
            label: `+${formatCurrency(payout)}`,
            variant: "insurance",
        });
        flashElement(bankAnchor, "is-glowing");
        YOU["balance"] += payout;
        net += insuranceBet * 2;
    } else {
        animateChipTransfer(insuranceBet, insuranceAnchor, dealerAnchor, {
            label: formatCurrency(insuranceBet),
            variant: "dealer",
        });
        flashElement(dealerAnchor, "is-glowing");
        net -= insuranceBet;
        seedJackpot(Math.floor(Math.abs(net) * 0.05));
    }
    insuranceBet = 0;
    updateInsuranceDisplay();
    updateBalanceDisplay();
    return net;
}

function triggerPulse(element) {
    if (!element) return;
    element.classList.remove("is-pulsing");
    void element.offsetWidth;
    element.classList.add("is-pulsing");
}

function flashElement(element, className = "is-glowing") {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
}

function renderChipStack(container, amount) {
    if (!container) return;
    container.innerHTML = "";
    if (typeof amount !== "number" || amount <= 0) return;
    const safeAmount = Math.max(0, Math.floor(amount));
    const chipCount = Math.min(6, Math.max(1, Math.ceil(Math.log10(safeAmount + 10))));
    for (let i = 0; i < chipCount; i++) {
        const chip = document.createElement("span");
        chip.className = "chip-stack__chip";
        chip.style.setProperty("--chip-index", i);
        container.appendChild(chip);
    }
}

function setStatusMessage(message, variant = "info") {
    if (!statusBanner) return;
    statusBanner.textContent = message;
    const variants = [
        "table__announcement--info",
        "table__announcement--win",
        "table__announcement--lose",
        "table__announcement--draw",
        "table__announcement--alert",
    ];
    statusBanner.classList.remove(...variants);
    if (variant && variant !== "neutral") {
        statusBanner.classList.add(`table__announcement--${variant}`);
    }
    triggerPulse(statusBanner);
}

function setScoreState(span, ...states) {
    if (!span) return;
    const classes = [
        "score-pill--win",
        "score-pill--lose",
        "score-pill--draw",
        "score-pill--bust",
    ];
    span.classList.remove(...classes);
    states
        .filter(Boolean)
        .forEach((state) => span.classList.add(`score-pill--${state}`));
}

function getMaxBet() {
    return Math.max(0, YOU["balance"] + betInPot);
}

function updateTargetBet(value) {
    if (betButton && betButton.disabled) return;
    if (!betInput) return;
    const max = getMaxBet();
    const sanitized = Math.min(Math.max(0, Math.floor(value)), max);
    betInput.value = sanitized;
    triggerPulse(betInput);
    addBet();
}

function handleQuickBet(button) {
    if (!button || (betButton && betButton.disabled)) return;
    const amount = parseInt(button.dataset.quickBet, 10);
    if (Number.isNaN(amount)) return;
    const current = parseInt(betInput && betInput.value, 10) || betInPot || 0;
    const max = getMaxBet();
    const proposed = current + amount;
    updateTargetBet(Math.min(proposed, max));
}

function doubleBet() {
    if (betButton && betButton.disabled) return;
    const max = getMaxBet();
    if (max <= 0) return;
    const currentValue = parseInt(betInput && betInput.value, 10);
    const base = !Number.isNaN(currentValue) && currentValue > 0
        ? currentValue
        : betInPot > 0
        ? betInPot
        : Math.min(50, max);
    updateTargetBet(Math.min(base * 2, max));
}

function maxBet() {
    if (betButton && betButton.disabled) return;
    updateTargetBet(getMaxBet());
}

function animateChipTransfer(amount, from, to, options = {}) {
    if (typeof amount !== "number" || amount <= 0) return;
    const fromElement = typeof from === "string" ? document.querySelector(from) : from;
    const toElement = typeof to === "string" ? document.querySelector(to) : to;
    if (!fromElement || !toElement || !effectsLayer || !gameContainer) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    const gameRect = gameContainer.getBoundingClientRect();

    const chip = document.createElement("div");
    chip.className = "flying-chip";
    if (options.variant) {
        chip.classList.add(`flying-chip--${options.variant}`);
    }
    chip.textContent = options.label || formatCurrency(amount);

    const startX = fromRect.left - gameRect.left + fromRect.width / 2;
    const startY = fromRect.top - gameRect.top + fromRect.height / 2;
    const endX = toRect.left - gameRect.left + toRect.width / 2;
    const endY = toRect.top - gameRect.top + toRect.height / 2;

    chip.style.left = `${startX}px`;
    chip.style.top = `${startY}px`;
    chip.style.transform = "translate(-50%, -50%) scale(0.6)";
    chip.style.opacity = "0";

    effectsLayer.appendChild(chip);

    requestAnimationFrame(() => {
        chip.style.left = `${endX}px`;
        chip.style.top = `${endY}px`;
        chip.style.transform = "translate(-50%, -50%) scale(1)";
        chip.style.opacity = "1";
    });

    chip.addEventListener(
        "transitionend",
        () => {
            chip.remove();
        },
        { once: true }
    );
}

if (jackpotAmountLabel) {
    const parsedJackpot = parseInt(
        jackpotAmountLabel.textContent.replace(/[^0-9]/g, ""),
        10
    );
    if (!Number.isNaN(parsedJackpot) && parsedJackpot > 0) {
        jackpotAmount = parsedJackpot;
    }
    updateJackpotDisplay();
}
updateInsuranceDisplay();
updateVaultDisplay();
updateBalanceDisplay();
updatePotDisplay();
applyHighRollerMode(YOU["highRoller"]);
setStatusMessage("Place your bet to begin", "info");
