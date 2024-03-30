const numberOfRows = document.getElementById('numberOfRows');
const numberOfColumns = document.getElementById('numberOfColumns');
const numberOfComputers = document.getElementById('numberOfComputers');
const winningStreak = document.getElementById('winningStreak');

const playButton = document.getElementById('playButton');

const menuContainer = document.getElementById('leftSide');
const boardContainer = document.getElementById('rightSide');

let gameRows;
let gameColumns;
let gameComputers;
let gameWinningStreak;
let playerNumber; // which turn is player's turn
let isPlayersMove; // is player to move
let players;

function generatePlayersList(numberOfPlayers) {
    const listOfPlayers = [];

    for(let playerId = 0; playerId < numberOfPlayers; playerId++) {
        // number of all colors switch to hexadecimal that is 6 numbers long - #rrggbb
        const playerColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const playerObject = {
            color: playerColor,
            id: playerId
        };

        listOfPlayers.push(playerObject);
    }

    console.log('Assigned players:', listOfPlayers);
    return listOfPlayers;
}


function moveComputersToEnd(positionOfPlayer, playersArray) {
    const computers = playersArray.slice(0, positionOfPlayer);
    const remainingPlayers = playersArray.slice(positionOfPlayer);
    return [...remainingPlayers, ...computers];
}


function randomChoice(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}


function initiateVariables() {
    console.log('Variable initiation');
    const numberOfRowsProvided = parseInt(numberOfRows.value);
    gameRows = isNaN(numberOfRowsProvided) 
        || numberOfRowsProvided < 3 
        || numberOfRowsProvided > 10 
        ? 3 : numberOfRowsProvided;

    const numberOfColumnsProvided = parseInt(numberOfColumns.value);
    gameColumns = isNaN(numberOfColumnsProvided) 
        || numberOfColumnsProvided < 3 
        || numberOfColumnsProvided > 10 
        ? 3 : numberOfColumnsProvided;

    const numberOfComputersProvided = parseInt(numberOfComputers.value);
    gameComputers = isNaN(numberOfComputersProvided) 
        || numberOfComputersProvided < 1 
        || numberOfComputersProvided > 5
        ? 1 : numberOfComputersProvided;

    const winningStreakProvided = parseInt(winningStreak.value);
    gameWinningStreak = isNaN(winningStreakProvided) 
        || winningStreakProvided < 3 
        || winningStreakProvided > 5 
        ? 3 : winningStreakProvided;

    playerNumber = Math.floor(Math.random() * (gameComputers + 1));
    players = generatePlayersList(gameComputers + 1);

    console.log('Number of rows:', gameRows);
    console.log('Number of columns:', gameColumns);
    console.log('Number of computers:', gameComputers);
    console.log('Winning streak:', gameWinningStreak);
    console.log('Player plays as:', playerNumber);
}


function cleanCurrentBoard() {
    console.log('Cleaning the board');
    boardContainer.innerHTML = '';
}


// there is an error, that fails for diagonal searching
function getFieldsInLine(playersFields, fieldValues, xStep, yStep) {
    // playersFields are nodes
    let fieldsAhead = [];
    let fieldsBehind = [];
    
    let x = fieldValues.x;
    let y = fieldValues.y;
    let isAttachedFieldFound = false;

    // check ahead to find attatched fields
    // vector 1
    for(let i = 1; i < gameWinningStreak; i++) {
        x += xStep;

        // vector 2
        for(let j = 1; j < gameWinningStreak; j++) {
            y += yStep;
            if (x === fieldValues.x && y === fieldValues.y) continue;

            // find matching field if exists
            isAttachedFieldFound = false;
            for(const field of playersFields) {
                if(field.value.x === x && field.value.y === y) {
                    fieldsAhead.push(field.value.id);
                    isAttachedFieldFound = true;
                    break;
                }
            }

            if(!isAttachedFieldFound) break;
        }
        if(!isAttachedFieldFound) break;
    }

    x = fieldValues.x;
    y = fieldValues.y;
    isAttachedFieldFound = false;

    // check behind to find attatched fields
    // vector 1
    for(let i = 1; i < gameWinningStreak; i++) {
        x -= xStep;

        // vector 2
        for(let j = 1; j < gameWinningStreak; j++) {
            y -= yStep;
            if (x === fieldValues.x && y === fieldValues.y) continue;

            // find matching field if exists
            isAttachedFieldFound = false;
            for(const field of playersFields) {
                if(field.value.x === x && field.value.y === y) {
                    fieldsBehind.push(field.value.id);
                    isAttachedFieldFound = true;
                    break;
                }
            }
            if(!isAttachedFieldFound) break;
        }
        if(!isAttachedFieldFound) break;
    }
    // return only unique elements
    const fieldsInLine = [...fieldsAhead, fieldValues.id, ...fieldsBehind];
    return Array.from(new Set(fieldsInLine));
}


