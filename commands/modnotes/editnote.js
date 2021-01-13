const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const path = require("path")

const botConfig = require(path.join(__dirname, "../../settings/botConfig.json"))
const base = require(path.join(__dirname, "../../custom_modules/base.js"))

module.exports = class EditNote extends Command {
	constructor(client) {
		super(client, {
			name: "editnote",
			group: "modnotes",
			memberName: "editnote",
			description: "Edits a mod-note for the specified user.",
      format: "<user> <note number> <new note reason>",
			guildOnly: true,
      args: [
          {
            key: "user",
            prompt: "which user would you like to add a mod-note to?",
            type: "member"
          },
          {
              key: "noteNum",
              prompt: "which note do you want to edit?",
              type: "integer"
          },
          {
            key: "reason",
            prompt: "what do you want the note to say?",
            type: "string"
          }
      ]
		})
	}


	run(msg, args){
        const {user, noteNum, reason} = args;

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

        // Get the note that we want.
        let previousNote = undefined
        let previousTimestamp = undefined
        if (userID in modNotes){
            let wantedNote = modNotes[userID][noteNum-1]
            console.log(wantedNote)
            console.log(modNotes)
            if (wantedNote == undefined){ // doesn't exist
                const errorEmbed = new RichEmbed()
                    .addField("**ERROR!**", "There is no Note `" + noteNum + "` for " + user + "!")
                    .setAuthor( (user.nickname || user.user.username), user.user.avatarURL)
                    .setColor(0xFF0000)
                return msg.embed(errorEmbed)
            }
            // Does exist, is this the person who created the note?
            if (wantedNote.mod !== msg.member.id){
                const errorEmbed = new RichEmbed()
                    .setTitle("**You can only edit notes that you created!**")
                    .setAuthor( (user || user.user.username), user.user.avatarURL)
                    .setColor(0xFF0000)
                return msg.embed(errorEmbed)
            }

            // Okay, now let's edit:
            // Begin by saving previous info
            previousNote = wantedNote.note
            previousTimestamp = wantedNote.timestamp

            wantedNote.note = reason
            wantedNote.timestamp = noteTimestamp
            wantedNote.edited = true

        }
        else{
            const errorEmbed = new RichEmbed()
                .setTitle("**That user has no associated mod-notes!**")
                .setAuthor( (user || user.user.username), user.user.avatarURL)
                .setColor(0xFF0000)
            return msg.embed(errorEmbed)
        }


        const embed = new RichEmbed()
            .addField("**Successfully edited the mod-note.**", "Note `" + noteNum + "` - " + user + " - " + reason + " - edited by " + msg.member)
            .addField("**Previous Reason:**", previousNote, true)
            .addField("**Previous Timestamp**", (new Date(previousTimestamp)).toUTCString(), true)
            .setTimestamp(noteTimestamp)
            .setColor(0xd3d3d3)

        msg.channel.send(embed)
            .then(embedMsg => {
                const logEmbed = new RichEmbed()
                .setColor(0xFFA500)
                .addField("**New Mod Action:**", msg.member + " edited mod-note `" + noteNum + "` of " + (user || user.user.username) + " - `" + reason + "`")
                .addField("Command:", "[View Message](" + embedMsg.url + ")")
                .setTimestamp(new Date())
                msg.guild.channels.get(botConfig.modLogChannel).send({embed: logEmbed})
            })

        base.saveServerInfo(msg, serverInfo)
	 }
}
