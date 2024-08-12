// Event listener setup
document.getElementById("actionButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: doAction,
    });
  });
});

async function doAction() {
  // Utility functions
  function getDateTime(header) {
    return header.querySelectorAll("div.time")[0].children[0].innerText;
  }

  function getDefenderTribe(reportWrapper) {
    return reportWrapper.querySelectorAll("img.tribe")[0].classList[1];
  }

  function getPlayerInfo(topLevelDiv) {
    const playerInfoElem =
      topLevelDiv.querySelectorAll("div.troopHeadline")[0].children[0];
    return {
      allianceName: playerInfoElem.children[0].innerText,
      playerName: playerInfoElem.children[1].innerText,
      villageName: playerInfoElem.children[2].innerText,
    };
  }

  function getUnitCounts(topLevelDiv) {
    try {
      const troopInfo =
        topLevelDiv.querySelectorAll("table")[0].children[1].children[0];
      const firstTroopName = topLevelDiv
        .querySelectorAll("table")[0]
        .children[0].children[0].querySelectorAll("td")[0].children[0].alt;
      const tdElements = troopInfo.querySelectorAll("td");
      let unitCounts = { firstTroopName };

      for (let i = 0; i < 11; i++) {
        unitCounts[`t${i}`] = tdElements[i]
          ? tdElements[i].textContent.trim()
          : "0";
      }

      return unitCounts;
    } catch (error) {
      console.error("Error in getUnitCounts: ", error);
      return null;
    }
  }

  function extractKarteLinks(htmlString) {
    const pattern = /href="(\/karte\.php\?d=\d+)"/g;
    const matches = [];
    let match;

    while ((match = pattern.exec(htmlString)) !== null) {
      matches.push(match[1]);
    }

    return JSON.stringify(matches);
  }

  function getVillageLink(karteLinks) {
    try {
      const parsedKarteLinks = JSON.parse(karteLinks);
      if (parsedKarteLinks.length >= 2) {
        return parsedKarteLinks[1];
      } else if (parsedKarteLinks.length === 1) {
        return parsedKarteLinks[0];
      } else {
        console.log("No Village Links found.");
        return null;
      }
    } catch (error) {
      console.error("Error in getVillageLink: ", error);
      return null;
    }
  }

  function logDetails(
    reportKey,
    dateTime,
    defenderTribe,
    playerInfo,
    unitCountsList,
    villageLink,
  ) {
    console.log(`Report Key: ${reportKey}`);
    console.log(`Report Time: ${dateTime}, defender Tribe: ${defenderTribe}`);
    console.log(
      `Player Name: ${playerInfo.playerName}, Village Name: ${playerInfo.villageName}, Alliance Name: ${playerInfo.allianceName}`,
    );
    console.log("All Units: ", unitCountsList);
    console.log("Village Link: ", villageLink);
  }

  function extractResources(report) {
    // Check if resources section exists
    const resourcesRow = report
      .querySelector("table.additionalInformation")
      .children[0].children[0].querySelector("td");
    console.log(resourcesRow);

    if (!resourcesRow) {
      console.log("Resources section not found");
      return null;
    }

    // Extract resources
    const resourceCells = resourcesRow.querySelectorAll(
      ".resourceWrapper .inlineIcon.resources .value",
    );
    if (resourceCells.length === 0) {
      console.log("Resources data not found");
      return null;
    }

    const resources = {
      wood: resourceCells[0]
        ? parseInt(resourceCells[0].textContent.trim())
        : 0,
      clay: resourceCells[1]
        ? parseInt(resourceCells[1].textContent.trim())
        : 0,
      iron: resourceCells[2]
        ? parseInt(resourceCells[2].textContent.trim())
        : 0,
      crop: resourceCells[3]
        ? parseInt(resourceCells[3].textContent.trim())
        : 0,
      crannyCoverage: resourceCells[4]
        ? parseInt(resourceCells[4].textContent.trim())
        : 0,
      resourcesAvailable: resourceCells[5]
        ? parseInt(resourceCells[5].textContent.trim())
        : 0,
    };

    return resources;
  }

  function extractInformation(report) {
    // Check if resources section exists
    const resourcesRow = report
      .querySelector("table.additionalInformation")
      .children[0].children[0].querySelector("td");

    if (!resourcesRow) {
      console.log("Resources section not found");
      return null;
    }

    // Extract resources
    const resourceCells = resourcesRow.querySelectorAll(
      ".resourceWrapper .inlineIcon.resources .value",
    );
    if (resourceCells.length === 0) {
      console.log("Resources data not found");
      return null;
    }

    let info = {};

    try {
      info = { ...info, firstInfo: resourceCells[0].textContent };
    } catch (error) {
      console.error("Error in extractInformation: ", error);
    }

    try {
      info = { ...info, secondInfo: resourceCells[1].textContent };
    } catch (error) {
      console.error("Error in extractInformation: ", error);
    }

    try {
      info = { ...info, thirdInfo: resourceCells[2].textContent };
    } catch (error) {
      console.error("Error in extractInformation: ", error);
    }

    return info;
  }

  async function sendReportData(reportData) {
    try {
      const response = await fetch(
        "https://boink-op-planning.mesgexchange.io/scout/report",
        //"http://localhost:8080/scout/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reportData),
        },
      );

      if (!response.ok) {
        console.error("Failed to send report data:", response.statusText);
      }
    } catch (error) {
      console.error("Error in sendReportData: ", error);
    }
  }

  // MAIN EXECUTION

  const reportWrapper = document.getElementById("reportWrapper");
  console.log("reportWrapper: ", reportWrapper);
  const header = reportWrapper.querySelectorAll("div.header")[0];
  console.log("header: ", header);

  // Extract report metadata
  const dateTime = getDateTime(header);
  console.log("DateTime: ", dateTime);
  const defenderTribe = getDefenderTribe(reportWrapper);
  console.log("Defender Tribe: ", defenderTribe);

  // Initialize variables
  let firstDef = true;
  let playerInfo = {};
  let unitCountsList = [];

  // Process defender information
  reportWrapper.querySelectorAll("div.role.defender").forEach((topLevelDiv) => {
    if (firstDef) {
      firstDef = false;
      playerInfo = getPlayerInfo(topLevelDiv);
      console.log("Player Info: ", playerInfo);
    }

    const unitCounts = getUnitCounts(topLevelDiv);
    if (unitCounts) {
      unitCountsList.push(unitCounts);
    }
  });

  // Extract Karte links and construct report key and link
  const reportLink = document.location.href;
  const karteLinks = extractKarteLinks(document.body.innerHTML);
  const villageLink = getVillageLink(karteLinks);
  const reportKey = `${dateTime}-${playerInfo.playerName}-${playerInfo.villageName}`;

  // Log details
  logDetails(
    reportKey,
    dateTime,
    defenderTribe,
    playerInfo,
    unitCountsList,
    villageLink,
  );

  const reportType = reportWrapper
    .querySelector("table.additionalInformation")
    .children[0].children[0].querySelector("th").innerText;
  console.log("Report Type: ", reportType);

  // Attempt to log resources or info
  let resources = {};
  let information = {};

  try {
    if (reportType === "Information") {
      information = extractInformation(reportWrapper);
    } else {
      resources = extractResources(reportWrapper);
    }
  } catch (error) {
    console.error("Error in info section: ", error);
  }
  console.log("Resources: ", resources);
  console.log("Information: ", information);

  // Send report data
  await sendReportData({
    reportKey,
    reportLink,
    reportType,
    reportDate: dateTime,
    playerName: playerInfo.playerName,
    villageName: playerInfo.villageName,
    villageLink,
    allianceName: playerInfo.allianceName,
    playerTribe: defenderTribe,
    troopCounts: unitCountsList,
    resources,
    information,
  });
}
