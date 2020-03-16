var toPdf = require("./")
var fs = require("fs")

var word = fs.readFileSync("./test.docx")

toPdf(word).then(
  (buffer) => {
    fs.writeFileSync("./test.pdf", buffer)
  }, (err) => {
    console.log(err)
  }
)
