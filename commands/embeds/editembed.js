const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class EditTEmbed extends Command {
	constructor(client) {
		super(client, {
			name: "editembed",
			group: "embeds",
			memberName: "editembed",
			guildOnly: true,
			description: "Edits an embed based on user input with extended parameters.",
            args: [
                {
                    key: "id",
                    prompt: "what is the embed id to edit?",
                    type: "string"
                },
                {
                    key: "title",
                    prompt: "what is the title of the embed?",
                    type: "string"
                },
                {
                  key: "content",
                  prompt: "what do you want the embed to say? You can use markdown formatting.",
                  type: "string"
                },
            ]
		})
	}


	run(msg, args){
        const {id, title, content} = args;
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

        // Send embed.


        const messageEmbed = new RichEmbed()
            .setTitle(title)
            .setDescription(content)
        msg.channel.fetchMessage(id)
            .then (message => {
							messageEmbed.setColor(message.embeds[0].color)
                message.edit({embed: messageEmbed})
            })
    }
}