function getFieldsInDiagonal(playersFields, fieldValues, yStep) {
    // playersFields are nodes
    let fieldsAhead = [];
    let fieldsBehind = [];
    
    let x = fieldValues.x;
    let y = fieldValues.y;

    // both vectors, but y depends on the input
    for(let i = 1; i < gameWinningStreak; i++) {
        x -= 1;
        y -= yStep;

        let isAttachedFieldFound = false;
        for(const field of playersFields) {
            if(field.value.x === x && field.value.y === y) {
                fieldsBehind.push(field.value.id);
                isAttachedFieldFound = true;
                break;
            }
        }
        if(!isAttachedFieldFound) break;
    }

    x = fieldValues.x;
    y = fieldValues.y;

    for(let i = 1; i < gameWinningStreak; i++) {
        x += 1;
        y += yStep;

        let isAttachedFieldFound = false;
        for(const field of playersFields) {
            if(field.value.x === x && field.value.y === y) {
                fieldsAhead.push(field.value.id);
                isAttachedFieldFound = true;
                break;
            }
        }
        if(!isAttachedFieldFound) break;
    }
    const fieldsInLine = [...fieldsAhead, fieldValues.id, ...fieldsBehind];
    return Array.from(new Set(fieldsInLine));
}


function makeOtherFieldsInvisible(fieldsToBeVisible) {
    const allFields = document.getElementsByClassName('square');
    for (const field of allFields) {
        if (!fieldsToBeVisible.includes(field.value.id)) {
            field.style.visibility = 'hidden';
            field.classList.remove('clickable');
        }
    }
}


function checkIfPlayerWins(fieldValues, player) {
    let allFields = document.getElementsByClassName('square');
    allFields = Array.from(allFields);
    let playersFields = allFields.filter(field => {
        if(field.value.player === player.id) { return field; }
    });

    console.log('playerFields', playersFields);

    const fieldsHorizontal = getFieldsInLine(playersFields, fieldValues, 1, 0);
    console.log('fieldsHorizontal', fieldsHorizontal);
    const fieldsVertical = getFieldsInLine(playersFields, fieldValues, 0, 1);
    console.log('fieldsVertical', fieldsVertical);
    const fieldsDiagonal1 = getFieldsInDiagonal(playersFields, fieldValues, 1);
    console.log('fieldsDiagonal1', fieldsDiagonal1);
    const fieldsDiagonal2 = getFieldsInDiagonal(playersFields, fieldValues, -1);
    console.log('fieldsDiagonal2', fieldsDiagonal2);

    // if length of any of these field sets is equal or greater than gameWinningStreak: wins = true
    const winningFields = [];
    if (fieldsHorizontal.length >= gameWinningStreak) winningFields.push(...fieldsHorizontal);
    if (fieldsVertical.length >= gameWinningStreak) winningFields.push(...fieldsVertical);
    if (fieldsDiagonal1.length >= gameWinningStreak) winningFields.push(...fieldsDiagonal1);
    if (fieldsDiagonal2.length >= gameWinningStreak) winningFields.push(...fieldsDiagonal2);

    if(winningFields.length !== 0) {
        console.log('winning fields:', winningFields);
        makeOtherFieldsInvisible(winningFields);
        return true;
    } else {
        return false;
    }
}


