const forge = require('node-forge');
const VerifyPDFError = require('./VerifyPDFError');
const { getSignatureMeta } = require('./helpers/general');
const {
  extractSignature,
  getMessageFromSignature,
  getClientCertificate,
  checkForSubFilter,
  preparePDF,
  authenticateSignature,
  sortCertificateChain,
  isCertsExpired,
} = require('./helpers');
const { extractCertificatesDetails } = require('./certificateDetails');

module.exports = (pdf) => {
	const pdfBuffer = preparePDF(pdf);
   try {
	checkForSubFilter(pdfBuffer);
    const { signature, signedData, signatureMeta, byteRanges } = extractSignature(pdfBuffer);
    const message = getMessageFromSignature(signature);
    const {
      certificates,
      rawCapture: {
        signature: sig,
        authenticatedAttributes: attrs,
        digestAlgorithm,
      },
    } = message;
    const hashAlgorithmOid = forge.asn1.derToOid(digestAlgorithm);
    const hashAlgorithm = forge.pki.oids[hashAlgorithmOid].toLowerCase();
    const set = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SET,
      true,
      attrs,
    );
    const clientCertificate = getClientCertificate(certificates);
    const digest = forge.md[hashAlgorithm]
      .create()
      .update(forge.asn1.toDer(set).data)
      .digest()
      .getBytes();
    const validAuthenticatedAttributes = clientCertificate.publicKey.verify(digest, sig);
    if (!validAuthenticatedAttributes) {
      throw new VerifyPDFError(
        'Wrong authenticated attributes',
        VerifyPDFError.VERIFY_SIGNATURE,
      );
    }
    const messageDigestAttr = forge.pki.oids.messageDigest;
    const fullAttrDigest = attrs
      .find((attr) => forge.asn1.derToOid(attr.value[0].value) === messageDigestAttr);
    const attrDigest = fullAttrDigest.value[1].value[0].value;
    const dataDigest = forge.md[hashAlgorithm]
      .create()
      .update(signedData.toString('latin1'))
      .digest()
      .getBytes();
    const integrity = dataDigest === attrDigest;
    const sortedCerts = sortCertificateChain(certificates);
    const parsedCerts = extractCertificatesDetails(sortedCerts);
    const authenticity = authenticateSignature(sortedCerts);
    const expired = isCertsExpired(sortedCerts);
    return ({
      verified: integrity && authenticity && !expired,
      authenticity,
	  message: 'signed',
      integrity,
      expired,
      meta: { certs: parsedCerts, signatureMeta },
	  signRange: byteRanges.length,
    });
  } catch (err) {

	//Get Number of Signatures - Byte Ranges
	const byteRangeStrings = pdf.toString().match(/\/ByteRange\s*\[{1}\s*(?:(?:\d*|\/\*{10})\s+){3}(?:\d+|\/\*{10}){1}\s*]{1}/g);
	if (byteRangeStrings) {
		//const byteRangePlaceholder = byteRangeStrings.find(s => s.includes(`/${'**********'}`));
	    let byteRanges = byteRangeStrings.map(brs => brs.match(/[^[\s]*(?:\d|\/\*{10})/g));
		let signatureMeta = getSignatureMeta(pdfBuffer);
		return ({ verified: true, message: 'Multiple Signature', signRange: byteRanges.length, meta: signatureMeta });
	} else return ({ verified: false, message: err.message, signRange: 0 });

	
  }
};
