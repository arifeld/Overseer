const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
// require base
const path = require('path')

const base    = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class ModMainReply extends Command {
	constructor(client) {
		super(client, {
			name: "reply",
			group: "modmail",
			memberName: "reply",
			description: "Sends an anonymous response to the modmail in a certain channel..",
			args: [
                {
                  key: "message",
                  prompt: "What message would you like to send?",
                  type: "string"
                }
			],
			userPermissions: ["MANAGE_MESSAGES"],
			aliases: ["r", "respond"]
		})
	}



	run(msg, args){
		const {message} = args;
		// Check if the user is in a DM.

		var serverInfo        = base.getServerInfo(msg)
		//let modMailIndex      = serverInfo.modMailIndex      || 0
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

		// We should be in the right channel, so let's send the message.
		// Send the message.
		// See if an embed as opposed to an actual message is worthwhile.
		// For now we will just use a message, because it probably looks better.
		let sendMessage = "**[Staff]:** " + message

		let messageOptions = {}
        if (msg.attachments.size !== 0){ // check if we have attachments, if so add them.
            let attachments = []
            msg.attachments.forEach( (attachment, key) => {
                attachments.push(attachment.url)
            })
            messageOptions.files = attachments
        }
		// Send the message
        console.log(modMailChannels)
        console.log(modMailChannels[msg.channel.id])
		msg.guild.members.get(modMailChannels[msg.channel.id]).user.send(sendMessage, messageOptions)


	}
}
