const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class ServerInfo extends Command {
	constructor(client) {
		super(client, {
			name: "serverinfo",
			group: "mod_utility",
			memberName: "serverinfo",
			description: "Displays information about the server.",
            guildOnly: true
		})
	}


	run(msg){
        const infoEmbed = new RichEmbed()
            .setColor(0xFF007F)
            .setFooter("ID: " + msg.guild.id +  " - Server Created " + msg.guild.createdAt.toDateString())
            .setAuthor(msg.guild.name, msg.guild.iconURL)
            .addField("**Owner:**", msg.guild.owner.user.username + "#" + msg.guild.owner.user.discriminator, true)
            .addField("**Region:**", msg.guild.region, true)
            .addField("**Roles:**", msg.guild.roles.size, true)

        // Now we need to do some comparisons.
        let categories = 0
        let textChannels = 0
        let voiceChannels = 0
        let unknownChannels = false

        // Iterate over every channel, incrementing the counters as required.
        msg.guild.channels.forEach( (channel, key) => {
            if (channel.type == "text"){
                textChannels++
                return
            }
            else if (channel.type == "voice"){
                voiceChannels++
                return
            }
            else if (channel.type == "category"){
                categories++
                return
            }
            else{
                // Presume it's a textchannel.
                textChannels++
                unknownChannels = true
                return
            }
        })

        infoEmbed.addField("**Channel Categories:**", categories, true)
        infoEmbed.addField("**Text Channels:**", textChannels + (unknownChannels ? "*" : ""), true)
        infoEmbed.addField("**Voice Channels:**", voiceChannels, true)
        infoEmbed.addField("**Member Count:**", msg.guild.memberCount, true)

        // Now we need to iterate over every member.
        let humanCount = msg.guild.memberCount

        msg.guild.members.forEach( (member, key) => {
            if (member.user.bot){
                humanCount--
                return
            }
        })

        // Now we know how many humans there are, and can just subtract to find the number of bots.
        infoEmbed.addField("**Humans:**", humanCount, true)
        infoEmbed.addField("**Bots:**", msg.guild.memberCount - humanCount, true)

        // And send.
        msg.embed(infoEmbed)


    }
}
