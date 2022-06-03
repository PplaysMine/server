# SELab Android App Server

# Content
- <a href="#what">What it does</a>
- <a href="#howTo">How to start</a>
- <a href="#config">Configuration</a>
    - <a href="#newConfig">Creating a new configuration</a>
    - <a href="#configValues">The config values explained</a>
# What it does<br id="what">
This is a SSL server to handle user authentication & store data in a mysql database.

# How to start<br id="howTo">
Simply run `node server.js`<br>
The server needs root privileges, so if you are on linux, start the server with `sudo node server.js`

# Configuration<br id="config">
## Creating a new configuration<br id="newConfig">
Create a new file named `config.js` and copy the contents of the file `exampleConfig.js` to your newly created file.
## The config values explained<br id="configValues">
- The values for `config.ssl.keyLoc` and `config.ssl.certLoc` should be absolute paths to the SSL key and the SSL certificate respectively.
- The values for `config.db.host`, `config.db.user` and `config.db.pass` should contain the login data for the mysql database
- `config.db.dbName` contains the name of a database
- `config.server.port` contains the port the server is listening on. This is the port you want to send your data to
- `config.server.swaggerPort` contains the port for the swagger documentation. <b>This port has to be different from `config.server.port`!</b>
- `config.server.tokenSecret` contains any string of characters to validate your jwt token
- `config.server.url` contains the base url of your service, which will be displayed in the swagger docs
- `config.docs.user` and `config.docs.pass` contain the credentials for the password protected swagger documentation