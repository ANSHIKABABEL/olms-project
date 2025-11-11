// check-bcrypt.js
const bcrypt = require('bcrypt');

const plain = '1234';           // the password you're trying
const storedHash = '$2b$10$WKb6nFPAmrt7nuzWCL2uCOj57wjI61HbCPyh5llNTITpwwlE8T83G'
;   // <--- paste the password hash from the admin document here

bcrypt.compare(plain, storedHash)
  .then(ok => {
    console.log('bcrypt.compare result:', ok);
  })
  .catch(err => {
    console.error('bcrypt error:', err);
  });
