// Discord.js modules
const {
    Command
} = require("discord.js-commando");
const {
    RichEmbed
} = require('discord.js'); // required for message embedding.
// Node modules
const path = require("path")
// Custom modules.
const base = require(path.join(__dirname, "../../custom_modules/base.js"))




module.exports = class InsertQOTD extends Command {
    constructor(client) {
        super(client, {
            name: "insertqotd",
            group: "qotd",
            memberName: "insertqotd",
            description: "Insert a QOTD into a specific spot in the queue.",
            guildOnly: true,
            format: "<position> <question>",
            argsType: "multiple",
            argsCount: 2

            /*
      args: [
          {
      		key: "user",
      		prompt: "which user would you look to kick?",
      		type: "member"
      	},
      	{
      		key: "reason",
      		prompt: "what is the kick reason?",
      		type: "string"
      	}
			]*/
        })
    }


    async run(msg, args) {

        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("KICK_MEMBERS") && !msg.member.roles.has(botConfig.QOTDRole)) {
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Kick Members' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }

        if (args.length == 0){
            return msg.embed(base.argError(msg, msg.command.format))
        }
        else if (args.length == 1){
            return msg.embed(base.argError(msg, msg.command.format))
        }
        // We need to see if the first value is not a number
        else if (isNaN(Number(args[0])) || Number(args[0]) < 0 || !Number.isInteger(Number(args[0]))){
            return msg.embed(base.argError(msg, msg.command.format))
        }

        
        let serverInfo = base.getServerInfo(msg)
        let QOTDList = serverInfo.qotdList
        let insertNumber = Number(args[0])
        let question = args[1]

        // QOTDList is empty?
        if (QOTDList.length == 0){
            const emptyEmbed = new RichEmbed()
                .setColor(0xFF0000)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setTitle("There are no Questions of the Day to insert into!")
                .setDescription("Yes, this could just insert it, but that would be the less lazy approach! Sorry about that.")
                .setFooter("You should add some using `/addqotd <question>`")

            return msg.embed(emptyEmbed)
        }


        // Check to see if args is legit
        if (insertNumber < 1 || insertNumber > QOTDList.length+1){
            const errorEmbed = new RichEmbed()
                .setTitle("The argument you specified is invalid!")
                .setDescription(`Command Syntax: \`/insertqotd <number between 1 and ${QOTDList.length}> <question>\``)
                .setAuthor(msg.member.displayName, msg.author.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }   

        // Otherwise splice the specific value
        QOTDList.splice(insertNumber-1, 0, {
            question: question,
            user: msg.member.id
        })

        // Display and save
        const successEmbed = new RichEmbed()
            .setColor(0x006400)
            .setTitle("Successfully inserted a new QOTD")
            .addField("Question of the Day:", question)
            .setAuthor(msg.member.displayName, msg.author.avatarURL)
            .setFooter("Type /qotdlist to view the full QOTD list!")
            .setTimestamp(new Date())
        msg.embed(successEmbed)

        return base.saveServerInfo(msg, serverInfo)
    }
}
