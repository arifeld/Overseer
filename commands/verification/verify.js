const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")
const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

const humanizeDuration = require("humanize-duration")

module.exports = class Verify extends Command {
	constructor(client) {
		super(client, {
			name: "verify",
			group: "verification",
			memberName: "verify",
			description: "If you are new to the server, please run this command to be verified.",
			guildOnly: true,
		})
	}


	run(msg, args){
        let mainChannel = "625291119604793344"
    	let serverInfo = base.getServerInfo(msg)
        let verifyChannel = botConfig.verificationChannel
        let unverifiedRole = botConfig.unverifiedRole
        if (msg.channel.id !== verifyChannel){
          return
        }
        // Check if the user has the "Unverified Role"
        if (!msg.member.roles.has(unverifiedRole)){
          return
        }

        // Delete the verified role.
        msg.member.removeRole(unverifiedRole)
        msg.member.addRole(botConfig.memberRole)
        const verifyEmbed = new RichEmbed()
            .setDescription("Successfully verified - verification time " + humanizeDuration( (new Date()).getTime() - msg.member.joinedTimestamp) + ".")
        msg.embed(verifyEmbed)

        return msg.guild.channels.get(mainChannel).send("Everyone say welcome to " + msg.member + "! " + msg.guild.roles.get("762777006046707732"))

    }
}
