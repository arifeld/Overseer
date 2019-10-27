const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// require base
const path = require('path')

const base    = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class MailBan extends Command {
	constructor(client) {
		super(client, {
			name: "mailban",
			group: "modmail",
			memberName: "mailban",
			description: "Bans a member from creating modmails. This action cannot be reversed.",
			userPermissions: ["MANAGE_GUILD"],
            args: [
                {
                  key: "message",
                  prompt: "what is the ban reason?",
                  type: "string"
                }
			]
		})
	}



	run(msg, args){
        const {message} = args


		var serverInfo        = base.getServerInfo(msg)
		let modMailIndex      = serverInfo.modMailIndex      || 0
		let modMailChannelsID = serverInfo.modMailChannelsID || {} // channels by user id.
		let modMailChannels   = serverInfo.modMailChannels   || {} // userids by channel
		let modMailCollectors = serverInfo.modMailCollectors || {}
		let modMailBanList    = serverInfo.modMailBanList    || []

		// Check to see if we are in an actual modmail channel.
		if (!msg.channel.id in modMailChannels){
			// We're not, so error out.
			const errorEmbed = new RichEmbed()
				.setColor(0xFF0000)
				.setTimestamp(new Date())
				.addField("Error:", "You are not in a valid modmail channel.")
			return msg.channel.embed(errorEmbed)
		}

		// We now want to add to the modMailBanList.
		// Obtain the ID of the user we want to ban.
		let bannedID = modMailChannels[msg.channel.id]

		// Add it to the banlist.
		modMailBanList.push(bannedID)

		// Let the user know they've been banned.
		const bannedEmbed = new RichEmbed()
			.setColor(0xFF0000)
			.setTitle("You have been banned from using the mod-mail feature.")
			.setTimestamp(new Date())
            .addField("Ban Reason:", message)
            .addField("Believe this to be an error?", "Unfortunately due to the nature of this system, you cannot appeal your ban without revealing your identity.\nIf you wish to appeal your ban, however, please contact one of the admins.")
        msg.guild.members.get(bannedID).createDM()
        .then( dmChannel => {
            dmChannel.send("[CHAT ENDED]", {embed: bannedEmbed})
        })

        // Let the mods know the command worked.
        const informEmbed = new RichEmbed()
            .setColor(0xFF0000)
            .setTitle("The user has been banned from the modmail feature.")
            .setDescription("You still need to end the chat using -end.")
            .setTimestamp(new Date())
        msg.embed(informEmbed)

		base.saveServerInfo(msg, serverInfo)


	}
}
