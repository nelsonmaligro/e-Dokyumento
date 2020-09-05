"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getPagesDictionaryRef;

var _SignPdfError = _interopRequireDefault(require("../../SignPdfError"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {Object} info As extracted from readRef()
 */
function getPagesDictionaryRef(info) {
  // const pagesRefRegex = new RegExp('\\/Type\\s*\\/Catalog\\s*\\/Pages\\s+(\\d+\\s\\d+\\sR)', 'g');
  // const match = pagesRefRegex.exec(info.root);

  // if (match === null) {
  //   throw new _SignPdfError.default('Failed to find the pages descriptor. This is probably a problem in node-signpdf.', _SignPdfError.default.TYPE_PARSE);
  // }

  // return match[1];

  try {
    const pages = info.root.split('Pages')[1].split('/Names')[0].trim()
    return pages
  } catch (e) {
      console.log(e)
      throw new SignPdfError(
          'Failed to find the pages descriptor. This is probably a problem in node-signpdf.',
          SignPdfError.TYPE_PARSE,
      );
  }
}