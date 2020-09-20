const tls = require('tls');
const fs = require('fs');
const forge = require('node-forge');
const rootCAs = require('./rootCAs');


const getRootCAs = () => tls.rootCertificates || rootCAs;

const verifyRootCerts = (chainRootInForgeFormat) => !!getRootCAs()
  .find((rootCAInPem) => {
    try {
      const rootCAInForgeCert = forge.pki.certificateFromPem(rootCAInPem);
	  console.log(rootCAInForgeCert.issued(chainRootInForgeFormat));
      return forge.pki.certificateToPem(chainRootInForgeFormat) === rootCAInPem
      || rootCAInForgeCert.issued(chainRootInForgeFormat);
    } catch (e) {
      return false;
    }
  });
const verifyRootCert = (chainRootInForgeFormat) => {
	let retIssued = false;
	let disFiles = fs.readdirSync('./controllers/verify/helpers/CAcert/');
	disFiles.forEach((files)=>{
		if (files.includes('.crt')){
			
			let ca = [];
			//let getPEM = fs.readFileSync('./controllers/verify/helpers/CAcert/'+files,'utf-8');
			let chain = fs.readFileSync('./controllers/verify/helpers/CAcert/'+files, 'utf-8');
			chain = chain.split("\n");
			let cert = [];
			try{
				chain.forEach((line)=>{
					cert.push(line);
					if (line.toUpperCase().includes('-END CERTIFICATE-')) {
						ca.push(cert.join("\n"));
						cert = [];
					}
				});
				ca.forEach((getPEM)=>{
					try{
						let disCert = forge.pki.certificateFromPem(getPEM);
						if (disCert.issued(chainRootInForgeFormat)) retIssued = true; 
					}catch(err){};
				});
			}catch(err){}
		}
	});
	return retIssued;
}
const verifyCaBundle = (certs) => !!certs
  .find((cert, i) => certs[i + 1] && certs[i + 1].issued(cert));

const isCertsExpired = (certs) => !!certs
  .find(({ validity: { notAfter, notBefore } }) => notAfter.getTime() < Date.now()
  || notBefore.getTime() > Date.now());
const authenticateSignature = (certs) => verifyRootCert(certs[0]);
/*
const authenticateSignature = (certs) => verifyCaBundle(certs)
&& verifyRootCert(certs[certs.length - 1]);
*/
module.exports = {
  authenticateSignature,
  verifyCaBundle,
  verifyRootCert,
  isCertsExpired,
};
