# e-Dokyumento 
### Pinoy Electronic Document Management System 
![alt text](https://github.com/nelsonmaligro/e-Dokyumento/blob/master/public/images/edokyu.png)
# Overview
e-Dokyumento is an opensource Document Management System that stores, organizes, indexes, routes, and tracks
electronic documents. It automates the basic office document workflow such as receiving, filing, routing, and approving
of hard-printed documents through capturing (scanning), digitizing (OCR Reading), storing, tagging, and electronically routing 
and approving (e-signature) of documents. 

# Features
<pre><code>
  1. Intuitive document workflow - users can freely select the department/branch/group to route the document.
  2. Add file links - users can link or attach files to the main document. This is ideal for documents
                      requiring attachments such as references and enclosures
  3. Add notes or comments - users can add notes or comments to the documents during routing. This is similar to manually 
                      attaching 'Post it'.
  4. Annotations - managers and bosses can draw a line and add text into the document for correction. Upon saving the 
                  annotated document, he/she can return it to the originating department.
  5. Electronic Signature - managers and bosses can electronically sign to approve the document. Every document signed has a
                  corresponding control number for tracking and non-repudiation. This is not a PKI-based signature but can be 
                  a secure alternative next to nothing.
  6. Content Searching - Files are scanned using Optical Character Recognition (OCR) and indexed to allow users to search for files 
                  or documents through its content.
  7. Stores and indexed multiple file format - 
  </code><pre>
# Installation

# Demo
  https://34.67.81.154/
  <pre><code>
  Accounts:
  Username                        Password            Privilege           Department/Branch
   1. staff-marketing             staff@123           STAFF               MARKETING
   2. manager-finance             manager@123         MANAGER             FINANCE
   3. staff-secretary             staff@123           SECRETARY           SECRETARY-RECEIVING
   4. boss                        boss@123            GM                  G.M.
   5. boss.wannabe                boss@123            EAGM                ASST.G.M.
</code></pre>

# Note
Currently, the source code is admittedly un-structured and introduces several vulnerabilities, inconsistencies, repetitions and 
deep nested algorithms. The author welcomes critics and feedbacks from end users, co-developers, security researchers, and 
other open source collaborators.

# License
GPL
