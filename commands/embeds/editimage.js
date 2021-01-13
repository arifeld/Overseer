const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class EditEmbedImage extends Command {
	constructor(client) {
		super(client, {
			name: "editimage",
			group: "embeds",
			memberName: "editimage",
			guildOnly: true,
			description: "Converts a message image into an embed image.",
            args: [
                {
                    key: "id",
                    prompt: "what is the embed id to edit?",
                    type: "string"
                },
                {
                    key: "imagelink",
                    prompt: "what is the image link?",
                    type: "string"
                }
                /*{
                    key: "temp",
                    prompt: "temp",
                    type: "string"
                }*/
            ]
		})
	}


	run(msg, args){
        const {id, imagelink} = args;
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
                const messageEmbed = new RichEmbed()
                    .setImage(imagelink)
                    //.setImage(temp)
                    .setColor(message.embeds[0].color)
                message.edit({embed: messageEmbed})
            })

    }
}
