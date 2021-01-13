const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class EditEmbedColor extends Command {
	constructor(client) {
		super(client, {
			name: "editcolor",
			group: "embeds",
			memberName: "editcolor",
			guildOnly: true,
			description: "Edits an embed color.",
            args: [
                {
                    key: "id",
                    prompt: "what is the embed id to edit?",
                    type: "string"
                },
                {
                    key: "color",
                    prompt: "what is the hex val of the color you want?",
                    type: "string"
                }
            ]
		})
	}


	run(msg, args){
        const {id, color} = args;
        msg.delete()
        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("BAN_MEMBERS")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Ban Members' permission.")
                .setAuthor(msg.member.displayName, msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        msg.channel.fetchMessage(id)
            .then(message => {
                let mEmbed = message.embeds[0]
                const messageEmbed = new RichEmbed()
                    .setColor(color)

                if (mEmbed.title !== undefined){
                    messageEmbed.setTitle(mEmbed.title)
                }
                if (mEmbed.description !== undefined){
                    messageEmbed.setDescription(mEmbed.description)
                }
                if (mEmbed.fields !== undefined){
                    messageEmbed.fields = mEmbed.fields
                }
                if (message.embeds[0].image !== null){
                    messageEmbed.setImage(mEmbed.image.proxyURL)
                }

                message.edit({embed: messageEmbed})
            })

    }
}