function updateField(fieldId, player) {
    const field = document.getElementById(fieldId);
    field.classList.remove('clickable');
    field.value.player = player.id;
    field.style.backgroundColor = player.color;
    field.removeEventListener('click', playerClicksFieldHandler);
    field.innerText = player.id;
}


function checkIfAnyFieldLeft() {
    const allFields = document.getElementsByClassName('clickable');
    for (const field of allFields) {
        if (!field.value.player) {
            return true;
        }
    }
    return false;
}


// Check if the field can be chosen by the player and play full round
function playerClicksFieldHandler() {
    if(isPlayersMove && !this.value.player) {
        console.clear();
        isPlayersMove = false; // prevent the player from multiple moves before computers finish
        fieldValues = this.value;
        updateField(fieldValues.id, players[0]);

        const isWinningMove = checkIfPlayerWins(fieldValues, players[0]);
        console.log('isWinningMove: ', isWinningMove);

        if (isWinningMove) {
            // player wins
        } else if (!checkIfAnyFieldLeft()) {
            // draw
        } else {
            // all computers to make a move
            for(let computer of players.slice(1)) {
                const fields = document.getElementsByClassName('clickable');
                const randomField = randomChoice(fields);

                randomField.removeEventListener('click', playerClicksFieldHandler);
                randomField.classList.remove('clickable');
                randomField.value.player = computer.id;
                randomField.style.backgroundColor = computer.color;
                randomField.innerText = computer.id;

                const isWinningMove = checkIfPlayerWins(randomField.value, computer);

                if (isWinningMove) {
                    break; // computer wins
                } else if (!checkIfAnyFieldLeft()) {
                    break; // draw
                } else {
                    isPlayersMove = true;
                }
            }
        }
    }
}


function setNewBoard() {
    console.log('Setting new board');

    let boxIndex = 0;

    for (let row = 0; row < gameRows; row++) {
        // prepare new row
        const newRow = document.createElement('div');

        newRow.classList.add('squareContainer');

        for (let column = 0; column < gameColumns; column++) {
            // add fields in the row
            const newField = document.createElement('div');
            newField.value = {
                player: null,
                id: boxIndex,
                x: column,
                y: row,
            }
            newField.id = boxIndex++;

            newField.classList.add('square', 'clickable');

            // Adding click event listener to each game field
            // after the click, the game will run
            newField.addEventListener('click', playerClicksFieldHandler);

            newRow.appendChild(newField);
        }
        // append row to the board
        boardContainer.appendChild(newRow);
    }
}


function initiateNewGame() {
    console.clear();
    console.log('New game has started!');

    initiateVariables();
    cleanCurrentBoard();
    setNewBoard();

    menuContainer.style.backgroundColor = players[playerNumber].color;

    console.log('Game initiation finished!');

    // play computer moves until player's move
    // the rest will be handled by event listener playerClicksFieldHandler
    for(let computerBeforePlayer of players) {
        if(computerBeforePlayer.id === playerNumber) {
            players = moveComputersToEnd(playerNumber, players)
            isPlayersMove = true;
            break;
            // from now on, the game will be handled by event listeners

        } else {
            const fields = document.getElementsByClassName('clickable');
            const randomField = randomChoice(fields);
            randomField.classList.remove('clickable');
            randomField.value.player = computerBeforePlayer.id;
            randomField.style.backgroundColor = computerBeforePlayer.color;
            randomField.removeEventListener('click', playerClicksFieldHandler);
            randomField.innerText = computerBeforePlayer.id;
        }
    }

    console.log(players);
}


playButton.addEventListener('click', initiateNewGame);

// game is auto-initiated here
initiateNewGame();

// if new game button is clicked, the function above is executed once again and the game is restarted
// each round is performed through click event listeners 'playerClicksFieldHandler' when player clicks a field