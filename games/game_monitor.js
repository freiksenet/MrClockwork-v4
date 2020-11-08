
const UPDATE_INTERVAL = 10000;
const IN_LOBBY = "Game is being setup";
const STARTED = "Game is active";
var monitoredGames = {};

exports.monitorDom5Game = (game) =>
{
    const gameName = game.getName();
    monitoredGames[gameName] = setInterval(() => _updateDom5Game(game), UPDATE_INTERVAL);
};

exports.stopMonitoringDom5Game = (game) =>
{
    const gameName = game.getName();
    clearInterval(monitoredGames[gameName]);
};

function _updateDom5Game(game)
{
    const gameName = game.getName();

    console.log(`${gameName}\tupdating...`);

    if (game.isServerOnline() === false)
        return console.log(`${gameName}\tserver offline; cannot update.`);

    game.isOnlineCheck()
    .then((isOnline) =>
    {
        if (isOnline === false)
            return Promise.reject(new Error(`${gameName}\toffline; cannot update.`));

        return game.update(game);
    })
    .then((updateData) => 
    {
        console.log(`${gameName}\treceived updated data:\n
        \tcurrentStatus:\t\t${updateData.currentStatus}
        \tcurrentMsLeft:\t\t${updateData.currentMsLeft}
        \tcurrentTurnNumber:\t${updateData.currentTurnNumber}
        \tlastKnownStatus:\t${updateData.lastKnownStatus}
        \tlastKnownMsLeft:\t${updateData.lastKnownMsLeft}
        \tlastKnownTurnNumber:\t${updateData.lastKnownTurnNumber}`);

        return _announceStatusChanges(game, updateData);
    })
    .then(() => game.save())
    .catch((err) => console.log(err.message));
}

function _announceStatusChanges(game, updateData)
{
    const gameName = game.getName();
    const currentStatus = updateData.currentStatus;
    const currentTurnNumber = updateData.currentTurnNumber;

    const lastKnownStatus = updateData.lastKnownStatus;
    const lastKnownTurnNumber = updateData.lastKnownTurnNumber;

    if (_didGameStart(currentStatus, lastKnownStatus) === true)
    {
        console.log(`${gameName}\tstarted.`);
        return game.sendGameAnnouncement(`The game has started!`);
    }

    else if (_didGameRestart(currentStatus, lastKnownStatus) === true)
    {
        console.log(`${gameName}\trestarted.`);
        return game.sendGameAnnouncement(`The game has restarted; please submit your pretenders!`);
    }

    else if (_isNewTurn(currentTurnNumber, lastKnownTurnNumber) === true)
    {
        console.log(`${gameName}\tnew turn.`);
        return game.sendGameAnnouncement(`Turn ${currentTurnNumber} has arrived.`);
    }

    else if (_isRollbackTurn(currentTurnNumber, lastKnownTurnNumber) === true)
    {
        console.log(`${gameName}\trollbacked turn.`);
        return game.sendGameAnnouncement(`The game has been rollbacked to turn ${currentTurnNumber}.`);
    }

    else return Promise.resolve();
}

function _didGameStart(currentStatus, lastKnownStatus)
{
    return currentStatus === STARTED && lastKnownStatus === IN_LOBBY;
}

function _didGameRestart(currentStatus, lastKnownStatus)
{
    return currentStatus === IN_LOBBY && lastKnownStatus === STARTED;
}

function _isNewTurn(currentTurnNumber, lastKnownTurnNumber)
{
    return currentTurnNumber > lastKnownTurnNumber;
}

function _isRollbackTurn(currentTurnNumber, lastKnownTurnNumber)
{
    return currentTurnNumber < lastKnownTurnNumber;
}