
// Discord.js modules
const {
    Command
} = require("discord.js-commando");
const {
    RichEmbed
} = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base = require(path.join(__dirname, "../../custom_modules/base.js"))




module.exports = class ClearQOTD extends Command {
    constructor(client) {
        super(client, {
            name: "clearqotd",
            group: "qotd",
            memberName: "clearqotd",
            description: "Clears all messages from the QOTD queue. Admin only.",
            guildOnly: true,
            argsType: "single"

            /*
      args: [
          {
      		key: "user",
      		prompt: "which user would you look to kick?",
      		type: "member"
      	},
      	{
      		key: "reason",
      		prompt: "what is the kick reason?",
      		type: "string"
      	}
			]*/
        })
    }


    async run(msg, args) {

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("ADMINISTRATOR") && !msg.member.id == "139279634796773376") {
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Administrator' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        // Make sure they have confirmed it
        if (args !== "confirm"){
            const errorEmbed = new RichEmbed()
                .setTitle("Confirmation Required")
                .setColor(0xFF0000)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .addField("WARNING:", "This command will erase **EVERY** QOTD currently in the queue. To confirm you want to do this, run `/clearqotd confirm`. This cannot be undone.")

            return msg.embed(errorEmbed)
        }
        else {
            let serverInfo = base.getServerInfo(msg)
            serverInfo.qotdList = []
    
            const embed = new RichEmbed()
                .setColor(0xFF0000)
                .setTitle("QOTD Queue Cleared")
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setTimestamp(new Date())
            msg.embed(embed)                
    
            return base.saveServerInfo(msg, serverInfo)
        }
        
    }
}
