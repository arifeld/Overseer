const { Command } = require("discord.js-commando");
const { Attachment, RichEmbed } = require('discord.js'); // required for message embedding.
const path = require("path")
const base = require(path.join(__dirname, "../../custom_modules/base.js"))


module.exports = class ImageSend extends Command {
	constructor(client) {
		super(client, {
			name: "image",
			group: "embeds",
			memberName: "image",
			description: "Displays the given link as an image",
			guildOnly: true,
      args: [


        {
          key: "link",
          prompt: "what is the link to the image you want to display?",
          type: "string",
      },

        {
            key: "color",
            prompt: "what should the embed colour be?",
            type: "string"
        },
      ]

	})
	}


	run(msg, args){

    const {color, link} = args;


    if (!msg.member.hasPermission("MANAGE_MESSAGES")){
      const errorEmbed = new RichEmbed()
        .setTitle("**You do not have permission to use this command!**")
        .setDescription("This command requires the 'Manage Messages' permission.")
        .setAuthor(msg.member.displayName, msg.author.avatarURL)
        .setColor(0x0000FF)
      return msg.embed(errorEmbed)
    }

    const messageEmbed = new RichEmbed()
        .setColor(color)
        .setImage(link)

    msg.channel.send({ embed: messageEmbed})
        .catch(console.error)

  }
}
