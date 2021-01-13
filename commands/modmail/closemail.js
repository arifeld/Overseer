const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.
const path = require('path')
const humanizeDuration = require("humanize-duration")

const base    = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class CloseModMail extends Command {
	constructor(client) {
		super(client, {
			name: "closemodmail",
			group: "modmail",
			memberName: "closemodmail",
			description: "Ends a modmail.",
			userPermissions: ["BAN_MEMBERS"],
			aliases: ["endmail", "end", "close"]
		})
	}



	run(msg){
		// Check if the user is in a DM.
        if (msg.channel.type !== "text"){ return }

		var serverInfo        = base.getServerInfo(msg)
		//let modMailIndex      = serverInfo.modMailIndex      || 0
		let modMailChannelsID = serverInfo.modMailChannelsID || {} // channels by user id.
		let modMailChannels   = serverInfo.modMailChannels   || {} // userids by channel
		let modMailCollectors = serverInfo.modMailCollectors || {}
		//let modMailBanList    = serverInfo.modMailBanList    || []


		// Check to see if we are in an actual modmail channel.
		if (!(msg.channel.id in modMailChannels)){
			// We're not, so error out.
			const errorEmbed = new RichEmbed()
				.setColor(0xFF0000)
				.setTimestamp(new Date())
				.addField("**Error:**", "You are not in a valid modmail channel.")
			return msg.channel.send({embed: errorEmbed})
		}

		// We're in a channel, so delete the channel and delete the object references.
		//msg.channel.delete()

        // New change, simply set it to "closed"
        msg.channel.setName("closed-" + msg.channel.name, "Modmail closed by " + msg.member.displayName)

		// Delete the object references, but first send a "mod mail has been closed" message.

		const closedEmbed = new RichEmbed()
			.setTitle("This modmail has been closed.")
			.setColor(0xFF0000)


        if (this.client.guilds.get("585994345086451723").members.get(modMailChannels[msg.channel.id]) !== undefined){
            this.client.guilds.get("585994345086451723").members.get(modMailChannels[msg.channel.id]).createDM()
            .then(dmChannel => {
                dmChannel.send("[CHAT ENDED]", {embed: closedEmbed})
            })
        }




		// Now delete all the references.
		let tempuserID = modMailChannels[msg.channel.id]
		delete modMailChannels[msg.channel.id]
		delete modMailChannelsID[tempuserID]

		// Now delete the reference.
		delete modMailCollectors[msg.channel.id]

        // Log some info to the chat.
        const infoEmbed = new RichEmbed()
            .setColor(0xFFFFFF)
            .setTitle("This modmail has been closed.")
            .setDescription("Modmail duration: " + humanizeDuration(Date.now() - msg.channel.createdTimestamp) + ".")

        msg.embed(infoEmbed)
		// Save.
		base.saveServerInfo(msg, serverInfo)


	}
}
