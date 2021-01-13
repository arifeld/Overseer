const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class CreateEmbed extends Command {
	constructor(client) {
		super(client, {
			name: "embed",
			group: "embeds",
			memberName: "embed",
			guildOnly: true,
			description: "Creates an embed based on user input.",
            args: [
                {
                  key: "content",
                  prompt: "what do you want the embed to say? You can use markdown formatting.",
                  type: "string"
                },
            ]
		})
	}


	run(msg, args){
        const {content} = args;
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
            .setDescription(content)
            .setTimestamp(new Date())
        return msg.embed(messageEmbed)
    }
}
