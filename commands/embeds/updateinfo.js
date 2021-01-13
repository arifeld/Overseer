const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class UpdateInfo extends Command {
	constructor(client) {
		super(client, {
			name: "updateinfo",
			group: "embeds",
			memberName: "updateinfo",
			guildOnly: true,
			description: "Does what it is meant to.",
            ownerOnly: true,
		})
	}


	run(msg, args){

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("BAN_MEMBERS")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Ban Members' permission.")
                .setAuthor(msg.member.displayName, msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }


        msg.channel.fetchMessages()
            .then (messages => {
                let sendEmbeds = []
                // iterate over all the messages
                messages.forEach( (message, key) => {
                    if (message.attachments.size !== 0){
                        const messageEmbed = new RichEmbed()
                            .setImage(message.attachments.first().proxyURL)
                        sendEmbeds.unshift(messageEmbed)
                        //msg.channel.send({embed: messageEmbed})
                    }

                    if (message.embeds.length !== 0){
                        let mEmbed = message.embeds[0]
                        const messageEmbed2 = new RichEmbed()
                            .setColor(mEmbed.color)

                        if (mEmbed.title !== undefined){
                            messageEmbed2.setTitle(mEmbed.title)
                        }
                        if (mEmbed.description !== undefined){
                            messageEmbed2.setDescription(mEmbed.description)
                        }
                        if (mEmbed.fields !== undefined){
                            messageEmbed2.fields = mEmbed.fields
                        }
                        sendEmbeds.unshift(messageEmbed2)
                        //msg.channel.send({embed: messageEmbed2})
                    }
                })

                // now send
                for (let i=0; i<sendEmbeds.length; i++){
                    msg.channel.send({embed: sendEmbeds[i]})
                }

            })
    }
}
