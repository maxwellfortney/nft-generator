import React, { useEffect, useState } from "react";

const electron = window.require("electron");
const { remote, nativeImage } = electron;
const { dialog } = remote;
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const chance = require("chance").Chance();

import "../assets/css/App.css";
import CollapseContainer from "./CollapseContainer";
import { generateImage } from "../utils/imageGen";

function App() {
  const [inputDir, setInputDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [metadataBaseURL, setMetadataBaseUrl] = useState("");

  const [shouldGoNextPage, setShouldGoNextPage] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLocalImages, setIsLoadingLocalImages] = useState(false);

  const [generatedItems, setGeneratedItems] = useState([]);
  const [maxUniqueItems, setMaxUniqueItems] = useState(0);
  const [userRequestedItems, setUserRequestedItems] = useState(0);

  const [propertiesArr, setPropertiesArr] = useState([]);
  const [attributesArr, setAttributesArr] = useState([]);

  async function parseFolders(parentDir) {
    let maxUniques = 1;

    let properties = [];
    let attributes = [];
    let hasDSStore = false;
    fs.readdirSync(parentDir).forEach(async (file, i) => {
      if (file === ".DS_Store") {
        hasDSStore = true;
        return;
      }

      maxUniques =
        maxUniques *
        (fs.readdirSync(path.join(parentDir, file)).length -
          (hasDSStore ? 1 : 0));

      properties.push({ fileName: file, layerNumber: i });

      attributes[i] = [];
      let hasSubDSStore = false;
      fs.readdirSync(path.join(parentDir, file)).forEach((subFile, j) => {
        if (subFile === ".DS_Store") {
          hasDSStore = true;
          return;
        }

        attributes[i].push({
          fileName: subFile,
          filePath: path.join(parentDir, file, subFile),
          weight: (
            (1 /
              (fs.readdirSync(path.join(parentDir, file)).length -
                (hasSubDSStore ? 1 : 0))) *
            100
          ).toFixed(3),
        });
      });
    });

    properties = properties.filter(function (el) {
      return el != null;
    });

    attributes = attributes.filter(function (el) {
      return el != null;
    });

    console.log(properties);
    console.log(attributes);

    setPropertiesArr((propertiesArr) => [...propertiesArr, ...properties]);
    setAttributesArr((attributesArr) => [...attributesArr, ...attributes]);
    setMaxUniqueItems(maxUniques);
    setUserRequestedItems(maxUniques * 0.5);
    setIsLoadingLocalImages(false);

    console.log(attributesArr);
    console.log(propertiesArr);
  }

  async function selectInputFolder() {
    const dir = await dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then((res) => {
        if (res.filePaths.length === 1) {
          return res.filePaths[0];
        }
        return null;
      });

    if (dir !== null) {
      console.log(dir);
      setInputDir(dir);

      if (outputDir.length > 0) {
        await parseFolders(dir);
      } else {
        console.log("Waiting for output dir");
      }
    } else {
      console.log("No folder selected");
    }
  }

  async function createFolders(dir) {
    if (!fs.existsSync(path.join(dir, "images"))) {
      fs.mkdirSync(path.join(dir, "images"));
    }
    if (!fs.existsSync(path.join(dir, "json"))) {
      fs.mkdirSync(path.join(dir, "json"));
    }
  }

  async function selectOutputFolder() {
    const dir = await dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then((res) => {
        if (res.filePaths.length === 1) {
          return res.filePaths[0];
        }
        return null;
      });

    if (dir !== null) {
      setOutputDir(dir);
      await createFolders(dir);

      if (inputDir.length > 0) {
        await parseFolders(inputDir);
      } else {
        console.log("Waiting for input dir");
      }
    } else {
      console.log("No folder selected");
    }
  }

  async function handleSetRarity(e, i, j) {
    setAttributesArr(
      attributesArr.map((x, _i) => {
        if (_i === i) {
          x.map((y, _j) => {
            if (_j === j) {
              y.weight = e.target.value;
            }
            return y;
          });
        }
        return x;
      })
    );
  }

  async function generateNFTs() {
    setIsGenerating(true);
  }

  function alreadyExists(arr, item) {
    let alreadyExists = false;
    arr.forEach((x, i) => {
      if (_.isEqual(x, item)) {
        alreadyExists = true;
      }
    });

    console.log(alreadyExists);
    console.log(arr);
    return alreadyExists;
  }

  useEffect(() => {
    if (!isGenerating) return;

    let allGenerated = [];

    for (let z = 0; z < userRequestedItems; z++) {
      let nft = [];
      propertiesArr.forEach((property, i) => {
        let chosenRandom = chance.weighted(
          attributesArr[i].map((attribute) => {
            return attribute.filePath;
          }),
          attributesArr[i].map((attribute) => {
            return parseFloat(attribute.weight);
          })
        );

        // let filePath = "";
        // attributesArr[i].some((attribute) => {
        //   if (attribute.fileName === chosenRandom) {
        //     filePath = attribute.filePath;
        //     return;
        //   }
        // });

        nft.push({
          propertyName: property.fileName,
          layerNumber: property.layerNumber,
          value: chosenRandom.split("\\").pop().split("/").pop().split(".")[0],
          filePath: chosenRandom,
        });
      });

      if (alreadyExists(allGenerated, nft) === false) {
        console.log(nft);
        allGenerated.push(nft);
      } else {
        z--;
      }
    }

    console.log(allGenerated);

    setGeneratedItems(allGenerated);
    allGenerated.forEach(async (item, i) => {
      await generateImage(item, i, outputDir);
      await saveJSONMetadata(item, i);
    });

    generatePercentages(allGenerated);

    setIsGenerating(false);
  }, [isGenerating]);

  async function generatePercentages(allGenerated) {
    let totalCounts = [];
    let jsonObj = [];

    allGenerated[0].forEach((attribute, i) => {
      totalCounts[attribute.propertyName] = [];
    });

    allGenerated.forEach((item, i) => {
      item.forEach((attribute, j) => {
        totalCounts[attribute.propertyName].push(attribute.value);
      });
    });

    allGenerated[0].forEach((attribute, i) => {
      const totalItems = totalCounts[attribute.propertyName].length;
      const uniqueItems = [...new Set(totalCounts[attribute.propertyName])];

      uniqueItems.forEach((currAttribute) => {
        const numItems = totalCounts[attribute.propertyName].filter(
          (color) => color === currAttribute
        );
        jsonObj.push({
          attributeName: currAttribute,
          percent: (numItems.length * 100) / totalItems,
        });
      });
    });

    console.log(jsonObj);

    fs.writeFileSync(
      path.join(outputDir, "json", "attribute-percentages.json"),
      JSON.stringify(jsonObj)
    );
  }

  async function saveJSONMetadata(item, i) {
    let jsonObj = {
      attributes: [],
    };
    let isGIF = false;
    item.forEach((attribute, j) => {
      jsonObj.attributes.push({
        trait_type: attribute.propertyName,
        value: attribute.value,
      });

      if (attribute.filePath.includes(".gif")) {
        isGIF = true;
      }
    });

    jsonObj.image = `${metadataBaseURL}${
      metadataBaseURL.slice(-1) === "/" ? "" : "/"
    }images/${i}${isGIF ? ".gif" : ".png"}`;

    let jsonItemString = JSON.stringify(jsonObj);

    fs.writeFileSync(path.join(outputDir, "json", `${i}.json`), jsonItemString);
  }

  async function setLayerNumber(e, property) {
    setPropertiesArr(
      propertiesArr.map((x, _i) => {
        if (x.fileName === property.fileName) {
          x.layerNumber = parseInt(e.target.value);
        }
        return x;
      })
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-11/12 h-full">
      {outputDir.length > 0 &&
      inputDir.length > 0 &&
      metadataBaseURL.length > 0 &&
      shouldGoNextPage ? (
        <div
          style={{
            height: "95%",
            width: "95%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <div className="flex items-center w-full mb-2">
            <input
              value={userRequestedItems}
              max={maxUniqueItems}
              placeholder="Enter your desired number to output"
              type="number"
              onChange={(e) => setUserRequestedItems(parseInt(e.target.value))}
              className="p-2 mr-2 border-2 border-black"
            ></input>
            <p>
              MUST BE UNDER {maxUniqueItems}, if == {maxUniqueItems} rarity is
              the same for each accessories of a type
            </p>
          </div>
          {propertiesArr.length > 0 ? (
            <>
              {propertiesArr.map((property, i) => {
                return (
                  <CollapseContainer
                    key={property.fileName}
                    property={property}
                    attributesArr={attributesArr}
                    handleSetRarity={(e, i, j) => handleSetRarity(e, i, j)}
                    i={i}
                    setLayerNumber={(e, property) =>
                      setLayerNumber(e, property)
                    }
                  />
                );
              })}
              <button
                onClick={generateNFTs}
                className="px-3 py-2 my-10 font-semibold text-white bg-indigo-400 rounded-md"
              >
                {isGenerating ? <div className="loader" /> : "Calculate"}
              </button>
              {generatedItems.length > 0 && !isGenerating ? (
                <>
                  <p>DONT CLOSE UNTIL YOU VERIFY OUTPUT FOLDER IS DONE</p>
                  <div className="flex items-center justify-start w-full overflow-y-auto">
                    {generatedItems.map((item, i) => {
                      return (
                        <div
                          className="flex flex-col p-2 mb-2 border-2 border-black"
                          key={`${i}- ${item.propertyName}`}
                        >
                          {item.map((attribute, j) => {
                            return (
                              <div
                                className="flex justify-between flex-none"
                                key={`${i}-${j}-${attribute?.propertyName}-${attribute?.fileName}`}
                              >
                                <p className="mr-5 text-sm font-semibold">
                                  {attribute?.propertyName}:
                                </p>
                                <p className="text-sm whitespace-nowrap flex-nowrap">
                                  {attribute?.value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <p>Nothing</p>
          )}
        </div>
      ) : (
        <>
          {isLoadingLocalImages ? (
            <div className="loader"></div>
          ) : (
            <div className="flex flex-col">
              <button
                className="p-4 mb-3 font-semibold border-2 border-black rounded-md"
                onClick={selectInputFolder}
              >
                {inputDir.length > 0 ? inputDir : "Choose the INPUT folder"}
              </button>
              <button
                className="p-4 mb-3 font-semibold border-2 border-black rounded-md"
                onClick={selectOutputFolder}
              >
                {outputDir.length > 0 ? outputDir : "Choose the OUTPUT folder"}
              </button>
              <input
                type="text"
                className="p-2 mb-3 border-2 border-black rounded-md"
                onChange={(e) => setMetadataBaseUrl(e.target.value)}
                value={metadataBaseURL}
                placeholder="Input metadata base URL."
              />
              {outputDir.length > 0 &&
              inputDir.length > 0 &&
              metadataBaseURL.length > 0 ? (
                <button
                  className="p-4 mt-3 font-semibold bg-indigo-500 border-2 border-black rounded-md"
                  onClick={() => setShouldGoNextPage(true)}
                >
                  Next
                </button>
              ) : (
                <p className="mt-3 font-semibold text-center text-red-500">
                  Please input required fields above
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
