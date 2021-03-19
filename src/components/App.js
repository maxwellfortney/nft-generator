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
    fs.readdirSync(parentDir).forEach(async (file, i) => {
      if (file === ".DS_Store") return;

      maxUniques =
        maxUniques * fs.readdirSync(path.join(parentDir, file)).length;

      properties.push(file);
      attributes[i] = [];
      fs.readdirSync(path.join(parentDir, file)).forEach((subFile, j) => {
        if (subFile === ".DS_Store") return;

        attributes[i].push({
          fileName: subFile,
          filePath: path.join(parentDir, file, subFile),
          weight: (
            (1 / fs.readdirSync(path.join(parentDir, file)).length) *
            100
          ).toFixed(3),
        });
      });
    });

    setPropertiesArr((propertiesArr) => [...propertiesArr, ...properties]);
    setAttributesArr((attributesArr) => [...attributesArr, ...attributes]);
    setMaxUniqueItems(maxUniques);
    setUserRequestedItems(maxUniques * 0.5);
    setIsLoadingLocalImages(false);

    console.log(attributesArr);
    console.log(propertiesArr);
  }

  async function selectInputFolder() {
    setIsLoadingLocalImages(true);
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

      await parseFolders(dir);
    } else {
      setIsLoadingLocalImages(false);
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
          propertyName: property,
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
    setIsGenerating(false);
    setGeneratedItems(allGenerated);
    generateImage(allGenerated[0]);
  }, [isGenerating]);

  return (
    <div className="flex flex-col items-center justify-center w-11/12 h-full">
      {inputDir.length > 0 ? (
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
                    key={property}
                    property={property}
                    attributesArr={attributesArr}
                    handleSetRarity={(e, i, j) => handleSetRarity(e, i, j)}
                    i={i}
                  />
                );
              })}
              <button
                onClick={generateNFTs}
                className="px-3 py-2 my-10 font-semibold text-white bg-indigo-400 rounded-md"
              >
                {isGenerating ? <div className="loader" /> : "Calculate"}
              </button>
              {generatedItems.length > 0 ? (
                <>
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
            <button
              className="p-4 font-semibold border-2 border-black rounded-md"
              onClick={selectInputFolder}
            >
              Choose the input folder
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default App;
