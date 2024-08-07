document.getElementById('actionButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: doAction,
    });
  });
});

async function doAction() {
  const reportWrapper = document.getElementById('reportWrapper');
  const header = reportWrapper.querySelectorAll('div.header')[0];

  // Metadata about the report
  const dateTime = header.querySelectorAll('div.time')[0].children[0].innerText;
  const defenderTribe =
    reportWrapper.querySelectorAll('img.tribe')[0].classList[1];

  let reportKey = '';
  let firstDef = true;
  let playerName = '';
  let allianceName = '';
  let villageName = '';
  let unitCountsList = [];

  reportWrapper.querySelectorAll('div.role.defender').forEach((topLevelDiv) => {
    if (firstDef) {
      firstDef = false;
      const playerInfo =
        topLevelDiv.querySelectorAll('div.troopHeadline')[0].children[0];

      // Info about the defender
      allianceName = playerInfo.children[0].innerText;
      playerName = playerInfo.children[1].innerText;
      villageName = playerInfo.children[2].innerText;
    }

    const troopInfo =
      topLevelDiv.querySelectorAll('table')[0].children[1].children[0];

    const firstTroopName = topLevelDiv
      .querySelectorAll('table')[0]
      .children[0].children[0].querySelectorAll('td')[0].children[0].alt;

    console.log('Tribe Info: ', firstTroopName);

    // console.log('Troop Info: ', troopInfo);
    try {
      let unitCounts = {};
      let tdElements = troopInfo.querySelectorAll('td');

      unitCounts['firstTroopName'] = firstTroopName;

      for (let i = 0; i < 11; i++) {
        if (tdElements[i]) {
          unitCounts[`t${i}`] = tdElements[i].textContent.trim();
        } else {
          unitCounts[`t${i}`] = '0'; // or any default value you prefer
        }
      }

      unitCountsList.push(unitCounts);
    } catch (error) {
      console.error('Error: ', error);
    }
  });

  reportKey = `${dateTime}-${playerName}-${villageName}`;

  console.log(`Report Key: ${reportKey}`);
  console.log(`Report Time: ${dateTime}, defender Tribe: ${defenderTribe}`);
  console.log(
    `Player Name: ${playerName}, Village Name: ${villageName}, Alliance Name: ${allianceName}`,
  );
  console.log('All Units: ', unitCountsList);

  // Make the fetch request to the server with the report
  try {
    const response = await fetch('http://localhost:8080/scout/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportKey: reportKey,
        reportDate: dateTime,
        playerName: playerName,
        villageName: villageName,
        allianceName: allianceName,
        playerTribe: defenderTribe,
        troopCounts: unitCountsList,
      }),
    });
  } catch (error) {
    console.error('Error: ', error);
  }
}
