document.getElementById('actionButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: doAction,
    });
  });
});

function doAction() {
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

    let unitCounts = [];
    troopInfo.querySelectorAll('td').forEach((td) => {
      unitCounts.push(td.innerText);
    });
    unitCountsList.push(unitCounts);
  });

  reportKey = `${dateTime}-${playerName}-${villageName}`;

  console.log(`Report Key: ${reportKey}`);
  console.log(`Report Time: ${dateTime}, defender Tribe: ${defenderTribe}`);
  console.log(
    `Player Name: ${playerName}, Village Name: ${villageName}, Alliance Name: ${allianceName}`,
  );
  console.log('All Units: ', unitCountsList);

  // Retrieve the token from chrome.storage.local
  chrome.storage.local.get(['token'], function (result) {
    console.log('Token Value currently is ' + result);
    const token = result.token;

    const sheetId = '11UucshbOYq92GI-wCVFolyghNP7KlW4oPpkgM7aAJg0';
    const range = 'Sheet1!A1';
    const valueInputOption = 'USER_ENTERED';
    const values = [[reportKey]];
    const body = {
      values: values,
    };

    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=${valueInputOption}`,
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )
      .then((response) => response.json())
      .then(function (data) {
        console.log(data);
      })
      .catch((error) => console.log(error));
  });
}
