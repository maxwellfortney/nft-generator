import React, { useState } from "react";
import Collapsible from "react-collapsible";

const electron = window.require("electron");
const { nativeImage } = electron;

function CollapseContainer({
  property,
  attributesArr,
  handleSetRarity,
  i,
  setLayerNumber,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const TriggerElement = () => {
    return (
      <div className="flex items-center justify-between w-full">
        <p
          className="w-full text-2xl font-bold"
          onClick={() => setIsOpen(!isOpen)}
        >
          {property.fileName}
        </p>
        <input
          type="number"
          placeholder="Layer number"
          value={property.layerNumber}
          onChange={(e) => setLayerNumber(e, property)}
        />
      </div>
    );
  };

  return (
    <Collapsible
      open={isOpen}
      triggerSibling={TriggerElement}
      className="w-full px-1 font-semibold bg-gray-200 border-2 border-black"
      openedClassName="w-full px-1 border-2 border-black font-semibold bg-gray-200"
      easing="cubic-bezier(0.4, 0, 0.2, 1)"
      transitionTime="250"
      key={property.fileName}
    >
      <div className="flex items-center justify-start w-full mr-3 overflow-y-auto">
        {attributesArr.length > 0
          ? attributesArr[i].map((attribute, j) => {
              return (
                <div
                  style={{ width: "150px", minWidth: "150px" }}
                  className="flex flex-col items-start justify-start"
                  key={`${property.fileName}-${attribute.fileName}`}
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
