const sharp = require("sharp");
const path = require("path");

function checkContainsGifs(arr) {
  let indicesArr = [];
  arr.some((element, i) => {
    if (element.filePath.includes(".gif")) {
      indicesArr.push(i);
    }
  });
  return indicesArr;
}

export async function generateImage(generatedItem, i, outputDir) {
  // console.log(generatedItem);
  // let gifIndices = checkContainsGifs(generatedItem);
  // if(gifIndices.length > 0 ) {
  //   verifyGifs(generatedItem, gifIndices);
  // }
  // console.log(gifIndices);

  generatedItem = generatedItem.sort((a, b) => {
    return a.layerNumber - b.layerNumber;
  });

  // console.log(generatedItem);

  try {
    sharp(generatedItem[0].filePath, { pages: -1 })
      .composite(
        generatedItem.slice(1).map((item, i) => {
          return { input: item.filePath, pages: -1 };
        })
      )
      .toFile(path.join(outputDir, "images", `${i}.gif`));
  } catch (e) {
    console.log(e);
  }
}

// function verifyGifs (generatedItem, gifIndices) {
//   if(gifIndices.length !== generateImage.length) {
//     // There are gifs and images
//     generateImage.forEach((item, i) => {
//       if(gifIndices.includes(i)) {

//       }
//     })
//   }
// }
