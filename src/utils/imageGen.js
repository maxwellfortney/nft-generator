const sharp = require("sharp");

function checkContainsIndices(arr) {
  let indicesArr = [];
  arr.some((element, i) => {
    if (element.filePath.includes(".gif")) {
      indicesArr.push(i);
    }
  });
  return indicesArr;
}

export async function generateImage(generatedItem) {
  console.log(generatedItem);
  let gifIndices = checkContainsIndices(generatedItem);

  generatedItem = generatedItem.sort((a, b) => {
    return a.layerNumber - b.layerNumber;
  });

  sharp(generatedItem[0].filePath)
    .composite(
      generatedItem.map((item, i) => {
        return { input: item.filePath };
      })
    )
    .toFile("output.png");
}
