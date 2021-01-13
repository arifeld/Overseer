const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

module.exports = class PurgeText extends Command {
	constructor(client) {
		super(client, {
			name: "purge",
			group: "mod_utility",
			memberName: "purge",
			description: "Purge a specific amount of messages in the selected channel. Doesn't delete pinned messages!",
			examples: ["purge 99"],
			guildOnly: true,
			format: "<amount between 0 and 99>",
			/*args: [
				{
					key: "amount",
					prompt: "how many messages do you want to delete?",
					type: "integer",
					default: "INVALID_ARGUMENT",
          validate: arg => {
              return true
          }

				}
			]*/
		})
	}

	async run(msg, args){
		let amount = parseInt(args, 10)



        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("MANAGE_CHANNELS") || !msg.member.hasPermission("MANAGE_MESSAGES")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Manage Channels' and 'Manage Messages' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        // Argument handling:
        if (typeof(amount) !== "number" || amount <= 0 || amount > 99 || isNaN(amount)){
            const argEmbed = new RichEmbed()
                .setColor(0x8B0000)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setTitle("Invalid Arguments Provided")
                .setDescription( "Command Usage: `" + this.client.options.commandPrefix + "purge <# of messages to delete between 1 and 99>`")
                .setFooter("Please re-enter the command.")
                .setTimestamp(new Date())
            return msg.embed(argEmbed)
        }

        // Because we don't want to delete pinned messages:


		var messages = await msg.channel.fetchMessages({limit: amount+1});
		var pinned   = await msg.channel.fetchPinnedMessages()
		var newmessages = messages.filter(message => !(pinned.has(message.id)));


		msg.channel.bulkDelete(newmessages, true)
			.catch(console.error)

        //this.client.emit("messageDeleteBulk", newmessages)

        const completeEmbed = new RichEmbed()
            .setColor(0x00FF00)
            .setAuthor(msg.member.displayName, msg.author.avatarURL)
            .setDescription("Successfully purged " + newmessages.size.toString() + " messages.\n\nThis message will automatically delete in ten seconds.")
        msg.embed(completeEmbed)
            .then( message => {
                message.delete(10000)
            })

	}

}
