require('shelljs/global');

var fileInfo = exec('pdfinfo uploads/digital-culture/digital-culture.pdf').stdout;
// console.log(util.inspect(fileInfo, false, null));
console.log(fileInfo);
console.log(/Pages:\s+(\d+)/g.exec(fileInfo)[1]);


// var testString = "Pages:     34";
// console.log(/Pages:\s+(\d+)/g.exec(testString)[1]);