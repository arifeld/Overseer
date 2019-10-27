
const fs = require("fs")
const path = require("path")
module.exports = {

    // getServerInfo(msg)
    // Retrieves the JSON file for the specified message.
    // Returns the JSON array, and, additionally, the scope above (server).
    getServerInfo(msg){
        var fileLocation = path.join(__dirname, "../servers/", msg.guild.id + ".JSON")
        if (!fs.existsSync(fileLocation)){
            fs.writeFileSync( fileLocation, '{"guild": {}}', {encoding: "utf8", flag: "wx" } ) // create the file if it doesn't already exist and write some JSON to it to stop errors.
        }
        var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.
        return server.guild
    },


    // saveServerInfo(msg, serverInfo, successCallback)
    // Attempts to save the provided serverInfo to the server file.
    // On success, calls the provided callback.
    // On failure, calls a non-changeable error.
    saveServerInfo(msg, serverInfo){
        var fileLocation = path.join(__dirname, "../servers/", msg.guild.id + ".JSON")

        fs.writeFile(fileLocation, JSON.stringify({"guild": serverInfo}, null, 2), (err) => {
            if (err){
                console.error(error)
                return msg.reply("an unexpected error occured whilst trying to save. This **will** result in data loss.\nTry repeating the command. If that fails, please contact @Feldma#1776.\nPlease give him the following code: " + msg.guild.id)
            }
        })
    },
}
