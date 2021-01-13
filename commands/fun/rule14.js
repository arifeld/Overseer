const { Command } = require("discord.js-commando");
const { Attachment, RichEmbed } = require('discord.js'); // required for message embedding.
const path = require("path")

module.exports = class Rule14 extends Command {
	constructor(client) {
		super(client, {
			name: "rule14",
			group: "fun",
			memberName: "rule14",
			description: "Obey rule 14 nerds",
			guildOnly: true
		})
	}


	run(msg){

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("MANAGE_MESSAGES")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Manage Messages' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        // Get the image
        const attachment = new Attachment(path.join(__dirname, "../../rule14.png"), "rule14.png")
        const imageEmbed = new RichEmbed()
            .attachFile(attachment)
            .setImage('attachment://rule14.png')
        msg.embed(imageEmbed)
    }
}
