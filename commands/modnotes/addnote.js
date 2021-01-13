const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class AddNote extends Command {
	constructor(client) {
		super(client, {
			name: "addnote",
			group: "modnotes",
			memberName: "addnote",
			description: "Adds a mod-note to the specified user.",
			guildOnly: true,
            format: "<user> <note>",
            argsType: "multiple",
            argsCount:2
      /*args: [
          {
            key: "user",
            prompt: "which user would you look to add a mod-note to?",
            type: "member",
            validate: arg => { return true }
          },
          {
            key: "reason",
            prompt: "what do you want the note to say?",
            type: "string",
            validate: arg => { return true }
          }
      ]*/
		})
	}


	async run(msg, args){

        let user = null
        let reason = null

        if (args.length == 2){
            user = args[0]
            reason = args[1]
        }
        else{
            return msg.embed(base.argError(msg, msg.command.format))
        }

        // Verify the user is valid
        user = await base.verifyUser(this.client, user, msg) // this sends the error message for us
        if (user == undefined){ return }

        // fetch the user
        let guildMember = msg.guild.members.get(user.id)
        // Manually handle user permissions, because commando has terrible formatting.
        if (!msg.member.hasPermission("KICK_MEMBERS")){
            const errorEmbed = new RichEmbed()
                .setTitle("**You do not have permission to use this command!**")
                .setDescription("This command requires the 'Kick Members' permission.")
                .setAuthor((msg.member.nickname || msg.member.user.username), msg.member.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }


        let noteTimestamp = (new Date()).getTime()


        let serverInfo = base.getServerInfo(msg)
        var userID = user.id
        if (!("modNotes" in serverInfo)){
            serverInfo.modNotes = {}
        }

        let modNotes = serverInfo.modNotes

        let noteObject = {
            note: reason,
            timestamp: noteTimestamp,
            mod: msg.member.id
        }

        // Add data to the table.
        if (userID in modNotes){
          modNotes[userID].push(noteObject)
        }
        else {
          modNotes[userID] = [noteObject]
        }

        const embed = new RichEmbed()
            .addField("**Successfully added the mod-note.**", user + " - " + reason + " - added by " + msg.member)
            .setTimestamp(noteTimestamp)
            .setColor(0xd3d3d3)

        msg.channel.send(embed)
            .then(embedMsg => {
                const logEmbed = new RichEmbed()
                .setColor(0xFFA500)
                .addField("**New Mod Action:**", msg.member + " added a mod-note to " + (user || user.user.username) + " - `" + reason + "`")
                .addField("Command:", "[View Message](" + embedMsg.url + ")")
                .setTimestamp(new Date())
                msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
            })

        base.saveServerInfo(msg, serverInfo)
	 }
}
