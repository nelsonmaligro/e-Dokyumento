# e-Dokyumento 
### Pinoy Electronic Document Management System 
![alt text](https://github.com/nelsonmaligro/e-Dokyumento/blob/master/public/images/edokyu.png)
# Overview
e-Dokyumento is an opensource Document Management System that stores, organizes, indexes, routes, and tracks
electronic documents. It automates the basic office document workflow such as receiving, filing, routing, and approving
of hard-printed documents through capturing (scanning), digitizing (OCR Reading), storing, tagging, and electronically routing 
and approving (e-signature) of documents. 

# Features
  ####1. Document routing and workflow 
                - users can freely select the department or branch to route the document.
  ####2. Add file links to the document 
                - users can link or attach files to the main document. This is ideal for documents requiring attachments 
                  such as references and enclosures
  ####3. Add notes or comments 
                - users can add notes or comments to the documents during routing. This is similar to manually attaching 'Post it'.
  ####4. Annotations 
                - managers and bosses can draw and add text into the document when correcting. Upon saving of the annotated document, 
                  he/she can return it to the originator.
  5. Electronic Signature - managers and bosses can electronically sign to approve the document. Every document signed has a
                  corresponding control number for tracking and non-repudiation. This is not a PKI-based signature but can be 
                  a good alternative next to nothing.
  6. Content Searching - Files are scanned using Optical Character Recognition (OCR) and indexed to allow searching of files 
                  or documents through its content.
  7. Store and index multiple file format - Upload, store, and open documents with the following following format: pdf, docx, xlsx,
                  pptx, txt, and odt.
  8. Graphical monitoring of document routing - routed documents are graphically mapped through line chart and pie chart. This 
                  allows effective monitoring of office communications.
  9. Edit document through mapped drive - document can be edited through mapped drive or SMB shared drive.
  10. Send document to other users - documents can be sent directly to users much like an email. This is ideal for documents to
                be internally communicated between the staff and manager within the department.
  11. 

# Installation
  Download the ISO file from Sourceforge.net

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

# Roadmap


# Note
Currently, the source code is admittedly un-structured and introduces several vulnerabilities, inconsistencies, repetitions and 
deep nested algorithms. The author welcomes critics and feedbacks from end users, co-developers, security researchers, and 
other open source collaborators.

# License
GPL
