
const fs = require("fs")
const path = require("path")
const {RichEmbed} = require("discord.js")

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

    // Argument types for custom argument handling
    memberArg: {
        key: "member",
        prompt: "please enter a valid member.",
        type: "member",
    },

    userArg: {
        key: "user",
        prompt: "please enter a valid user.",
        type: "user"
    },

    integerArg: {
        key: "integer",
        prompt: "please enter a valid integer.",
        type: "integer"
    },

    // Helper functions for arguments.
    parseInteger(client, val, msg){
            return client.registry.types.get("integer").parse(val, msg, this.integerArg)
    },

    isInteger(client, val, msg){ // really more like "canBeInteger", as opposed to "isInteger"
        return client.registry.types.get("integer").validate(val, msg, this.integerArg)
    },

    parseUser(client, val, msg){
        return client.registry.types.get("user").parse(val, msg, this.userArg)
    },

    isUser(client, val, msg){
        return client.registry.types.get("user").validate(val, msg, this.userArg)
    },

    parseMember(client, val, msg){
        return client.registry.types.get("member").parse(val, msg, this.memberArg)
    },

    isMember(client, val, msg){
        return client.registry.types.get("member").validate(val, msg, this.memberArg)
    },

    argError(msg, commandFormat){
      const argEmbed = new RichEmbed()
          .setColor(0x8B0000)
          .setAuthor(msg.member.displayName, msg.author.avatarURL)
          .setTitle("Invalid Arguments Provided")
          .setDescription("Command Usage: `" + msg.command.client.commandPrefix + msg.command.name + " " + commandFormat + "`")
          .setFooter("Please re-enter the command.")
          .setTimestamp(new Date())
        return argEmbed
    },

    async verifyUser(client, val, msg){
      let user = undefined
      if (await this.isUser(client, val, msg) == true){
        user = await this.parseUser(client, val, msg)
      }
      if (user == undefined){
        const argEmbed = new RichEmbed()
          .setColor(0x8B0000)
          .setAuthor(msg.member.displayName, msg.author.avatarURL)
          .setTitle("Invalid Arguments Provided")
          .setDescription("You entered an invalid user!\n\nCommand Usage: `" + msg.command.client.commandPrefix + msg.command.name + " " + msg.command.format + "`")
          .setFooter("Please re-enter the command.")
          .setTimestamp(new Date())
        msg.embed(argEmbed)
      }

      return user
    },

    async verifyMember(client, val, msg){
      let member = undefined
      if (await this.isMember(client, val, msg) == true){
        member = await this.parseMember(client, val, msg)
      }
      if (member == undefined){
        const argEmbed = new RichEmbed()
          .setColor(0x8B0000)
          .setAuthor(msg.member.displayName, msg.author.avatarURL)
          .setTitle("Invalid Arguments Provided")
          .setDescription("You entered an invalid member!\n\nCommand Usage: `" + msg.command.client.commandPrefix + msg.command.name + " " + msg.command.format + "`")
          .setFooter("Please re-enter the command.")
          .setTimestamp(new Date())
        msg.embed(argEmbed)
      }

      return member
    }


}
