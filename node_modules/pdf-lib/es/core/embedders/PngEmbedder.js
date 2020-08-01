import { __awaiter, __generator } from "tslib";
import pako from 'pako';
import PNG from 'png-ts';
/**
 * A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
 * this class borrows from:
 *   https://github.com/devongovett/pdfkit/blob/e71edab0dd4657b5a767804ba86c94c58d01fbca/lib/image/png.coffee
 */
var PngEmbedder = /** @class */ (function () {
    function PngEmbedder(png) {
        this.image = png;
        this.imageData = this.image.imgData;
        this.alphaChannel = undefined;
        this.bitsPerComponent = this.image.bits;
        this.height = this.image.height;
        this.width = this.image.width;
        this.colorSpace = this.image.colorSpace;
        // TODO: Handle the following two transparency types. They don't seem to be
        // fully handled in:
        // https://github.com/devongovett/pdfkit/blob/e71edab0dd4657b5a767804ba86c94c58d01fbca/lib/image/png.coffee
        //
        // if (this.image.transparency.grayscale)
        // if (this.image.transparency.rgb)
    }
    PngEmbedder.for = function (imageData) {
        return __awaiter(this, void 0, void 0, function () {
            var image;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PNG.load(imageData)];
                    case 1:
                        image = _a.sent();
                        return [2 /*return*/, new PngEmbedder(image)];
                }
            });
        });
    };
    PngEmbedder.prototype.embedIntoContext = function (context, ref) {
        return __awaiter(this, void 0, void 0, function () {
            var SMask, palette, ColorSpace, stream, streamRef, DecodeParms, xObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.alphaChannel) return [3 /*break*/, 4];
                        if (!this.image.transparency.indexed) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loadIndexedAlphaChannel()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        if (!this.image.hasAlphaChannel) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.splitAlphaChannel()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        SMask = this.embedAlphaChannel(context);
                        palette = this.image.palette;
                        ColorSpace = this.image.colorSpace;
                        if (palette.length !== 0) {
                            stream = context.stream(new Uint8Array(palette));
                            streamRef = context.register(stream);
                            ColorSpace = ['Indexed', 'DeviceRGB', palette.length / 3 - 1, streamRef];
                        }
                        if (!this.image.hasAlphaChannel) {
                            DecodeParms = {
                                Predictor: 15,
                                Colors: this.image.colors,
                                BitsPerComponent: this.image.bits,
                                Columns: this.image.width,
                            };
                        }
                        xObject = context.stream(this.imageData, {
                            Type: 'XObject',
                            Subtype: 'Image',
                            BitsPerComponent: this.image.bits,
                            Width: this.image.width,
                            Height: this.image.height,
                            Filter: 'FlateDecode',
                            SMask: SMask,
                            DecodeParms: DecodeParms,
                            ColorSpace: ColorSpace,
                        });
                        if (ref) {
                            context.assign(ref, xObject);
                            return [2 /*return*/, ref];
                        }
                        else {
                            return [2 /*return*/, context.register(xObject)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PngEmbedder.prototype.embedAlphaChannel = function (context) {
        if (!this.alphaChannel)
            return undefined;
        var xObject = context.flateStream(this.alphaChannel, {
            Type: 'XObject',
            Subtype: 'Image',
            Height: this.image.height,
            Width: this.image.width,
            BitsPerComponent: 8,
            ColorSpace: 'DeviceGray',
            Decode: [0, 1],
        });
        return context.register(xObject);
    };
    PngEmbedder.prototype.splitAlphaChannel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, colors, bits, width, height, pixels, colorByteSize, pixelCount, imageData, alphaChannel, pixelOffset, rgbOffset, alphaOffset, length;
            return __generator(this, function (_b) {
                _a = this.image, colors = _a.colors, bits = _a.bits, width = _a.width, height = _a.height;
                pixels = this.image.decodePixels();
                colorByteSize = (colors * bits) / 8;
                pixelCount = width * height;
                imageData = new Uint8Array(pixelCount * colorByteSize);
                alphaChannel = new Uint8Array(pixelCount);
                pixelOffset = 0;
                rgbOffset = 0;
                alphaOffset = 0;
                length = pixels.length;
                while (pixelOffset < length) {
                    imageData[rgbOffset++] = pixels[pixelOffset++];
                    imageData[rgbOffset++] = pixels[pixelOffset++];
                    imageData[rgbOffset++] = pixels[pixelOffset++];
                    alphaChannel[alphaOffset++] = pixels[pixelOffset++];
                }
                this.imageData = pako.deflate(imageData);
                this.alphaChannel = alphaChannel;
                return [2 /*return*/];
            });
        });
    };
    PngEmbedder.prototype.loadIndexedAlphaChannel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var transparency, pixels, alphaChannel, idx, len;
            return __generator(this, function (_a) {
                transparency = this.image.transparency.indexed;
                pixels = this.image.decodePixels();
                alphaChannel = new Uint8Array(this.image.width * this.image.height);
                for (idx = 0, len = pixels.length; idx < len; idx++) {
                    alphaChannel[idx] = transparency[pixels[idx]];
                }
                this.alphaChannel = alphaChannel;
                return [2 /*return*/];
            });
        });
    };
    return PngEmbedder;
}());
export default PngEmbedder;
//# sourceMappingURL=PngEmbedder.js.map