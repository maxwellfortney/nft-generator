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

  // let bufferArr = [];
  // generatedItem.forEach((item, i) => {
  //   if (gifIndices.includes(i)) {
  //   }
  // });
  let img1Buf = await sharp(generatedItem[0].filePath, {
    pages: -1,
  }).toBuffer();
  let img2Buf = await sharp(generatedItem[1].filePath, {
    pages: -1,
  }).toBuffer();

  let x = sharp(img1Buf)
    .composite([{ input: img2Buf, pages: -1 }])
    .toBuffer();

  sharp(x).webp().toFile("output.webp");
}
