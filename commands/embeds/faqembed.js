const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class FAQEmbed extends Command {
	constructor(client) {
		super(client, {
			name: "faqembed",
			group: "embeds",
			memberName: "faqembed",
			guildOnly: true,
			description: "Updates the FAQ Embed.",
            ownerOnly: true,
            args: [
                {
                    key: "id",
                    prompt: "what is the embed id to edit?",
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
        const {id} = args;
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
                    //.setImage(temp)
                    .setColor(message.embeds[0].color)
                    .setTitle("Frequently Asked Questions")
                    .addField("**How do I verify?**", "Go to <#642254966811262986> and type `/verify`. This will give you access to the rest of the server.\n\n**Note:** if you joined from a discord bump list (such as Disboard, Open Bump, etc), you'll need to have a look at " + msg.guild.channels.get("751666079323127838") + " which contains information on how you need to verify!")
                    .addField("**How do I get a color role?**", "User colors can be bought with Teabags, our server's currency. These can be earned via a daily amount or gambling.\nYou can get different color roles by typing `+shop` in <#626964246693019679>.")
                    .addField("**How do I access the debate channel?**", "Type `/debate` in <#626964246693019679>. To hide the channel, simply retype `/debate`.")
                    .addField("**How do I contact the moderators via modmail?**", "To create an anonymous modmail with the staff team, DM <@617604252235202580> the word `modmail [optional reason]`.\n\nAfter that, just chat to us through the bot as if Overseer was a normal person. You do not need to use a prefix or anything like that :)\n\n*Please note that we can ban you from using modmail, so please do not abuse the system.*")
                    .addField("**What are the plural commands for / why is there people talking with a [BOT] tag?**", "This server has plural-friendly functionality - in essence, it allows specific people to talk via a proxy.\nIf you want more information on what plurality is, please type `+notabot`!\n\nYou can apply for access to these features if you require them below.")
                message.edit({embed: messageEmbed})
            })

    }
}
