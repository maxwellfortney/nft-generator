import React, { useState } from "react";
import Collapsible from "react-collapsible";

const electron = window.require("electron");
const { nativeImage } = electron;

function CollapseContainer({ property, attributesArr, handleSetRarity, i }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      className="w-full px-2 py-3 font-semibold bg-gray-200 border-2 border-black"
      openedClassName="w-full px-2 py-3 border-2 border-black font-semibold bg-gray-200"
      key={property}
      trigger={property}
      onOpening={() => setIsOpen(true)}
      onCloseing={() => setIsOpen(false)}
    >
      <div className="flex items-center justify-start w-full mr-3 overflow-y-auto">
        {attributesArr.length > 0
          ? attributesArr[i].map((attribute, j) => {
              return (
                <div
                  style={{ width: "150px", minWidth: "150px" }}
                  className="flex flex-col items-start justify-start"
                  key={`${property}-${attribute.fileName}`}
                >
                  {isOpen ? (
                    <img
                      src={nativeImage
                        .createFromPath(attribute.filePath)
                        .toDataURL()}
                      className="w-24"
                      alt=""
                    />
                  ) : null}
                  <p>{attribute.fileName} </p>
                  <input
                    className="w-10/12 px-1"
                    type="number"
                    placeholder="Rarity from 0-100"
                    value={attribute.weight}
                    onChange={(e) => handleSetRarity(e, i, j)}
                  />
                </div>
              );
            })
          : null}
      </div>
    </Collapsible>
  );
}

export default CollapseContainer;
